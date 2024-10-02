use futures_util::StreamExt;
use rocket::response::stream::{Event, EventStream};
use rocket::serde::json::Json;
use rocket::{get, post, State};
use std::sync::Arc;
use ws::Message;

use crate::models::{CrawlResponse, ScrapeParams};
use crate::services::{CrawlerService, WebSocketService};

#[get("/")]
pub fn index() -> &'static str {
    "Welcome to the web scraping API!"
}

#[get("/ws")]
pub fn websocket(ws: ws::WebSocket) -> ws::Channel<'static> {
    ws.channel(move |mut stream| {
        Box::pin(async move {
            log::info!("WebSocket connection established");

            loop {
                if let Some(message) = stream.next().await {
                    let message = message?;
                    match message {
                        Message::Text(text) => {
                            log::info!("Received text message: {}", text);
                        }
                        Message::Binary(binary) => {
                            log::info!("Received binary message with length: {}", binary.len());
                        }
                        Message::Ping(ping) => {
                            log::info!("Received ping message with length: {}", ping.len());
                        }
                        Message::Pong(pong) => {
                            log::info!("Received pong message with length: {}", pong.len());
                        }
                        Message::Close(_) => {
                            break;
                        }
                        Message::Frame(_) => {
                            log::warn!(
                                "Received frame message, which is not supported by this server"
                            );
                        }
                    }
                }
            }

            Ok(())
        })
    })
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
    params: Json<ScrapeParams>,
    websocket_service: &State<Arc<dyn WebSocketService + Send + Sync>>,
    crawler_service: &State<Arc<dyn CrawlerService + Send + Sync>>,
) -> Json<CrawlResponse> {
    match websocket_service
        .send_message(format!("Crawling started for {}", params.url))
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
