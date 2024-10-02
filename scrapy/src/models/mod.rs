use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CrawlRequest {
    pub urls: Vec<String>,
}

#[derive(Serialize)]
pub struct CrawlResponse {
    pub items: Vec<String>,
}

#[derive(Deserialize)]
pub struct ScrapeParams {
    pub url: String,
    pub model: String,
    pub enable_scraping: bool,
    pub tags: Vec<String>,
    pub enable_pagination: bool,
    pub pagination_details: Option<String>,
}

#[derive(Serialize)]
pub struct ScrapingResult {
    pub all_data: Vec<serde_json::Value>,
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub total_cost: f64,
    pub output_folder: String,
    pub pagination_info: Option<PaginationInfo>,
}

#[derive(Serialize)]
pub struct PaginationInfo {
    pub page_urls: Vec<String>,
    pub token_counts: TokenCounts,
    pub price: f64,
}

#[derive(Serialize)]
pub struct TokenCounts {
    pub input_tokens: u32,
    pub output_tokens: u32,
}
