use futures_util::{SinkExt, StreamExt};
use rocket::response::stream::{Event, EventStream};
use rocket::serde::json::Json;
use rocket::{get, post, State};
use std::sync::Arc;
use ws::Message;

use crate::models::{CrawlResponse, ScrapeParams, WebSocketMessage};
use crate::services::{CrawlerService, WebSocketService};

#[get("/")]
pub fn index() -> &'static str {
    log::info!("Received request for index route");
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
                            log::info!("Received WebSocket text message: {}", text);
                            if let Err(e) = stream.send(Message::Text(text)).await {
                                log::error!("Failed to echo text message: {}", e);
                                break;
                            }
                        }
                        Message::Binary(binary) => {
                            log::info!(
                                "Received WebSocket binary message with length: {}",
                                binary.len()
                            );
                        }
                        Message::Ping(ping) => {
                            log::debug!(
                                "Received WebSocket ping message with length: {}",
                                ping.len()
                            );
                        }
                        Message::Pong(pong) => {
                            log::debug!(
                                "Received WebSocket pong message with length: {}",
                                pong.len()
                            );
                        }
                        Message::Close(_) => {
                            log::info!("WebSocket connection closed by client");
                            break;
                        }
                        Message::Frame(_) => {
                            log::warn!("Received unsupported WebSocket frame message");
                            if let Err(e) = stream.send(Message::Close(None)).await {
                                log::error!("Failed to send close message: {}", e);
                            }
                            break;
                        }
                    }
                }
            }

            log::info!("WebSocket connection handler completed");
            Ok(())
        })
    })
}

#[get("/events")]
pub async fn events(
    websocket_service: &State<Arc<WebSocketService>>,
) -> EventStream![] {
    log::info!("Client connected to SSE events stream");
    let receiver = websocket_service.subscribe().await;
    EventStream! {
        let mut receiver = receiver;
        loop {
            match receiver.recv().await {
                Ok(message) => {
                    log::debug!("Sending SSE event: {:?}", message);
                    yield Event::json(&message)
                },
                Err(e) => {
                    log::error!("SSE channel closed, ending event stream: {}", e);
                    return;
                }
            }
        }
    }
}

#[post("/crawl", data = "<params>")]
pub async fn crawl(
    params: Json<ScrapeParams>,
    websocket_service: &State<Arc<WebSocketService>>,
    crawler_service: &State<Arc<CrawlerService>>,
) -> Json<CrawlResponse> {
    log::info!(
        "Received crawl request for URL: {} with parameters: {:#?}",
        params.url,
        params
    );

    let start_message = format!("Crawling started for {}", params.url);
    match websocket_service
        .send_message(WebSocketMessage::new_text(start_message.clone()))
        .await
    {
        Ok(_) => log::info!("Successfully sent crawl start message: {}", start_message),
        Err(e) => log::error!(
            "Failed to send crawl start message: {}. Error: {}",
            start_message,
            e
        ),
    }

    let result = crawler_service.crawl(params.into_inner()).await;

    match result {
        Ok(response) => {
            log::info!(
                "Crawling completed successfully. Items found: {}",
                response.items.len()
            );
            let completion_message = "Crawling completed successfully";
            if let Err(e) = websocket_service
                .send_message(WebSocketMessage::new_text(completion_message.to_string()))
                .await
            {
                log::error!(
                    "Failed to send crawl completion message: {}. Error: {}",
                    completion_message,
                    e
                );
            } else {
                log::info!(
                    "Successfully sent crawl completion message: {}",
                    completion_message
                );
            }
            Json(response)
        }
        Err(e) => {
            log::error!("Crawling failed: {}", e);
            let error_message = format!("Crawling failed: {}", e);
            if let Err(send_err) = websocket_service
                .send_message(WebSocketMessage::new_text(error_message.clone()))
                .await
            {
                log::error!(
                    "Failed to send crawl error message: {}. Error: {}",
                    error_message,
                    send_err
                );
            } else {
                log::info!("Successfully sent crawl error message: {}", error_message);
            }
            Json(CrawlResponse { items: vec![] })
        }
    }
}
