use std::sync::Arc;

use chrono::{DateTime, Utc};
use google_generative_ai_rs::v1::{
    api::{Client, PostResult},
    errors::GoogleAPIError,
    gemini::{
        request::{GenerationConfig, Request, SystemInstructionContent, SystemInstructionPart},
        Content, Model, Part, Role,
    },
};
use log::{debug, error, info};
use serde_json::Value;
use tokio::sync::{mpsc, oneshot, Mutex};

use crate::models::{ScrapeParams, UsageMetadata, WebSocketMessage};
use crate::{error::AppError, models::AiScrapingResult};
use crate::{services::WebSocketService, utils::calculate_price};

pub enum AIResponse {
    JsonArray(Vec<Value>),
    JsonObject(Value),
    Text(String),
}

pub struct AIService {
    client: Arc<Mutex<Option<Client>>>,
    websocket_service: Arc<WebSocketService>,
    current_scraping_result: Arc<Mutex<Option<AiScrapingResult>>>,
}

impl AIService {
    pub fn new(websocket_service: Arc<WebSocketService>) -> Self {
        debug!("Initializing AIService");
        info!("AIService initialized successfully");
        Self {
            client: Arc::new(Mutex::new(None)),
            websocket_service,
            current_scraping_result: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn set_api_key(&self, api_key: &str) {
        let mut client = self.client.lock().await;
        *client = Some(Client::new_from_model(
            Model::Gemini1_5Flash,
            api_key.to_string(),
        ));
    }

    pub async fn extract_items(
        &self,
        html: &str,
        params: &ScrapeParams,
    ) -> Result<AIResponse, AppError> {
        let start_time = Utc::now();
        self.initialize_scraping_result(start_time, params.model.clone())
            .await;

        debug!("Extracting items with params: {:?}", params);
        self.set_api_key(&params.api_key).await;
        let system_prompt = self.build_system_prompt();
        let user_prompt = self.build_prompt(html, params);
        let request = self.build_request(system_prompt, user_prompt);

        self.websocket_service
            .send_message(WebSocketMessage::progress("Starting AI processing..."))
            .await?;

        let response = self.process_ai_request(request).await?;
        let result = self.handle_ai_response(response).await?;

        self.finalize_scraping_result(true, None).await;
        Ok(result)
    }

    async fn process_ai_request(&self, request: Request) -> Result<String, AppError> {
        let (tx, mut rx) = mpsc::channel(100);
        let (done_tx, done_rx) = oneshot::channel();

        self.spawn_ai_processing_task(request, tx, done_tx);

        let mut full_response = String::new();
        self.collect_ai_response(&mut rx, done_rx, &mut full_response)
            .await?;

        debug!(
            "AI response received, length: {} characters",
            full_response.len()
        );
        Ok(full_response)
    }

    fn spawn_ai_processing_task(
        &self,
        request: Request,
        tx: mpsc::Sender<String>,
        done_tx: oneshot::Sender<Result<(), AppError>>,
    ) {
        let client = self.client.clone();
        let websocket_service = self.websocket_service.clone();
        let current_scraping_result = self.current_scraping_result.clone();
        tokio::spawn(async move {
            if let Some(client) = client.lock().await.as_ref() {
                match client.post(30, &request).await {
                    Ok(response) => {
                        Self::handle_successful_response(
                            response,
                            tx,
                            done_tx,
                            current_scraping_result,
                        )
                        .await
                    }
                    Err(e) => Self::handle_failed_response(e, websocket_service, done_tx).await,
                }
            }
        });
    }

    async fn handle_successful_response(
        response: PostResult,
        tx: mpsc::Sender<String>,
        done_tx: oneshot::Sender<Result<(), AppError>>,
        current_scraping_result: Arc<Mutex<Option<AiScrapingResult>>>,
    ) {
        info!("AI Response: {:?}", response);
        if let Some(stream_response) = response.rest() {
            if let Some(candidate) = stream_response.candidates.first() {
                if let Some(part) = candidate.content.parts.first() {
                    if let Some(text) = part.text.as_ref() {
                        let _ = tx.send(text.to_string()).await;
                    }
                }
                if let Some(finish_reason) = candidate.finish_reason.as_ref() {
                    info!("AI processing completed: {:?}", finish_reason);
                }
            }
            if let Some(usage_metadata) = stream_response.usage_metadata {
                info!("Usage metadata: {:?}", usage_metadata);
                let mut result = current_scraping_result.lock().await;
                if let Some(ref mut r) = *result {
                    r.usage_metadata.input_tokens = usage_metadata.prompt_token_count;
                    r.usage_metadata.output_tokens = usage_metadata.candidates_token_count;
                    r.usage_metadata.total_cost = calculate_price(
                        &r.model,
                        r.usage_metadata.input_tokens,
                        r.usage_metadata.output_tokens,
                    );
                }
            }
        }
        let _ = done_tx.send(Ok(()));
    }

    async fn handle_failed_response(
        e: GoogleAPIError,
        websocket_service: Arc<WebSocketService>,
        done_tx: oneshot::Sender<Result<(), AppError>>,
    ) {
        let error_msg = format!("AI processing failed: {}", e);
        error!("{}", error_msg);
        let _ = websocket_service
            .send_message(WebSocketMessage::error(&error_msg))
            .await;
        let _ = done_tx.send(Err(AppError::AI(e.to_string())));
    }

    async fn collect_ai_response(
        &self,
        rx: &mut mpsc::Receiver<String>,
        mut done_rx: oneshot::Receiver<Result<(), AppError>>,
        full_response: &mut String,
    ) -> Result<(), AppError> {
        loop {
            tokio::select! {
                Some(chunk) = rx.recv() => {
                    full_response.push_str(&chunk);
                    self.websocket_service
                        .send_message(WebSocketMessage::scraping_result(&chunk))
                        .await?;
                }
                result = &mut done_rx => {
                    return self.handle_done_signal(result).await;
                }
            }
        }
    }

    async fn handle_done_signal(
        &self,
        result: Result<Result<(), AppError>, oneshot::error::RecvError>,
    ) -> Result<(), AppError> {
        match result {
            Ok(Ok(())) => {
                self.websocket_service
                    .send_message(WebSocketMessage::progress("AI processing completed"))
                    .await?;
                Ok(())
            }
            Ok(Err(e)) => Err(e),
            Err(e) => {
                let error_msg = format!("AI processing task failed unexpectedly: {}", e);
                error!("{}", error_msg);
                self.websocket_service
                    .send_message(WebSocketMessage::error(&error_msg))
                    .await?;
                Err(AppError::AI(
                    "AI processing task failed unexpectedly".to_string(),
                ))
            }
        }
    }

    async fn handle_ai_response(&self, full_response: String) -> Result<AIResponse, AppError> {
        match self.parse_ai_response(&full_response) {
            Ok(parsed_response) => {
                info!("Successfully processed AI response");
                match parsed_response {
                    AIResponse::JsonArray(ref json_array) => {
                        for item in json_array {
                            self.store_scraped_item(item.clone()).await;
                        }
                        self.websocket_service
                            .send_message(WebSocketMessage::success(&json_array))
                            .await?;

                        Ok(parsed_response)
                    }
                    AIResponse::JsonObject(ref json_object) => {
                        self.store_scraped_item(json_object.clone()).await;
                        self.websocket_service
                            .send_message(WebSocketMessage::success(&json_object))
                            .await?;

                        Ok(parsed_response)
                    }
                    AIResponse::Text(ref text) => {
                        self.websocket_service
                            .send_message(WebSocketMessage::scraping_result(&text))
                            .await?;

                        Ok(parsed_response)
                    }
                }
            }
            Err(e) => {
                let error_msg = format!("Failed to parse AI response: {}", e);
                error!("{}", error_msg);
                self.finalize_scraping_result(false, Some(error_msg.clone()))
                    .await;
                self.websocket_service
                    .send_message(WebSocketMessage::error(&error_msg))
                    .await?;
                Err(e)
            }
        }
    }

    fn build_prompt(&self, html: &str, params: &ScrapeParams) -> String {
        let tags = params.tags.join(", ");
        format!(
            r#"Extract the following information: {}.
    Return the result as a JSON array of objects, where each object represents an item with the specified fields.
    Only include the JSON array in your response, nothing else.

    HTML:
    {}
    "#,
            tags, html
        )
    }

    fn build_system_prompt(&self) -> String {
        r#"You are an intelligent text extraction and conversion assistant. Your task is to extract structured information 
    from the given HTML and convert it into a pure JSON format. The JSON should contain only the structured data extracted from the HTML, 
    with no additional commentary, explanations, or extraneous information. 
    You may encounter cases where you can't find the data for the fields you need to extract, or the data may be in a foreign language.
    Process the following HTML and provide the output in pure JSON format with no words before or after the JSON.
    "#.to_string()
    }

    fn build_request(&self, system_prompt: String, user_prompt: String) -> Request {
        Request {
            contents: vec![Content {
                role: Role::User,
                parts: vec![Part {
                    text: Some(user_prompt),
                    inline_data: None,
                    file_data: None,
                    video_metadata: None,
                }],
            }],
            tools: vec![],
            safety_settings: vec![],
            generation_config: Some(GenerationConfig {
                temperature: None,
                top_p: None,
                top_k: None,
                candidate_count: None,
                max_output_tokens: Some(8192),
                stop_sequences: None,
                response_mime_type: Some("application/json".to_string()),
            }),
            system_instruction: Some(SystemInstructionContent {
                parts: vec![SystemInstructionPart {
                    text: Some(system_prompt),
                }],
            }),
        }
    }

    fn parse_ai_response(&self, response: &str) -> Result<AIResponse, AppError> {
        debug!("Parsing AI response");

        // Try parsing as JSON array first
        if let Ok(json_array) = serde_json::from_str::<Vec<Value>>(response) {
            return Ok(AIResponse::JsonArray(json_array));
        }

        // Try parsing as JSON object
        if let Ok(json_object) = serde_json::from_str::<Value>(response) {
            return Ok(AIResponse::JsonObject(json_object));
        }

        // If not JSON, return as plain text
        Ok(AIResponse::Text(response.to_string()))
    }

    pub async fn store_scraped_item(&self, item: serde_json::Value) {
        let mut result = self.current_scraping_result.lock().await;
        if let Some(ref mut r) = *result {
            r.scraped_items.push(item);
        }
    }

    async fn initialize_scraping_result(&self, start_time: DateTime<Utc>, model: String) {
        let mut result = self.current_scraping_result.lock().await;
        *result = Some(AiScrapingResult {
            model,
            start_time,
            end_time: start_time,
            success: false,
            error_message: None,
            scraped_items: Vec::new(),
            usage_metadata: UsageMetadata {
                input_tokens: 0,
                output_tokens: 0,
                total_cost: 0.0,
            },
            duration_ms: 0,
        });
    }

    async fn finalize_scraping_result(&self, success: bool, error_message: Option<String>) {
        let mut result = self.current_scraping_result.lock().await;
        if let Some(ref mut r) = *result {
            r.end_time = Utc::now();
            r.duration_ms = (r.end_time - r.start_time).num_milliseconds();
            r.success = success;
            r.error_message = error_message;
        }
    }

    pub async fn get_current_scraping_result(&self) -> Option<AiScrapingResult> {
        let result = self.current_scraping_result.lock().await;
        result.clone()
    }

    pub async fn clear_current_scraping_result(&self) {
        let mut result = self.current_scraping_result.lock().await;
        *result = None;
    }
}
