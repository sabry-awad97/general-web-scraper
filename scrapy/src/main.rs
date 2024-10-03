use crate::crawler::Crawler;
use rocket::{fs::FileServer, routes};
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use services::{CrawlerService, WebSocketService};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

mod ai;
mod crawler;
mod error;
mod models;
mod routes;
mod services;
mod spider;

#[rocket::launch]
fn rocket() -> _ {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let websocket_service = Arc::new(WebSocketService::new(1024));

    let crawler = Crawler::new(Duration::from_millis(200), 2, 500);
    let crawler_service = Arc::new(CrawlerService::new(crawler, websocket_service.clone()));

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
            routes![
                routes::index,
                routes::crawl,
                routes::events,
                routes::websocket,
                routes::websocket_select,
            ],
        )
        .mount("/", FileServer::from(static_dir))
        .manage(websocket_service)
        .manage(crawler_service)
        .attach(cors)
}
