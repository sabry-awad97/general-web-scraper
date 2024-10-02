use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CrawlRequest {
    pub urls: Vec<String>,
    pub delay: u64,
    pub crawling_concurrency: usize,
    pub processing_concurrency: usize,
}

#[derive(Serialize)]
pub struct CrawlResponse {
    pub items: Vec<String>,
}
