use serde::{Deserialize, Serialize};

mod message;

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ScrapeParams {
    pub model: String,
    pub api_key: String,
    pub url: String,
    pub enable_scraping: bool,
    pub tags: Vec<String>,
    pub enable_pagination: bool,
    pub pagination_details: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScrapingResult {
    pub all_data: Vec<serde_json::Value>,
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub total_cost: f64,
    pub output_folder: String,
    pub pagination_info: Option<PaginationInfo>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginationInfo {
    pub page_urls: Vec<String>,
    pub token_counts: TokenCounts,
    pub price: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenCounts {
    pub input_tokens: u32,
    pub output_tokens: u32,
}

#[derive(Debug, Deserialize, Serialize, Clone, Eq, Hash, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum MessageType {
    Text,
    Json,
    Progress,
    Error,
    Success,
    Warning,
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WebSocketMessage {
    #[serde(rename = "type")]
    pub r#type: MessageType,
    pub payload: String,
    pub metadata: Option<serde_json::Value>,
}

impl WebSocketMessage {
    pub fn new(
        message_type: MessageType,
        payload: String,
        metadata: Option<serde_json::Value>,
    ) -> Self {
        Self {
            r#type: message_type,
            payload,
            metadata,
        }
    }

    pub fn text(payload: String) -> Self {
        Self::new(MessageType::Text, payload, None)
    }

    pub fn json<T: Serialize>(value: &T) -> Self {
        let json = serde_json::to_string_pretty(value).unwrap_or_default();
        Self::new(MessageType::Json, json, None)
    }

    pub fn progress(percentage: f32, message: String) -> Self {
        Self::new(
            MessageType::Progress,
            message,
            Some(serde_json::json!({ "percentage": percentage })),
        )
    }

    pub fn error(message: String) -> Self {
        Self::new(MessageType::Error, message, None)
    }

    pub fn success(message: String) -> Self {
        Self::new(MessageType::Success, message, None)
    }

    pub fn warning(message: String) -> Self {
        Self::new(MessageType::Warning, message, None)
    }
}
