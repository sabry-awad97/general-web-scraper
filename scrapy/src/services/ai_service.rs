use std::sync::Arc;

use google_generative_ai_rs::v1::{
    api::Client,
    gemini::{
        request::{GenerationConfig, Request, SystemInstructionContent, SystemInstructionPart},
        Content, Part, Role,
    },
};
use log::{debug, error, info};
use tokio::sync::mpsc;

use crate::error::AppError;
use crate::models::{ScrapeParams, WebSocketMessage};
use crate::services::WebSocketService;

pub struct AIService {
    client: Arc<Client>,
    websocket_service: Arc<WebSocketService>,
}

impl AIService {
    pub fn new(api_key: &str, websocket_service: Arc<WebSocketService>) -> Result<Self, AppError> {
        debug!("Initializing AIService");

        let client = Client::new_from_model(
            google_generative_ai_rs::v1::gemini::Model::Gemini1_5Flash,
            api_key.to_string(),
        );

        info!("AIService initialized successfully");
        Ok(Self {
            client: Arc::new(client),
            websocket_service,
        })
    }

    pub async fn extract_items(
        &self,
        html: &str,
        params: &ScrapeParams,
    ) -> Result<Vec<serde_json::Value>, AppError> {
        debug!("Extracting items with params: {:?}", params);
        let prompt = self.build_prompt(html, params);
        let request = self.build_request(prompt);

        let (tx, mut rx) = mpsc::channel(100);

        self.websocket_service
            .send_message(WebSocketMessage::text("Starting AI processing..."))
            .await?;

        let client = self.client.clone(); // Clone the client
        tokio::spawn(async move {
            let response = client.post(30, &request).await.unwrap();

            if let Some(stream_response) = response.rest() {
                if let Some(candidate) = stream_response.candidates.first() {
                    let tx = tx.clone();
                    if let Some(part) = candidate.content.parts.first() {
                        if let Some(text) = part.text.as_ref() {
                            let _ = tx.send(text.to_string()).await;
                        }
                    }
                }
            }

            let _ = tx.send("EOF_MARKER".to_string()).await;
        });

        let mut full_response = String::new();
        while let Some(chunk) = rx.recv().await {
            if chunk == "EOF_MARKER" {
                break;
            }
            full_response.push_str(&chunk);
            self.websocket_service
                .send_message(WebSocketMessage::text(&chunk))
                .await?;
        }

        debug!(
            "AI response received, length: {} characters",
            full_response.len()
        );

        let parsed_response = self.parse_ai_response(&full_response)?;

        info!("Successfully extracted {} items", parsed_response.len());

        self.websocket_service
            .send_message(WebSocketMessage::text("AI processing completed"))
            .await?;

        Ok(parsed_response)
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

    fn build_request(&self, prompt: String) -> Request {
        Request {
            contents: vec![Content {
                role: Role::User,
                parts: vec![Part {
                    text: Some(prompt),
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
                max_output_tokens: Some(4096),
                stop_sequences: None,
                response_mime_type: Some("application/json".to_string()),
            }),
            system_instruction: Some(SystemInstructionContent {
                parts: vec![SystemInstructionPart {
                    text: Some(self.build_system_prompt()),
                }],
            }),
        }
    }

    fn parse_ai_response(&self, response: &str) -> Result<Vec<serde_json::Value>, AppError> {
        debug!("Parsing AI response");
        serde_json::from_str(response).map_err(|e| {
            error!("Failed to parse AI response: {}", e);
            AppError::AI(format!("Failed to parse AI response: {}", e))
        })
    }
}
