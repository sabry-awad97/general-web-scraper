use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone, Eq, Hash, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum MessageType {
    Progress,
    Raw,
    ScrapingResult,
    Error,
    Success,
    Warning,
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WebSocketMessage {
    #[serde(rename = "type")]
    pub r#type: MessageType,
    pub payload: String,
    pub metadata: Option<serde_json::Value>,
}

impl WebSocketMessage {
    pub fn new(
        message_type: MessageType,
        payload: String,
        metadata: Option<serde_json::Value>,
    ) -> Self {
        Self {
            r#type: message_type,
            payload,
            metadata,
        }
    }

    pub fn progress(message: impl Into<String>) -> Self {
        Self::new(MessageType::Progress, message.into(), None)
    }

    pub fn raw(payload: impl Into<String>) -> Self {
        Self::new(MessageType::Raw, payload.into(), None)
    }

    pub fn scraping_result<T: Serialize>(value: &T) -> Self {
        let json = serde_json::to_string(value).unwrap_or_default();
        Self::new(MessageType::ScrapingResult, json, None)
    }

    pub fn success<T: Serialize>(value: &T) -> Self {
        let json = serde_json::to_string(value).unwrap_or_default();
        Self::new(MessageType::Success, json, None)
    }

    pub fn error(message: impl Into<String>) -> Self {
        Self::new(MessageType::Error, message.into(), None)
    }
}
