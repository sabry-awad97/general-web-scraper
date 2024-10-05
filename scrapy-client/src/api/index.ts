import { ScrapeSchema, ScrapingResult } from "@/types";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

// Define the base URL for your API
const BASE_URL = "/api";

// Create an Axios instance with custom configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can modify the request config here (e.g., add authentication tokens)
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // You can modify the response data here if needed
    return response;
  },
  (error: AxiosError) => {
    // Handle errors globally
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Response error:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Request error:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  },
);

const api = {
  getModels: async () => {
    try {
      const response = await apiClient.get<string[]>("/models");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message ||
            "An error occurred while fetching models",
        );
      }
      throw error;
    }
  },
  crawl: async (params: ScrapeSchema) => {
    try {
      const response = await apiClient.post<ScrapingResult[]>("/crawl", params);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || "An error occurred while crawling",
        );
      }
      throw error;
    }
  },
};

export default api;
