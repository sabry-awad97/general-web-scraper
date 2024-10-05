use futures_util::{SinkExt, StreamExt};
use rocket::serde::json::Json;
use rocket::{get, post, State};
use std::sync::Arc;
use ws::Message;

use crate::models::{ScrapeParams, ScrapingResult};
use crate::services::{CrawlerService, WebSocketService};
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

#[post("/crawl", data = "<params>")]
pub async fn crawl(
    params: Json<ScrapeParams>,
    crawler_service: &State<Arc<CrawlerService>>,
) -> Result<Json<Vec<ScrapingResult>>, rocket::http::Status> {
    log::info!(
        "Initiating crawl request for URL: {} with parameters: {:#?}",
        params.url,
        params
    );

    let params = params.into_inner();
    match crawler_service.crawl(params.clone()).await {
        Ok(results) => {
            log::info!(
                "Crawl operation completed successfully for URL: {}",
                params.url
            );
            log::debug!("Crawl results: {:?}", results);
            let response = results
                .into_iter()
                .map(|r| ScrapingResult {
                    all_data: r.data.as_array().unwrap_or(&Vec::new()).to_vec(),
                    input_tokens: r.usage_metadata.input_tokens,
                    output_tokens: r.usage_metadata.output_tokens,
                    total_cost: r.usage_metadata.total_cost,
                    pagination_info: None,
                })
                .collect();
            Ok(Json(response))
        }
        Err(e) => {
            log::error!("Crawl operation failed: {}", e);
            Err(rocket::http::Status::InternalServerError)
        }
    }
}
