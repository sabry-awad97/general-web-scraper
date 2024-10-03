use google_generative_ai_rs::v1::{
    api::Client,
    gemini::{request::Request, Content, Part, Role},
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

        let client = Client::new_from_model(
            google_generative_ai_rs::v1::gemini::Model::Gemini1_5Pro,
            api_key,
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

        let mut message = String::new();

        if let Some(response) = response.rest() {
            if let Some(candidate) = response.candidates.first() {
                if let Some(part) = candidate.content.parts.first() {
                    if let Some(text) = part.text.as_ref() {
                        info!("{}", text);
                        message.push_str(text);
                    }
                }
            }
        }

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
            system_instruction: None,
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
