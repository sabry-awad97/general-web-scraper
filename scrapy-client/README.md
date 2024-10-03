# Universal Web Scraper 🦑

Universal Web Scraper is a powerful and flexible web scraping application built with a Rust backend and a React TypeScript frontend. It provides an intuitive interface for configuring and executing web scraping tasks, with real-time updates and data visualization.

## Features

- **Flexible Scraping**: Configure custom scraping parameters for any website.
- **Real-Time Updates**: Get instant updates on scraping results.
- **Data Visualization**: View scraped data in an organized table format.
- **Pagination Support**: Automatically handle multi-page scraping tasks.
- **AI-Powered**: Utilizes Google's Gemini AI for advanced data processing.
- **Cost Estimation**: Provides token usage and cost estimates for AI processing.
- **Dark Mode**: Sleek dark mode interface for comfortable viewing.

## Tech Stack

- **Backend**: Rust with Rocket framework
- **Frontend**: React with TypeScript
- **State Management**: React Query
- **Styling**: Tailwind CSS with shadcn/ui components
- **API Communication**: Axios for HTTP requests, WebSocket for real-time updates
- **AI Integration**: Google Generative AI (Gemini)

## Getting Started

### Prerequisites

- Rust (latest stable version)
- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/sabry-awad97/universal-web-scraper.git
   cd universal-web-scraper
   ```

2. Set up the backend:

   ```sh
   cd scrapy
   cargo build
   ```

3. Set up the frontend:

   ```sh
   cd ../scrapy-client
   npm install
   ```

4. Create a `.env` file in the `scrapy` directory and add your Gemini API key:

   ```sh
   GEMINI_API_KEY=your_api_key_here
   ```

### Running the Application

1. Start the backend server:

   ```sh
   cd scrapy
   cargo run
   ```

2. In a new terminal, start the frontend development server:

   ```sh
   cd scrapy-client
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173` to access the application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Rust](https://www.rust-lang.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Google Generative AI (Gemini)](https://ai.google.dev/gemini-api)
