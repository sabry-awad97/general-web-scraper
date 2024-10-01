use reqwest::Client;
use url::Url;

pub struct Downloader {
    client: Client,
}

impl Downloader {
    pub fn new() -> Self {
        Downloader {
            client: Client::new(),
        }
    }

    pub async fn fetch(&self, url: Url) -> Result<String, reqwest::Error> {
        self.client.get(url).send().await?.text().await
    }
}
