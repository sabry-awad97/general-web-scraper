mod ai;
mod downloader;
mod spider;

use spider::Spider;
mod crawler;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}
