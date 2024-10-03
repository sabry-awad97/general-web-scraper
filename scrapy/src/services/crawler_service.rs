use crate::error::AppError;
use crate::models::{CrawlResponse, ScrapeParams};
use crate::spider::GenericSpider;
use crate::Crawler;
use log::{error, info};
use std::sync::Arc;
use tokio::sync::mpsc;

use super::WebSocketService;

pub struct CrawlerService {
    pub crawler: Crawler,
    pub websocket_service: Arc<WebSocketService>,
}

impl CrawlerService {
    pub fn new(
        crawler: Crawler,
        websocket_service: Arc<WebSocketService>,
    ) -> Self {
        Self {
            crawler,
            websocket_service,
        }
    }

    pub async fn crawl(&self, params: ScrapeParams) -> Result<CrawlResponse, AppError> {
        let selectors = vec!["body"];
        let (tx, mut _rx) = mpsc::channel(100);
        let websocket_tx = Some(tx.clone());
        let spider = Arc::new(GenericSpider::new(
            selectors,
            vec![params.url.clone()],
            websocket_tx,
            params.clone(),
        )?);

        let websocket_service = self.websocket_service.clone();
        tokio::spawn(async move {
            while let Some(message) = _rx.recv().await {
                if let Err(e) = websocket_service.send_message(message).await {
                    error!("Failed to send message: {:?}", e);
                }
            }

            info!("Crawling completed");
        });

        self.crawler.crawl(spider, params).await;
        Ok(CrawlResponse {
            items: vec![String::from("Crawled item")],
        })
    }
}
