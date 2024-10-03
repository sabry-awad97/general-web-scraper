use futures_util::{SinkExt, StreamExt};
use rocket::response::stream::{Event, EventStream};
use rocket::serde::json::Json;
use rocket::{get, post, State};
use std::sync::Arc;
use ws::Message;

use crate::error::AppError;
use crate::models::{ScrapeParams, WebSocketMessage};
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

#[get("/ws_select")]
pub fn websocket_select(
    ws: ws::WebSocket,
    websocket_service: &State<Arc<WebSocketService>>,
) -> ws::Channel<'static> {
    let service = websocket_service.inner().clone();
    ws.channel(move |stream| Box::pin(handle_websocket_select(stream, service)))
}

async fn handle_websocket_select(
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

#[get("/events")]
pub async fn events(websocket_service: &State<Arc<WebSocketService>>) -> EventStream![] {
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
) -> Result<(), rocket::http::Status> {
    log::info!(
        "Received crawl request for URL: {} with parameters: {:#?}",
        params.url,
        params
    );

    let start_message = format!("Crawling started for {}", params.url);
    match websocket_service
        .send_message(WebSocketMessage::text(start_message.clone()))
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
                .send_message(WebSocketMessage::text(success_message.clone()))
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
