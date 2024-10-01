mod ai;
mod downloader;
mod spider;

use std::path::PathBuf;

use rocket::{fs::FileServer, get, post, routes, serde::json::Json};
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use serde::{Deserialize, Serialize};
use spider::Spider;
mod crawler;

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

#[post("/crawl", data = "<params>")]
fn crawl(params: Json<CrawlRequest>) -> Json<CrawlResponse> {
    let urls = params.urls.clone();
    let delay = params.delay;
    let crawling_concurrency = params.crawling_concurrency;
    let processing_concurrency = params.processing_concurrency;

    println!("urls: {:?}", urls);
    println!("delay: {:?}", delay);
    println!("crawling_concurrency: {:?}", crawling_concurrency);
    println!("processing_concurrency: {:?}", processing_concurrency);

    Json(CrawlResponse {
        items: vec![String::from("Success")],
    })
}

#[rocket::launch]
fn rocket() -> _ {
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
        .mount("/api", routes![index, crawl])
        .mount("/", FileServer::from(static_dir))
        .attach(cors)
}
