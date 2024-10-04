# Universal Web Scraper 🦑

Universal Web Scraper is a powerful and flexible web scraping application built with a Rust backend and a React TypeScript frontend. It provides an intuitive interface for configuring and executing web scraping tasks, with real-time updates and data visualization.

## Features

- **Flexible Scraping**: Configure custom scraping parameters for any website.
- **Real-Time Updates**: Get instant updates on scraping results via WebSocket.
- **Data Visualization**: View scraped data in an organized table format.
- **Pagination Support**: Automatically handle multi-page scraping tasks.
- **AI-Powered**: Utilizes Google's Generative AI (Gemini) for advanced data processing.
- **Cost Estimation**: Provides token usage and cost estimates for AI processing.
- **Dark Mode**: Sleek dark mode interface for comfortable viewing.
- **Responsive Design**: Fully responsive UI that works on desktop and mobile devices.

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

## Project Structure

- `scrapy/`: Rust backend
- `scrapy-client/`: React TypeScript frontend
- `Makefile`: Contains commands for building and running the project

## Available Scripts

In the project directory, you can run:

- `make build`: Build both backend and frontend
- `make run`: Run the entire application (backend and frontend)
- `make clean`: Clean build artifacts
- `make test`: Run tests for both backend and frontend
- `make format`: Format code for both backend and frontend
- `make lint`: Lint code for both backend and frontend

For more available commands, run `make help`.

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
