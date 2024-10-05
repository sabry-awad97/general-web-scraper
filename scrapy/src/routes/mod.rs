use futures_util::{SinkExt, StreamExt};
use rocket::serde::json::Json;
use rocket::{get, post, State};
use std::sync::Arc;
use ws::Message;

use crate::error::AppError;
use crate::models::{ScrapeParams, ScrapingResult};
use crate::services::{AIService, CrawlerService, WebSocketService};
use crate::utils::get_all_models;

#[get("/")]
pub fn index() -> &'static str {
    log::info!("Received request for index route");
    "Welcome to the web scraping API!"
}

#[get("/models")]
pub fn get_models() -> Json<Vec<String>> {
    Json(get_all_models())
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
) -> Result<Json<Option<ScrapingResult>>, rocket::http::Status> {
    match ai_service.get_current_scraping_result().await {
        Some(result) => Ok(Json(Some(ScrapingResult {
            all_data: result.scraped_items,
            input_tokens: result.usage_metadata.input_tokens,
            output_tokens: result.usage_metadata.output_tokens,
            total_cost: result.usage_metadata.total_cost,
            pagination_info: None,
        }))),
        None => Ok(Json(None)),
    }
}

#[post("/clear-scraping-result")]
pub async fn clear_scraping_result(
    ai_service: &State<Arc<AIService>>,
) -> Result<Json<()>, rocket::http::Status> {
    ai_service.clear_current_scraping_result().await;
    Ok(Json(()))
}

#[post("/crawl", data = "<params>")]
pub async fn crawl(
    params: Json<ScrapeParams>,
    crawler_service: &State<Arc<CrawlerService>>,
) -> Result<(), rocket::http::Status> {
    log::info!(
        "Received crawl request for URL: {} with parameters: {:#?}",
        params.url,
        params
    );

    let params = params.into_inner();
    let result: Result<(), AppError> = crawler_service.crawl(params.clone()).await;

    match result {
        Ok(_) => {
            let success_message = format!("Crawling completed for {}", params.url);
            log::info!(
                "Successfully sent crawl completion message: {}",
                success_message
            );
            Ok(())
        }
        Err(e) => {
            log::error!("Crawl failed: {}", e);
            Err(rocket::http::Status::InternalServerError)
        }
    }
}
