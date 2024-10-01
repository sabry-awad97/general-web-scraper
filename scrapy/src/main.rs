mod ai;
mod downloader;
mod spider;

use std::path::PathBuf;

use rocket::{fs::FileServer, get, routes};
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use spider::Spider;
mod crawler;

#[get("/")]
fn index() -> &'static str {
    "Welcome to the web scraping API!"
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
        .mount("/api", routes![index])
        .mount("/", FileServer::from(static_dir))
        .attach(cors)
}
