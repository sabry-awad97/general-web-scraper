mod ai;
mod crawler;
mod downloader;
mod spider;

use rocket::response::stream::{Event, EventStream};
use rocket::tokio::sync::broadcast::{channel, Sender};
use rocket::tokio::sync::Mutex;
use rocket::State;
use rocket::{fs::FileServer, get, post, routes, serde::json::Json};
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;

trait CrawlerService {
    fn crawl(&self, params: CrawlRequest) -> Result<CrawlResponse, String>;
}

struct WebSocketState {
    sender: Mutex<Sender<String>>,
}

impl WebSocketState {
    fn new(capacity: usize) -> Self {
        let (sender, _) = channel::<String>(capacity);
        WebSocketState {
            sender: Mutex::new(sender),
        }
    }

    async fn send_message(&self, message: String) -> Result<(), String> {
        let sender = self.sender.lock().await;
        let _ = sender.send(message).map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[derive(Serialize, Deserialize)]
struct CrawlRequest {
    urls: Vec<String>,
    delay: u64,
    crawling_concurrency: usize,
    processing_concurrency: usize,
}

#[derive(Serialize)]
struct CrawlResponse {
    items: Vec<String>,
}

mod routes {
    use super::*;

    #[get("/")]
    pub fn index() -> &'static str {
        "Welcome to the web scraping API!"
    }

    #[get("/events")]
    pub async fn events(state: &State<Arc<WebSocketState>>) -> EventStream![] {
        let receiver = state.sender.lock().await.subscribe();
        EventStream! {
            let mut receiver = receiver;
            loop {
                if let Ok(message) = receiver.recv().await {
                    yield Event::data(message);
                }
            }
        }
    }

    #[post("/crawl", data = "<params>")]
    pub async fn crawl(
        params: Json<CrawlRequest>,
        state: &State<Arc<WebSocketState>>,
        crawler_service: &State<Arc<dyn CrawlerService + Send + Sync>>,
    ) -> Json<CrawlResponse> {
        let _ = state
            .send_message(format!("Crawling started for {} URLs", params.urls.len()))
            .await;

        // Use the CrawlerService to perform the crawl
        let result = crawler_service.crawl(params.into_inner());

        match result {
            Ok(response) => {
                let _ = state.send_message("Crawling completed".to_string()).await;
                Json(response)
            }
            Err(e) => {
                let _ = state.send_message(format!("Crawling failed: {}", e)).await;
                Json(CrawlResponse { items: vec![] })
            }
        }
    }
}

struct SimpleCrawlerService;

impl CrawlerService for SimpleCrawlerService {
    fn crawl(&self, params: CrawlRequest) -> Result<CrawlResponse, String> {
        Ok(CrawlResponse {
            items: vec![String::from("Crawled item")],
        })
    }
}

#[rocket::launch]
fn rocket() -> _ {
    let websocket_state = Arc::new(WebSocketState::new(1024));
    let crawler_service: Arc<dyn CrawlerService + Send + Sync> = Arc::new(SimpleCrawlerService);

    let cors = rocket_cors::CorsOptions {
        allowed_origins: AllowedOrigins::all(),
        allowed_methods: vec![rocket::http::Method::Get, rocket::http::Method::Post]
            .into_iter()
            .map(From::from)
            .collect(),
        allowed_headers: AllowedHeaders::some(&["Authorization", "Accept", "Content-Type"]),
        allow_credentials: true,
        ..Default::default()
    }
    .to_cors()
    .expect("Failed to create CORS");

    let static_dir = PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/static"));

    rocket::build()
        .mount(
            "/api",
            routes![routes::index, routes::crawl, routes::events],
        )
        .mount("/", FileServer::from(static_dir))
        .manage(websocket_state)
        .manage(crawler_service)
        .attach(cors)
}
