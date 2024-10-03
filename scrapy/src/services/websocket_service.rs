use crate::models::WebSocketMessage;
use log::error;
use rocket::tokio::sync::broadcast::{channel, Receiver, Sender};
use rocket::tokio::sync::Mutex;
use std::sync::Arc;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum WebSocketError {
    #[error("Failed to send message: {0}")]
    SendError(#[from] tokio::sync::broadcast::error::SendError<WebSocketMessage>),
}

pub struct WebSocketService {
    sender: Arc<Mutex<Sender<WebSocketMessage>>>,
    _receiver: Receiver<WebSocketMessage>, // Keep a reference to prevent the channel from closing
}

impl WebSocketService {
    pub fn new(capacity: usize) -> Self {
        let (sender, receiver) = channel::<WebSocketMessage>(capacity);
        Self {
            sender: Arc::new(Mutex::new(sender)),
            _receiver: receiver,
        }
    }

    pub async fn send_message(&self, message: WebSocketMessage) -> Result<(), WebSocketError> {
        let sender = self.sender.lock().await;
        let _ = sender.send(message).map_err(WebSocketError::from);
        Ok(())
    }

    pub async fn subscribe(&self) -> Receiver<WebSocketMessage> {
        self.sender.lock().await.subscribe()
    }
}
