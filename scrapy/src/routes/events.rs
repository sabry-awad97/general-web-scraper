use std::sync::Arc;

use rocket::{get, response::stream::{Event, EventStream}, State};

use crate::services::WebSocketService;

#[get("/events")]
pub async fn sse_events(websocket_service: &State<Arc<WebSocketService>>) -> EventStream![] {
    log::info!("Client connected to SSE events stream");
    let mut receiver = websocket_service.subscribe().await;
    EventStream! {
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
