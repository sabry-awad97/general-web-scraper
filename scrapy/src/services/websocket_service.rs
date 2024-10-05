use crate::error::WebSocketError;
use crate::models::WebSocketMessage;
use rocket::tokio::sync::broadcast::{channel, Receiver, Sender};
use rocket::tokio::sync::Mutex;
use std::sync::Arc;

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

    pub async fn _send_message(&self, message: WebSocketMessage) -> Result<(), WebSocketError> {
        let sender = self.sender.lock().await;
        sender.send(message).map_err(WebSocketError::from)?;
        Ok(())
    }

    pub async fn subscribe(&self) -> Receiver<WebSocketMessage> {
        self.sender.lock().await.subscribe()
    }
}
