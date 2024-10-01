import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

// Export the Vite configuration
export default defineConfig({
  // Configure plugins
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Configure the development server
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (_proxyReq, req) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url,
            );
          });
        },
      },
    },
    // This proxy configuration redirects any requests starting with '/api'
    // to 'http://localhost:8000/'. This is useful for local development
    // when your frontend and backend are on different ports.
  },

  // Configure the build process
  build: {
    // Set the output directory for the built files
    outDir: "../scrapy/static",
    // This specifies where Vite should output the built files.
    // This is often used when the frontend
    // needs to be served by the backend server.
  },
});
