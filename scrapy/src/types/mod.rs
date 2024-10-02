use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct InitializeCrawlerRequest {
    pub delay: u64,
    pub crawling_concurrency: usize,
    pub processing_concurrency: usize,
}

#[derive(Serialize, Deserialize)]
pub struct CrawlRequest {
    pub urls: Vec<String>,
}

#[derive(Serialize)]
pub struct CrawlResponse {
    pub items: Vec<String>,
}
