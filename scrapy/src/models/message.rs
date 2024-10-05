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
