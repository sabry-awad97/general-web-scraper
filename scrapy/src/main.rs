use crate::crawler::Crawler;
use rocket::{fs::FileServer, routes};
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use services::{AIService, CrawlerService, GeminiAIProvider, WebSocketService};
use std::sync::Arc;
use std::time::Duration;
use utils::find_static_dir;

mod ai;
mod constants;
mod crawler;
mod error;
mod models;
mod routes;
mod services;
mod spider;
mod utils;

#[rocket::launch]
fn rocket() -> _ {
    dotenvy::dotenv().ok();

    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let websocket_service = Arc::new(WebSocketService::new(1024));
    let gemini_provider = GeminiAIProvider::new();
    let ai_service = Arc::new(AIService::new(gemini_provider));

    let crawler = Crawler::new(Duration::from_millis(200), 2, 500);
    let crawler_service = Arc::new(CrawlerService::new(
        crawler,
        websocket_service.clone(),
        ai_service.clone(),
    ));

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

    let static_dir = find_static_dir();

    if !static_dir.is_dir() {
        panic!("Static directory does not exist: {:?}", static_dir);
    }

    log::info!("Using static directory: {:?}", static_dir);

    rocket::build()
        .mount(
            "/api",
            routes![
                routes::index,
                routes::crawl,
                routes::websocket,
                routes::get_models
            ],
        )
        .mount("/", FileServer::from(static_dir))
        .manage(websocket_service)
        .manage(crawler_service)
        .manage(ai_service)
        .attach(cors)
}
