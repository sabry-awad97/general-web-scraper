use std::sync::Arc;

use futures_util::{pin_mut, stream, StreamExt};
use rocket::{
    get,
    response::stream::{Event, EventStream},
    State,
};

use crate::services::WebSocketService;

use rocket::tokio::time::Duration;

#[get("/events")]
pub async fn sse_events(websocket_service: &State<Arc<WebSocketService>>) -> EventStream![] {
    log::info!("🌟 Client connected to SSE events stream");
    let receiver = websocket_service.subscribe().await;

    // Create a heartbeat stream
    let heartbeat = stream::repeat_with(|| Event::data("❤️")).then(|e: Event| async move {
        tokio::time::sleep(Duration::from_secs(30)).await;
        e
    });

    // Combine message stream with heartbeat
    EventStream! {
        let combined_stream = stream::select(
            stream::unfold(receiver, |mut rx| async move {
                match rx.recv().await {
                    Ok(message) => {
                        log::debug!("📤 Sending SSE event: {:?}", message);
                        Some((Event::json(&message), rx))
                    },
                    Err(e) => {
                        log::error!("❌ SSE channel closed: {}", e);
                        None
                    }
                }
            }),
            heartbeat
        );

        pin_mut!(combined_stream);

        while let Some(event) = combined_stream.next().await {
            yield event;
        }

        log::info!("👋 SSE event stream ended");
    }
}
