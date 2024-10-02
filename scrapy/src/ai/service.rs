use google_generative_ai_rs::v1::{
    api::Client,
    gemini::{request::Request, Content, Model, Part, Role},
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

        let client = Client::new_from_model(Model::GeminiPro, api_key);
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

        let message = std::sync::Arc::new(std::sync::Mutex::new(String::new()));

        if let Some(stream_response) = response.streamed() {
            if let Some(json_stream) = stream_response.response_stream {
                let message_clone = message.clone();
                Client::for_each_async(json_stream, move |response| {
                    let message_clone = message_clone.clone();
                    async move {
                        if let Some(part) = response.candidates.first() {
                            if let Some(text) = part.content.parts.first() {
                                if let Some(text) = text.text.as_ref() {
                                    let mut message = message_clone.lock().unwrap();
                                    message.push_str(text);
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
            r#"Extract the following information from the given HTML: {}. 
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
