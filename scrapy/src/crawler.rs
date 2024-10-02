use std::{
    collections::HashSet,
    fmt::Display,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
    time::Duration,
};

use futures_util::StreamExt;
use serde::Serialize;
use tokio::{
    sync::{mpsc, Barrier},
    time::sleep,
};
use tokio_stream::wrappers::ReceiverStream;

use crate::spider::Spider;

pub struct Crawler {
    delay: Duration,
    crawling_concurrency: usize,
    processing_concurrency: usize,
    barrier: Arc<Barrier>,
    active_spiders: Arc<AtomicUsize>,
}

impl Crawler {
    pub fn new(
        delay: Duration,
        crawling_concurrency: usize,
        processing_concurrency: usize,
    ) -> Self {
        let barrier = Arc::new(Barrier::new(3));
        let active_spiders = Arc::new(AtomicUsize::new(0));
        Self {
            delay,
            crawling_concurrency,
            processing_concurrency,
            barrier,
            active_spiders,
        }
    }

    pub async fn crawl<T, E>(&self, spider: Arc<dyn Spider<Item = T, Error = E>>)
    where
        T: Serialize + Send + 'static,
        E: Display + Send + 'static,
    {
        let mut visited_urls = HashSet::<String>::new();
        let crawling_queue_capacity = self.crawling_concurrency * 400;
        let processing_queue_capacity = self.processing_concurrency * 10;

        let (urls_to_visit_tx, urls_to_visit_rx) = mpsc::channel::<String>(crawling_queue_capacity);
        let (items_tx, items_rx) = mpsc::channel(processing_queue_capacity);
        let (new_urls_tx, mut new_urls_rx) = mpsc::channel(crawling_queue_capacity);

        for url in spider.start_urls() {
            visited_urls.insert(url.clone());
            let _ = urls_to_visit_tx.send(url).await;
        }

        self.launch_processors(spider.clone(), items_rx);

        self.launch_scrapers(
            spider.clone(),
            urls_to_visit_rx,
            new_urls_tx.clone(),
            items_tx,
        );

        loop {
            if let Ok((visited_url, new_urls)) = new_urls_rx.try_recv() {
                visited_urls.insert(visited_url);

                for url in new_urls {
                    if !visited_urls.contains(&url) {
                        visited_urls.insert(url.clone());
                        log::debug!("queueing: {}", url);
                        let _ = urls_to_visit_tx.send(url).await;
                    }
                }
            }

            if new_urls_tx.capacity() == crawling_queue_capacity
                && urls_to_visit_tx.capacity() == crawling_queue_capacity
                && self.active_spiders.load(Ordering::SeqCst) == 0
            {
                break;
            }

            sleep(Duration::from_millis(5)).await;
        }

        drop(urls_to_visit_tx);

        self.barrier.wait().await;
    }

    fn launch_processors<T, E>(
        &self,
        spider: Arc<dyn Spider<Item = T, Error = E>>,
        items: mpsc::Receiver<T>,
    ) where
        T: Serialize + Send + 'static,
        E: Send + 'static,
    {
        let concurrency = self.processing_concurrency;
        let barrier = self.barrier.clone();
        tokio::spawn(async move {
            ReceiverStream::new(items)
                .for_each_concurrent(concurrency, |item| async {
                    let _ = spider.process(item).await;
                })
                .await;

            barrier.wait().await;
        });
    }

    fn launch_scrapers<T, E>(
        &self,
        spider: Arc<dyn Spider<Item = T, Error = E>>,
        urls_to_visit: mpsc::Receiver<String>,
        new_urls_tx: mpsc::Sender<(String, Vec<String>)>,
        items_tx: mpsc::Sender<T>,
    ) where
        T: Serialize + Send + 'static,
        E: Display + Send + 'static,
    {
        let concurrency = self.crawling_concurrency;
        let barrier = self.barrier.clone();
        let delay = self.delay;
        let active_spiders = self.active_spiders.clone();

        tokio::spawn(async move {
            tokio_stream::wrappers::ReceiverStream::new(urls_to_visit)
                .for_each_concurrent(concurrency, |queued_url| {
                    let queued_url = queued_url.clone();
                    async {
                        active_spiders.fetch_add(1, Ordering::SeqCst);
                        let mut urls = Vec::new();
                        let res = spider.scrape(queued_url.clone()).await.map_err(|err| {
                            log::error!("{}", err);
                            err
                        });

                        if let Ok((items, new_urls)) = res {
                            for item in items {
                                let _ = items_tx.send(item).await;
                            }
                            urls = new_urls;
                        }

                        let _ = new_urls_tx.send((queued_url, urls)).await;
                        sleep(delay).await;
                        active_spiders.fetch_sub(1, Ordering::SeqCst);
                    }
                })
                .await;

            drop(items_tx);
            barrier.wait().await;
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use std::sync::Mutex;

    struct MockSpider {
        start_urls: Vec<String>,
        processed_items: Arc<Mutex<Vec<String>>>,
    }

    #[async_trait]
    impl Spider for MockSpider {
        type Item = String;
        type Error = String;

        fn name(&self) -> String {
            "MockSpider".to_string()
        }

        fn start_urls(&self) -> Vec<String> {
            self.start_urls.clone()
        }

        async fn scrape(&self, url: String) -> Result<(Vec<Self::Item>, Vec<String>), Self::Error> {
            Ok((vec![format!("Scraped {}", url)], vec![]))
        }

        async fn process(&self, item: Self::Item) -> Result<(), Self::Error> {
            self.processed_items.lock().unwrap().push(item);
            Ok(())
        }
    }

    #[tokio::test]
    async fn test_crawler_creation() {
        let crawler = Crawler::new(Duration::from_millis(100), 2, 2);
        assert_eq!(crawler.delay, Duration::from_millis(100));
        assert_eq!(crawler.crawling_concurrency, 2);
        assert_eq!(crawler.processing_concurrency, 2);
    }

    #[tokio::test]
    async fn test_crawler_crawl() {
        let crawler = Crawler::new(Duration::from_millis(10), 2, 2);
        let processed_items = Arc::new(Mutex::new(Vec::new()));
        let spider = Arc::new(MockSpider {
            start_urls: vec![
                "http://example.com".to_string(),
                "http://example.org".to_string(),
            ],
            processed_items: processed_items.clone(),
        });

        crawler.crawl(spider).await;

        let items = processed_items.lock().unwrap();
        assert_eq!(items.len(), 2);
        assert!(items.contains(&"Scraped http://example.com".to_string()));
        assert!(items.contains(&"Scraped http://example.org".to_string()));
    }

    #[tokio::test]
    async fn test_crawler_respects_delay() {
        let delay = Duration::from_millis(100);
        let crawler = Crawler::new(delay, 1, 1);
        let processed_items = Arc::new(Mutex::new(Vec::new()));
        let spider = Arc::new(MockSpider {
            start_urls: vec![
                "http://example.com".to_string(),
                "http://example.org".to_string(),
            ],
            processed_items: processed_items.clone(),
        });

        let start = std::time::Instant::now();
        crawler.crawl(spider).await;
        let duration = start.elapsed();

        assert!(
            duration >= delay * 2,
            "Crawler should respect the delay between requests"
        );
    }
}
