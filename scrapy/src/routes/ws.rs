use futures_util::{SinkExt, StreamExt};
use rocket::{get, State};
use std::sync::Arc;
use ws::Message;

use crate::services::WebSocketService;

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
