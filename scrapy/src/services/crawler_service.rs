use crate::error::AppError;
use crate::models::ScrapeParams;
use crate::spider::GenericSpider;
use crate::Crawler;
use std::sync::Arc;

use super::{AIService, WebSocketService};

pub struct CrawlerService {
    pub crawler: Crawler,
    pub websocket_service: Arc<WebSocketService>,
    pub ai_service: Arc<AIService>,
}

impl CrawlerService {
    pub fn new(
        crawler: Crawler,
        websocket_service: Arc<WebSocketService>,
        ai_service: Arc<AIService>,
    ) -> Self {
        Self {
            crawler,
            websocket_service,
            ai_service,
        }
    }

    pub async fn crawl(&self, params: ScrapeParams) -> Result<(), AppError> {
        let selectors = vec!["body"];
        let spider = Arc::new(GenericSpider::new(
            selectors,
            self.ai_service.clone(),
            self.websocket_service.clone(),
            params.clone(),
        )?);

        self.crawler.crawl(spider, params).await;
        Ok(())
    }
}
