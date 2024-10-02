use async_trait::async_trait;
use crawler::Crawler;
use reqwest::Client;
use rocket::response::stream::{Event, EventStream};
use rocket::tokio::sync::broadcast::{channel, Sender};
use rocket::tokio::sync::Mutex;
use rocket::State;
use rocket::{fs::FileServer, get, post, routes, serde::json::Json};
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use spider::Spider;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

mod ai;
mod crawler;
mod spider;

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Reqwest Error: {0}")]
    Reqwest(#[from] reqwest::Error),
}

struct GenericSpider {
    http_client: Client,
    selectors: Vec<Selector>,
}

impl GenericSpider {
    pub fn new(selectors: Vec<&str>) -> Self {
        let http_timeout = Duration::from_secs(6);
        let http_client = Client::builder()
            .timeout(http_timeout)
            .build()
            .expect("spiders/quotes: Building HTTP client");

        let selectors = selectors
            .into_iter()
            .map(|s| Selector::parse(s).unwrap())
            .collect();

        Self {
            http_client,
            selectors,
        }
    }
}

#[derive(Debug, Clone)]
pub struct GenericItem {
    pub url: String,
    pub title: Option<String>,
    pub content: Option<String>,
}

#[async_trait]
impl Spider for GenericSpider {
    type Item = GenericItem;
    type Error = AppError;

    fn name(&self) -> String {
        String::from("generic")
    }

    fn start_urls(&self) -> Vec<String> {
        vec![]
    }

    async fn scrape(&self, url: String) -> Result<(Vec<Self::Item>, Vec<String>), Self::Error> {
        let res = self.http_client.get(&url).send().await?;
        let html = res.text().await?;
        let document = Html::parse_document(&html);

        let mut items = Vec::new();
        let mut new_urls = Vec::new();

        for selector in &self.selectors {
            for element in document.select(selector) {
                let title = element.value().attr("title").map(String::from);
                let content = Some(element.inner_html());

                items.push(GenericItem {
                    url: url.clone(),
                    title,
                    content,
                });

                // Extract links from the element
                if let Some(href) = element.value().attr("href") {
                    new_urls.push(href.to_string());
                }
            }
        }

        println!(
            "Found {} items and {} new URLs",
            items.len(),
            new_urls.len()
        );

        Ok((items, vec![]))
    }

    async fn process(&self, item: Self::Item) -> Result<(), Self::Error> {
        println!("Processing item: {:?}", item);
        Ok(())
    }
}

#[async_trait]
trait CrawlerService {
    async fn crawl(&self, params: CrawlRequest) -> Result<CrawlResponse, String>;
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
        let result = crawler_service.crawl(params.into_inner()).await;

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

struct RealCrawlerService {
    crawler: Crawler,
}

#[async_trait]
impl CrawlerService for RealCrawlerService {
    async fn crawl(&self, _params: CrawlRequest) -> Result<CrawlResponse, String> {
        let selectors = vec!["a", "p", "h1", "h2", "h3"];
        let spider = Arc::new(GenericSpider::new(selectors));
        self.crawler.crawl(spider).await;
        Ok(CrawlResponse {
            items: vec![String::from("Crawled item")],
        })
    }
}

#[rocket::launch]
fn rocket() -> _ {
    let websocket_state = Arc::new(WebSocketState::new(1024));
    let crawler = Crawler::new(Duration::from_millis(200), 2, 500);
    let crawler_service: Arc<dyn CrawlerService + Send + Sync> =
        Arc::new(RealCrawlerService { crawler });

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
