use std::time::Duration;

use async_trait::async_trait;
use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use tokio::sync::mpsc;

use crate::{
    ai::AIService,
    error::AppError,
    models::{ScrapeParams, WebSocketMessage},
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

#[derive(Debug, Clone, Serialize)]
pub struct GenericItem {
    pub url: String,
    pub title: Option<String>,
    pub content: Option<String>,
}

pub struct GenericSpider {
    http_client: Client,
    selectors: Vec<Selector>,
    urls: Vec<String>,
    websocket_tx: Option<mpsc::Sender<WebSocketMessage>>,
    ai_service: AIService,
    scrape_params: ScrapeParams,
}

impl GenericSpider {
    pub fn new(
        selectors: Vec<&str>,
        urls: Vec<String>,
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

        let ai_service = AIService::new()?;

        Ok(Self {
            http_client,
            selectors,
            urls,
            websocket_tx,
            ai_service,
            scrape_params,
        })
    }
}

#[async_trait]
impl Spider for GenericSpider {
    type Item = GenericItem;
    type Error = AppError;

    fn name(&self) -> String {
        String::from("generic")
    }

    fn start_urls(&self) -> Vec<String> {
        self.urls.clone()
    }

    async fn scrape(&self, url: String) -> Result<(Vec<Self::Item>, Vec<String>), Self::Error> {
        let res = self.http_client.get(&url).send().await?;
        let html = res.text().await?;
        let document = Html::parse_document(&html);

        let mut items = Vec::new();

        for selector in &self.selectors {
            for element in document.select(selector) {
                let title = element.value().attr("title").map(String::from);
                let content = Some(element.inner_html());

                items.push(GenericItem {
                    url: url.clone(),
                    title,
                    content,
                });
            }
        }

        Ok((items, vec![]))
    }

    async fn process(&self, item: Self::Item) -> Result<(), Self::Error> {
        if self.scrape_params.enable_scraping {
            if let Some(content) = item.content.as_ref() {
                let extracted_items = self
                    .ai_service
                    .extract_items(content, &self.scrape_params)
                    .await?;

                for extracted_item in extracted_items {
                    if let Some(tx) = &self.websocket_tx {
                        let _ = tx.send(WebSocketMessage::new_json(&extracted_item)).await;
                    }
                }
            }
        }
        Ok(())
    }
}
