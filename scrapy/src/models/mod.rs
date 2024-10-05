use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

mod message;

pub use message::*;

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
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub total_cost: f64,
    pub pagination_info: Option<PaginationInfo>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginationInfo {
    pub page_urls: Vec<String>,
    pub token_counts: UsageMetadata,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageMetadata {
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub total_cost: f64,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AiScrapingResult {
    pub model: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub data: serde_json::Value,
    pub usage_metadata: UsageMetadata,
}

#[derive(Clone, Copy)]
pub struct PricingInfo {
    pub input: f64,
    pub output: f64,
}
