use std::time::Duration;

use async_trait::async_trait;
use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use tokio::sync::mpsc;

use crate::{error::AppError, models::WebSocketMessage};

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
}

impl GenericSpider {
    pub fn new(
        selectors: Vec<&str>,
        urls: Vec<String>,
        websocket_tx: Option<mpsc::Sender<WebSocketMessage>>,
    ) -> Self {
        let http_timeout = Duration::from_secs(6);
        let http_client = Client::builder()
            .timeout(http_timeout)
            .build()
            .expect("spiders/quotes: Building HTTP client");

        let selectors = selectors
            .into_iter()
            .map(|s| Selector::parse(s).unwrap())
            .collect();

        Self {
            http_client,
            selectors,
            urls,
            websocket_tx,
        }
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
        if let Some(tx) = &self.websocket_tx {
            let _ = tx.send(WebSocketMessage::new_json(&item)).await;
        }
        Ok(())
    }
}
