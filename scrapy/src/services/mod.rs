use crate::models::{CrawlResponse, ScrapeParams, WebSocketMessage};
use crate::spider::GenericSpider;
use crate::Crawler;
use async_trait::async_trait;
use rocket::tokio::sync::broadcast::{channel, Receiver, Sender};
use rocket::tokio::sync::Mutex;
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::mpsc;

#[derive(Error, Debug)]
pub enum WebSocketError {
    #[error("Failed to send message: {0}")]
    SendError(#[from] tokio::sync::broadcast::error::SendError<WebSocketMessage<String>>),
}

#[async_trait]
pub trait WebSocketService: Send + Sync {
    async fn send_message(&self, message: WebSocketMessage<String>) -> Result<(), WebSocketError>;
    async fn subscribe(&self) -> Receiver<WebSocketMessage<String>>;
}

#[async_trait]
pub trait CrawlerService: Send + Sync {
    async fn crawl(&self, params: ScrapeParams) -> Result<CrawlResponse, String>;
}

pub struct RealWebSocketService {
    sender: Arc<Mutex<Sender<WebSocketMessage<String>>>>,
    _receiver: Receiver<WebSocketMessage<String>>, // Keep a reference to prevent the channel from closing
}

impl RealWebSocketService {
    pub fn new(capacity: usize) -> Self {
        let (sender, receiver) = channel::<WebSocketMessage<String>>(capacity);
        RealWebSocketService {
            sender: Arc::new(Mutex::new(sender)),
            _receiver: receiver,
        }
    }
}

#[async_trait]
impl WebSocketService for RealWebSocketService {
    async fn send_message(&self, message: WebSocketMessage<String>) -> Result<(), WebSocketError> {
        let sender = self.sender.lock().await;
        let _ = sender.send(message).map_err(WebSocketError::from);
        Ok(())
    }

    async fn subscribe(&self) -> Receiver<WebSocketMessage<String>> {
        self.sender.lock().await.subscribe()
    }
}

pub struct RealCrawlerService {
    pub crawler: Crawler,
    pub websocket_service: Arc<dyn WebSocketService + Send + Sync>,
}

impl RealCrawlerService {
    pub fn new(
        crawler: Crawler,
        websocket_service: Arc<dyn WebSocketService + Send + Sync>,
    ) -> Self {
        Self {
            crawler,
            websocket_service,
        }
    }
}

#[async_trait]
impl CrawlerService for RealCrawlerService {
    async fn crawl(&self, params: ScrapeParams) -> Result<CrawlResponse, String> {
        let selectors = vec!["body"];
        let (tx, mut _rx) = mpsc::channel(100);
        let websocket_tx = Some(tx.clone());
        let spider = Arc::new(GenericSpider::new(
            selectors,
            vec![params.url],
            websocket_tx,
        ));

        let websocket_service = self.websocket_service.clone();
        tokio::spawn(async move {
            while let Some(message) = _rx.recv().await {
                if let Err(e) = websocket_service.send_message(message).await {
                    eprintln!("Failed to send message: {:?}", e);
                }
            }
        });

        self.crawler.crawl(spider).await;
        Ok(CrawlResponse {
            items: vec![String::from("Crawled item")],
        })
    }
}
