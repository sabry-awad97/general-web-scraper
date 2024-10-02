use rocket::response::stream::{Event, EventStream};
use rocket::serde::json::Json;
use rocket::{get, post, State};
use std::sync::Arc;

use crate::models::{CrawlRequest, CrawlResponse};
use crate::services::{CrawlerService, WebSocketService};

#[get("/")]
pub fn index() -> &'static str {
    "Welcome to the web scraping API!"
}

#[get("/events")]
pub async fn events(
    websocket_service: &State<Arc<dyn WebSocketService + Send + Sync>>,
) -> EventStream![] {
    let receiver = websocket_service.subscribe().await;
    EventStream! {
        let mut receiver = receiver;
        loop {
            match receiver.recv().await {
                Ok(message) => yield Event::data(message),
                Err(e) => {
                    log::error!("WebSocket channel closed: {}", e);
                    return;
                }
            }
        }
    }
}

#[post("/crawl", data = "<params>")]
pub async fn crawl(
    params: Json<CrawlRequest>,
    websocket_service: &State<Arc<dyn WebSocketService + Send + Sync>>,
    crawler_service: &State<Arc<dyn CrawlerService + Send + Sync>>,
) -> Json<CrawlResponse> {
    match websocket_service
        .send_message(format!("Crawling started for {} URLs", params.urls.len()))
        .await
    {
        Ok(_) => log::info!("Start message sent successfully"),
        Err(e) => log::error!("Failed to send start message: {}", e),
    }

    let result = crawler_service.crawl(params.into_inner()).await;

    match result {
        Ok(response) => {
            if let Err(e) = websocket_service
                .send_message("Crawling completed".to_string())
                .await
            {
                log::error!("Failed to send completion message: {}", e);
            }
            Json(response)
        }
        Err(e) => {
            if let Err(send_err) = websocket_service
                .send_message(format!("Crawling failed: {}", e))
                .await
            {
                log::error!("Failed to send error message: {}", send_err);
            }
            Json(CrawlResponse { items: vec![] })
        }
    }
}
