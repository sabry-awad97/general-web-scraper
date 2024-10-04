use futures_util::{SinkExt, StreamExt};
use rocket::serde::json::Json;
use rocket::{get, post, State};
use std::sync::Arc;
use ws::Message;

use crate::error::AppError;
use crate::models::{PaginationInfo, ScrapeParams, ScrapingResult, TokenCounts, WebSocketMessage};
use crate::services::{AIService, CrawlerService, WebSocketService};

#[get("/")]
pub fn index() -> &'static str {
    log::info!("Received request for index route");
    "Welcome to the web scraping API!"
}

#[get("/ws")]
pub fn websocket(
    ws: ws::WebSocket,
    websocket_service: &State<Arc<WebSocketService>>,
) -> ws::Channel<'static> {
    let service = websocket_service.inner().clone();
    ws.channel(move |stream| Box::pin(handle_websocket(stream, service)))
}

async fn handle_websocket(
    mut stream: ws::stream::DuplexStream,
    websocket_service: Arc<WebSocketService>,
) -> Result<(), ws::result::Error> {
    let mut rx = websocket_service.subscribe().await;

    loop {
        tokio::select! {
            msg = stream.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        log::info!("Received WebSocket text message: {}", text);
                        // Handle incoming messages if needed
                    }
                    Some(Ok(Message::Binary(binary))) => {
                        log::info!(
                            "Received WebSocket binary message with length: {}",
                            binary.len()
                        );
                    }
                    Some(Ok(Message::Ping(ping))) => {
                        log::debug!(
                            "Received WebSocket ping message with length: {}",
                            ping.len()
                        );
                    }
                    Some(Ok(Message::Pong(pong))) => {
                        log::debug!(
                            "Received WebSocket pong message with length: {}",
                            pong.len()
                        );
                    }
                    Some(Ok(Message::Frame(_))) => {
                        log::warn!("Received unsupported WebSocket frame message");
                        if let Err(e) = stream.send(Message::Close(None)).await {
                            log::error!("Failed to send close message: {}", e);
                        }
                        break;
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        break;
                    }
                    _ => {}
                }
            }
            msg = rx.recv() => {
                if let Ok(websocket_message) = msg {
                    let json = serde_json::to_string(&websocket_message).unwrap();
                    if let Err(e) = stream.send(Message::Text(json)).await {
                        log::error!("Failed to send WebSocket message: {}", e);
                        break;
                    }
                }
            }
        }
    }

    Ok(())
}

#[get("/scraping-result")]
pub async fn get_scraping_result(
    ai_service: &State<Arc<AIService>>,
) -> Result<Json<ScrapingResult>, rocket::http::Status> {
    match ai_service.get_scraped_items().await {
        Ok(items) => Ok(Json(ScrapingResult {
            all_data: items,
            input_tokens: 0,
            output_tokens: 0,
            total_cost: 0.0,
            pagination_info: Some(PaginationInfo {
                page_urls: vec![],
                token_counts: TokenCounts {
                    input_tokens: 0,
                    output_tokens: 0,
                },
                price: 0.0,
            }),
        })),
        Err(e) => {
            log::error!("Failed to get scraped items: {}", e);
            Err(rocket::http::Status::InternalServerError)
        }
    }
}

#[post("/crawl", data = "<params>")]
pub async fn crawl(
    params: Json<ScrapeParams>,
    websocket_service: &State<Arc<WebSocketService>>,
    crawler_service: &State<Arc<CrawlerService>>,
) -> Result<(), rocket::http::Status> {
    log::info!(
        "Received crawl request for URL: {} with parameters: {:#?}",
        params.url,
        params
    );

    let start_message = format!("Crawling started for {}", params.url);
    match websocket_service
        .send_message(WebSocketMessage::progress(start_message.clone()))
        .await
    {
        Ok(_) => log::info!("Successfully sent crawl start message: {}", start_message),
        Err(e) => log::error!(
            "Failed to send crawl start message: {}. Error: {}",
            start_message,
            e
        ),
    }

    let params = params.into_inner();
    let result: Result<(), AppError> = crawler_service.crawl(params.clone()).await;

    match result {
        Ok(_) => {
            let success_message = format!("Crawling completed for {}", params.url);
            match websocket_service
                .send_message(WebSocketMessage::progress(success_message.clone()))
                .await
            {
                Ok(_) => {
                    log::info!(
                        "Successfully sent crawl completion message: {}",
                        success_message
                    );
                    Ok(())
                }
                Err(e) => {
                    log::error!(
                        "Failed to send crawl completion message: {}. Error: {}",
                        success_message,
                        e
                    );
                    Err(rocket::http::Status::InternalServerError)
                }
            }
        }
        Err(e) => {
            log::error!("Crawl failed: {}", e);
            Err(rocket::http::Status::InternalServerError)
        }
    }
}
