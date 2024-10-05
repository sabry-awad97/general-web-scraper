use rocket::{get, serde::json::Json};
use rocket::{post, State};
use std::sync::Arc;

use crate::models::{ScrapeParams, ScrapingResult};
use crate::services::CrawlerService;
use crate::utils::get_all_models;

pub use ws::websocket;
pub use events::sse_events;

mod ws;
mod events;

#[get("/")]
pub fn index() -> &'static str {
    log::info!("Received request for index route");
    "Welcome to the web scraping API!"
}

#[get("/models")]
pub fn get_models() -> Json<Vec<String>> {
    Json(get_all_models())
}

#[post("/crawl", data = "<params>")]
pub async fn crawl(
    params: Json<ScrapeParams>,
    crawler_service: &State<Arc<CrawlerService>>,
) -> Result<Json<Vec<ScrapingResult>>, rocket::http::Status> {
    log::info!(
        "Initiating crawl request for URL: {} with parameters: {:#?}",
        params.url,
        params
    );

    let params = params.into_inner();
    match crawler_service.crawl(params.clone()).await {
        Ok(results) => {
            log::info!(
                "Crawl operation completed successfully for URL: {}",
                params.url
            );
            log::debug!("Crawl results: {:?}", results);
            let response = results
                .into_iter()
                .map(|r| ScrapingResult {
                    all_data: r.data.as_array().unwrap_or(&Vec::new()).to_vec(),
                    input_tokens: r.usage_metadata.input_tokens,
                    output_tokens: r.usage_metadata.output_tokens,
                    total_cost: r.usage_metadata.total_cost,
                    pagination_info: None,
                })
                .collect();
            Ok(Json(response))
        }
        Err(e) => {
            log::error!("Crawl operation failed: {}", e);
            Err(rocket::http::Status::InternalServerError)
        }
    }
}
