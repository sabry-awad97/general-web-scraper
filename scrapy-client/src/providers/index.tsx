import { Toaster } from "@/components/ui/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PropsWithChildren } from "react";
import ReactQueryProvider from "./ReactQueryProvider";
import { WebSocketProvider } from "./WebSocketProvider";
import { ThemeProvider } from "./theme-provider";

const Providers = ({ children }: Required<PropsWithChildren>) => (
  <ThemeProvider defaultTheme="dark" storageKey="scrapy-theme">
    <WebSocketProvider url="/api/ws">
      <ReactQueryProvider>
        {children}
        <ReactQueryDevtools />
        <Toaster richColors expand />
      </ReactQueryProvider>
    </WebSocketProvider>
  </ThemeProvider>
);

export default Providers;
