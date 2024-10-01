mod ai;
mod downloader;
mod spider;

use rocket::response::stream::{Event, EventStream};
use rocket::tokio::sync::broadcast::{channel, Sender};
use rocket::tokio::sync::Mutex;
use rocket::State;
use rocket::{fs::FileServer, get, post, routes, serde::json::Json};
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use serde::{Deserialize, Serialize};
use spider::Spider;
use std::path::PathBuf;
use std::sync::Arc;

mod crawler;

struct WebSocketState {
    sender: Mutex<Sender<String>>,
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

#[get("/")]
fn index() -> &'static str {
    "Welcome to the web scraping API!"
}

#[get("/events")]
async fn events(state: &State<Arc<WebSocketState>>) -> EventStream![] {
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
async fn crawl(
    params: Json<CrawlRequest>,
    state: &State<Arc<WebSocketState>>,
) -> Json<CrawlResponse> {
    let urls = params.urls.clone();
    let delay = params.delay;
    let crawling_concurrency = params.crawling_concurrency;
    let processing_concurrency = params.processing_concurrency;

    println!("urls: {:?}", urls);
    println!("delay: {:?}", delay);
    println!("crawling_concurrency: {:?}", crawling_concurrency);
    println!("processing_concurrency: {:?}", processing_concurrency);

    let sender = state.sender.lock().await;
    let _ = sender.send(format!("Crawling started for {} URLs", urls.len()));

    // Simulate crawling process
    for (index, url) in urls.iter().enumerate() {
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        let _ = sender.send(format!("Crawled URL {}/{}: {}", index + 1, urls.len(), url));
    }

    let _ = sender.send("Crawling completed".to_string());

    Json(CrawlResponse {
        items: vec![String::from("Success")],
    })
}

#[rocket::launch]
fn rocket() -> _ {
    let (sender, _) = channel::<String>(1024);
    let websocket_state = WebSocketState {
        sender: Mutex::new(sender),
    };

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
    .expect("Failed to attach cors");

    let static_dir = PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/static"));

    rocket::build()
        .mount("/api", routes![index, crawl, events])
        .mount("/", FileServer::from(static_dir))
        .manage(Arc::new(websocket_state))
        .attach(cors)
}
