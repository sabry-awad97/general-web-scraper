use std::time::Duration;

use async_trait::async_trait;
use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use tokio::sync::mpsc;

use crate::{
    error::AppError,
    models::{ScrapeParams, WebSocketMessage},
    services::AIService,
};

#[async_trait]
pub trait Spider: Send + Sync {
    type Item: Serialize;
    type Error;

    fn name(&self) -> String;
    fn start_urls(&self) -> Vec<String>;
    async fn scrape(&self, url: String) -> Result<(Vec<Self::Item>, Vec<String>), Self::Error>;
    async fn process(&self, item: Self::Item) -> Result<(), Self::Error>;
}

pub struct GenericSpider {
    http_client: Client,
    selectors: Vec<Selector>,
    websocket_tx: Option<mpsc::Sender<WebSocketMessage>>,
    ai_service: AIService,
    scrape_params: ScrapeParams,
}

impl GenericSpider {
    pub fn new(
        selectors: Vec<&str>,
        websocket_tx: Option<mpsc::Sender<WebSocketMessage>>,
        scrape_params: ScrapeParams,
    ) -> Result<Self, AppError> {
        let http_timeout = Duration::from_secs(6);
        let http_client = Client::builder()
            .timeout(http_timeout)
            .build()
            .expect("spiders/quotes: Building HTTP client");

        let selectors = selectors
            .into_iter()
            .map(|s| Selector::parse(s).unwrap())
            .collect();

        let ai_service = AIService::new(&scrape_params.api_key)?;

        Ok(Self {
            http_client,
            selectors,
            websocket_tx,
            ai_service,
            scrape_params,
        })
    }
}

#[async_trait]
impl Spider for GenericSpider {
    type Item = String;
    type Error = AppError;

    fn name(&self) -> String {
        String::from("generic")
    }

    fn start_urls(&self) -> Vec<String> {
        vec![self.scrape_params.url.clone()]
    }

    async fn scrape(&self, url: String) -> Result<(Vec<Self::Item>, Vec<String>), Self::Error> {
        let res = self.http_client.get(&url).send().await?;
        let html = res.text().await?;
        let document = Html::parse_document(&html);

        let mut items = Vec::new();

        for selector in &self.selectors {
            for element in document.select(selector) {
                items.push(element.inner_html());
            }
        }

        Ok((items, vec![]))
    }

    async fn process(&self, item: Self::Item) -> Result<(), Self::Error> {
        if self.scrape_params.enable_scraping {
            let extracted_items = self
                .ai_service
                .extract_items(&item, &self.scrape_params)
                .await?;

            if let Some(tx) = &self.websocket_tx {
                let _ = tx.send(WebSocketMessage::new_json(&extracted_items)).await;
            }
        }
        Ok(())
    }
}
