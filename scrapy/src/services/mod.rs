use crate::models::{CrawlResponse, ScrapeParams};
use crate::spider::GenericSpider;
use crate::Crawler;
use async_trait::async_trait;
use rocket::tokio::sync::broadcast::{channel, Receiver, Sender};
use rocket::tokio::sync::Mutex;
use std::sync::Arc;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum WebSocketError {
    #[error("Failed to send message: {0}")]
    SendError(#[from] tokio::sync::broadcast::error::SendError<String>),
}

#[async_trait]
pub trait WebSocketService: Send + Sync {
    async fn send_message(&self, message: String) -> Result<(), WebSocketError>;
    async fn subscribe(&self) -> Receiver<String>;
}

#[async_trait]
pub trait CrawlerService: Send + Sync {
    async fn crawl(&self, params: ScrapeParams) -> Result<CrawlResponse, String>;
}

pub struct RealWebSocketService {
    sender: Arc<Mutex<Sender<String>>>,
    _receiver: Receiver<String>, // Keep a reference to prevent the channel from closing
}

impl RealWebSocketService {
    pub fn new(capacity: usize) -> Self {
        let (sender, receiver) = channel::<String>(capacity);
        RealWebSocketService {
            sender: Arc::new(Mutex::new(sender)),
            _receiver: receiver,
        }
    }
}

#[async_trait]
impl WebSocketService for RealWebSocketService {
    async fn send_message(&self, message: String) -> Result<(), WebSocketError> {
        let sender = self.sender.lock().await;
        let _ = sender.send(message).map_err(WebSocketError::from);
        Ok(())
    }

    async fn subscribe(&self) -> Receiver<String> {
        self.sender.lock().await.subscribe()
    }
}

pub struct RealCrawlerService {
    pub crawler: Crawler,
}

impl RealCrawlerService {
    pub fn new(crawler: Crawler) -> Self {
        Self { crawler }
    }
}

#[async_trait]
impl CrawlerService for RealCrawlerService {
    async fn crawl(&self, params: ScrapeParams) -> Result<CrawlResponse, String> {
        let selectors = vec!["a", "p", "h1", "h2", "h3"];
        let spider = Arc::new(GenericSpider::new(selectors, vec![params.url]));
        self.crawler.crawl(spider).await;
        Ok(CrawlResponse {
            items: vec![String::from("Crawled item")],
        })
    }
}
