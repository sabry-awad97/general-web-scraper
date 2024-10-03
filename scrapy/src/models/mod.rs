use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct CrawlResponse {
    pub items: Vec<String>,
}

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
pub enum EventType {
    Text,
    Json,
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WebSocketMessage {
    #[serde(rename = "type")]
    pub r#type: EventType,
    pub payload: String,
}

impl WebSocketMessage {
    pub fn new_text(payload: String) -> Self {
        Self {
            r#type: EventType::Text,
            payload,
        }
    }

    pub fn new_json<T>(value: &T) -> Self
    where
        T: Serialize,
    {
        let json = serde_json::to_string_pretty(value).unwrap_or_default();
        Self {
            r#type: EventType::Json,
            payload: json,
        }
    }
}
