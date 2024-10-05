use crate::models::ScrapeParams;
use crate::spider::GenericSpider;
use crate::Crawler;
use crate::{error::AppError, models::AiScrapingResult};
use std::sync::Arc;

use super::{ai_service::GeminiAIProvider, AIService, WebSocketService};

pub struct CrawlerService {
    pub crawler: Crawler,
    pub websocket_service: Arc<WebSocketService>,
    pub ai_service: Arc<AIService<GeminiAIProvider>>,
}

impl CrawlerService {
    pub fn new(
        crawler: Crawler,
        websocket_service: Arc<WebSocketService>,
        ai_service: Arc<AIService<GeminiAIProvider>>,
    ) -> Self {
        Self {
            crawler,
            websocket_service,
            ai_service,
        }
    }

    pub async fn crawl(&self, params: ScrapeParams) -> Result<Vec<AiScrapingResult>, AppError> {
        let selectors = vec!["body"];
        let generic_spider = GenericSpider::new(selectors, self.ai_service.clone(), params.clone())?;
        let spider = Arc::new(generic_spider);
        self.crawler
            .crawl(
                spider.clone(),
                params,
            )
            .await;

        let results = spider.get_results().await;

        Ok(results)
    }
}
