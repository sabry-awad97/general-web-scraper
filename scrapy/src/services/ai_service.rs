use async_trait::async_trait;
use chrono::Utc;
use google_generative_ai_rs::v1::{
    api::Client,
    gemini::{
        request::{GenerationConfig, Request, SystemInstructionContent, SystemInstructionPart},
        Content, Model, Part, Role,
    },
};
use log::{debug, info};
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::models::{ScrapeParams, UsageMetadata};
use crate::utils::calculate_price;
use crate::{error::AppError, models::AiScrapingResult};

#[async_trait]
pub trait AIProvider: Send + Sync {
    async fn process_request(&self, request: Request) -> Result<String, AppError>;
    fn build_request(&self, system_prompt: String, user_prompt: String) -> Request;
    async fn build_client(&self, model: &str, api_key: &str) -> Result<(), AppError>;
    async fn get_usage_metadata(&self) -> UsageMetadata;
}

pub struct GeminiAIProvider {
    model: Mutex<Option<String>>,
    client: Mutex<Option<Client>>,
    usage_metadata: Mutex<UsageMetadata>,
}

impl GeminiAIProvider {
    pub fn new() -> Self {
        Self {
            model: Mutex::new(None),
            client: Mutex::new(None),
            usage_metadata: UsageMetadata {
                input_tokens: 0,
                output_tokens: 0,
                total_cost: 0.0,
            }
            .into(),
        }
    }
}

#[async_trait]
impl AIProvider for GeminiAIProvider {
    async fn build_client(&self, model: &str, api_key: &str) -> Result<(), AppError> {
        *self.client.lock().await = Some(Client::new_from_model(
            Model::Gemini1_5Flash,
            api_key.to_string(),
        ));
        *self.model.lock().await = Some(model.to_string());
        Ok(())
    }

    async fn process_request(&self, request: Request) -> Result<String, AppError> {
        let client = self.client.lock().await;
        if let Some(client) = client.as_ref() {
            match client.post(30, &request).await {
                Ok(response) => {
                    if let Some(stream_response) = response.rest() {
                        if let Some(candidate) = stream_response.candidates.first() {
                            if let Some(part) = candidate.content.parts.first() {
                                if let Some(text) = part.text.as_ref() {
                                    return Ok(text.to_string());
                                }
                            }
                        }

                        if let Some(metadata) = stream_response.usage_metadata {
                            let mut usage_metadata = self.usage_metadata.lock().await;

                            if let Some(model) = &*self.model.lock().await {
                                *usage_metadata = UsageMetadata {
                                    input_tokens: metadata.prompt_token_count,
                                    output_tokens: metadata.candidates_token_count,
                                    total_cost: calculate_price(
                                        model,
                                        metadata.prompt_token_count,
                                        metadata.candidates_token_count,
                                    ),
                                };
                            }
                        }
                    }
                    Err(AppError::AI("No valid response from AI".to_string()))
                }
                Err(e) => Err(AppError::AI(e.to_string())),
            }
        } else {
            Err(AppError::AI("AI client not initialized".to_string()))
        }
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

    async fn get_usage_metadata(&self) -> UsageMetadata {
        self.usage_metadata.lock().await.clone()
    }
}

pub struct AIService<T: AIProvider> {
    ai_provider: Arc<T>,
}

impl<T: AIProvider + 'static> AIService<T> {
    pub fn new(ai_provider: T) -> Self {
        debug!("Initializing AIService");
        info!("AIService initialized successfully");
        Self {
            ai_provider: Arc::new(ai_provider),
        }
    }

    pub async fn build_client(&self, model: &str, api_key: &str) -> Result<(), AppError> {
        self.ai_provider.build_client(model, api_key).await
    }

    pub async fn extract_items(
        &self,
        params: &ScrapeParams,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<AiScrapingResult, AppError> {
        debug!("Extracting items with params: {:?}", params);

        let mut result = AiScrapingResult {
            model: params.model.clone(),
            start_time: Utc::now(),
            end_time: None,
            data: Value::Null,
            usage_metadata: UsageMetadata {
                input_tokens: 0,
                output_tokens: 0,
                total_cost: 0.0,
            },
        };

        self.build_client(&params.model, &params.api_key).await?;
        let request = self
            .ai_provider
            .build_request(system_prompt.to_string(), user_prompt.to_string());
        let response = self.ai_provider.process_request(request).await?;

        if let Ok(value) = serde_json::from_str::<Value>(&response) {
            result.data = value;
        }

        result.usage_metadata = self.ai_provider.get_usage_metadata().await;
        result.end_time = Some(Utc::now());

        Ok(result)
    }
}
