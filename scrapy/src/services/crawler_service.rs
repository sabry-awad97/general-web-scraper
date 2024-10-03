use crate::error::AppError;
use crate::models::{ScrapeParams, WebSocketMessage};
use crate::spider::GenericSpider;
use crate::Crawler;
use std::sync::Arc;

use super::WebSocketService;

pub struct CrawlerService {
    pub crawler: Crawler,
    pub websocket_service: Arc<WebSocketService>,
}

impl CrawlerService {
    pub fn new(crawler: Crawler, websocket_service: Arc<WebSocketService>) -> Self {
        Self {
            crawler,
            websocket_service,
        }
    }

    pub async fn crawl(&self, params: ScrapeParams) -> Result<(), AppError> {
        let selectors = vec!["body"];
        let spider = Arc::new(GenericSpider::new(
            selectors,
            self.websocket_service.clone(),
            params.clone(),
        )?);

        self.crawler.crawl(spider, params).await;

        self.websocket_service
            .send_message(WebSocketMessage::success("Crawl completed successfully!"))
            .await?;
        Ok(())
    }
}
