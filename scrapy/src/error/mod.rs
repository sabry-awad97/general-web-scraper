use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("HTTP error: {0}")]
    HttpError(#[from] reqwest::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Missing API key: {0}")]
    MissingAPIKey(String),

    #[error("AI error: {0}")]
    AIError(String),

    #[error("WebSocket error: {0}")]
    WebSocketError(String),
}
