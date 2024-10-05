use std::{sync::Arc, time::Duration};

use async_trait::async_trait;
use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use tokio::sync::Mutex;

use crate::{
    error::AppError,
    models::{AiScrapingResult, ScrapeParams},
    services::{AIService, GeminiAIProvider},
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
    ai_service: Arc<AIService<GeminiAIProvider>>,
    scrape_params: ScrapeParams,
    result: Arc<Mutex<Vec<AiScrapingResult>>>,
}

impl GenericSpider {
    pub fn new(
        selectors: Vec<&str>,
        ai_service: Arc<AIService<GeminiAIProvider>>,
        scrape_params: ScrapeParams,
    ) -> Result<Self, AppError> {
        let http_timeout = Duration::from_secs(6);
        let http_client = Client::builder()
            .timeout(http_timeout)
            .build()
            .expect("spiders/general: Building HTTP client");

        let selectors = selectors
            .into_iter()
            .map(|s| Selector::parse(s).unwrap())
            .collect();

        Ok(Self {
            http_client,
            selectors,
            ai_service,
            scrape_params,
            result: Arc::new(Mutex::new(vec![])),
        })
    }

    fn build_prompt(&self, html: &str) -> String {
        format!(
            "HTML Content: {}\n\nExtract the following information: {:?}",
            html, self.scrape_params.tags
        )
    }

    fn build_system_prompt(&self) -> String {
        "You are an AI assistant specialized in web scraping. Extract the requested information from the provided HTML content and return it as a JSON array or object.".to_string()
    }

    pub async fn get_results(&self) -> Vec<AiScrapingResult> {
        let results = self.result.lock().await;
        results.clone()
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

    async fn process(&self, html: Self::Item) -> Result<(), Self::Error> {
        if self.scrape_params.enable_scraping {
            let system_prompt = self.build_system_prompt();
            let user_prompt = self.build_prompt(&html);
            let result = self
                .ai_service
                .extract_items(&self.scrape_params, &system_prompt, &user_prompt)
                .await?;

            let mut results = self.result.lock().await;
            results.push(result);
        }

        Ok(())
    }
}
