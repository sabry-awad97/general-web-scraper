import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import api from "./api";

function App() {
  const [urls, setUrls] = useState("");
  const [delay, setDelay] = useState(100);
  const [crawlingConcurrency, setCrawlingConcurrency] = useState(2);
  const [processingConcurrency, setProcessingConcurrency] = useState(2);
  const [results, setResults] = useState<string[]>([]);
  const { mutateAsync: crawl } = useMutation({
    mutationKey: ["crawl"],
    mutationFn: () => {
      return api.crawl({
        urls: urls.split("\n"),
        delay,
        crawling_concurrency: crawlingConcurrency,
        processing_concurrency: processingConcurrency,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await crawl();
      setResults(response.items);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="App">
      <h1>Web Scraper</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>URLs (one per line):</label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={5}
            cols={50}
          />
        </div>
        <div>
          <label>Delay (ms):</label>
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label>Crawling Concurrency:</label>
          <input
            type="number"
            value={crawlingConcurrency}
            onChange={(e) => setCrawlingConcurrency(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label>Processing Concurrency:</label>
          <input
            type="number"
            value={processingConcurrency}
            onChange={(e) => setProcessingConcurrency(parseInt(e.target.value))}
          />
        </div>
        <button type="submit">Start Crawling</button>
      </form>
      <h2>Results:</h2>
      <ul>
        {results.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
