use thiserror::Error;

use crate::models::WebSocketMessage;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("AI error: {0}")]
    AI(String),

    #[error(transparent)]
    WebSocket(#[from] WebSocketError),
}

#[derive(Error, Debug)]
pub enum WebSocketError {
    #[error("Failed to send message: {0}")]
    SendError(#[from] tokio::sync::broadcast::error::SendError<WebSocketMessage>),
}
