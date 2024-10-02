use std::io::{stdout, Write};

use google_generative_ai_rs::v1::{
    api::Client,
    gemini::{request::Request, response::GeminiResponse, Content, Part, ResponseType, Role},
};
use log::{debug, error, info};

use crate::error::AppError;
use crate::models::ScrapeParams;
use serde_json::Value;

pub struct AIService {
    client: Client,
}

impl AIService {
    pub fn new() -> Result<Self, AppError> {
        debug!("Initializing AIService");
        let api_key = std::env::var("GEMINI_API_KEY").map_err(|_| {
            error!("Failed to retrieve GEMINI_API_KEY from environment");
            AppError::MissingAPIKey("GEMINI_API_KEY".to_string())
        })?;

        let client = Client::new_from_model_response_type(
            google_generative_ai_rs::v1::gemini::Model::GeminiPro,
            api_key,
            ResponseType::StreamGenerateContent,
        );

        info!("AIService initialized successfully");
        Ok(Self { client })
    }

    pub async fn extract_items(
        &self,
        html: &str,
        params: &ScrapeParams,
    ) -> Result<Vec<Value>, AppError> {
        debug!("Extracting items with params: {:?}", params);
        let prompt = self.build_prompt(html, params);
        let request = self.build_request(prompt);

        let response = self.client.post(30, &request).await.map_err(|e| {
            error!("AI request failed: {}", e);
            AppError::AIError(e.to_string())
        })?;

        let message = std::sync::Arc::new(std::sync::Mutex::new(String::from("\n")));

        if let Some(stream_response) = response.streamed() {
            if let Some(json_stream) = stream_response.response_stream {
                let message_clone = message.clone();
                Client::for_each_async(json_stream, move |response: GeminiResponse| {
                    let message_clone = message_clone.clone();
                    async move {
                        if let Some(part) = response.candidates.first() {
                            if let Some(text) = part.content.parts.first() {
                                if let Some(text) = text.text.as_ref() {
                                    let mut message = message_clone.lock().unwrap();
                                    message.push_str(text);
                                    print!("{}", text);
                                    stdout().flush().unwrap();
                                }
                            }
                        }
                    }
                })
                .await;
            }
        }

        let message = message.lock().unwrap().clone();

        debug!("AI response received, length: {} characters", message.len());

        let parsed_response = self.parse_ai_response(&message)?;

        info!("Successfully extracted {} items", parsed_response.len());

        Ok(parsed_response)
    }

    fn build_prompt(&self, html: &str, params: &ScrapeParams) -> String {
        let tags = params.tags.join(", ");
        format!(
            r#"You are an intelligent text extraction and conversion assistant. Your task is to extract structured information 
    from the given HTML and convert it into a pure JSON format. The JSON should contain only the structured data extracted from the HTML, 
    with no additional commentary, explanations, or extraneous information. 
    You may encounter cases where you can't find the data for the fields you need to extract, or the data may be in a foreign language.
    Process the following HTML and provide the output in pure JSON format with no words before or after the JSON.

    Extract the following information: {}.
    Return the result as a JSON array of objects, where each object represents an item with the specified fields.
    Only include the JSON array in your response, nothing else.

    HTML:
    {}
    "#,
            tags, html
        )
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
            generation_config: None,
        }
    }

    fn parse_ai_response(&self, response: &str) -> Result<Vec<Value>, AppError> {
        debug!("Parsing AI response");
        serde_json::from_str(response).map_err(|e| {
            error!("Failed to parse AI response: {}", e);
            AppError::AIError(format!("Failed to parse AI response: {}", e))
        })
    }
}
