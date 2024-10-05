import { Toaster } from "@/components/ui/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PropsWithChildren } from "react";
import ReactQueryProvider from "./ReactQueryProvider";
import { ThemeProvider } from "./theme-provider";

const Providers = ({ children }: Required<PropsWithChildren>) => (
  <ThemeProvider defaultTheme="dark" storageKey="scrapy-theme">
    <ReactQueryProvider>
      {children}
      <ReactQueryDevtools />
      <Toaster richColors expand />
    </ReactQueryProvider>
  </ThemeProvider>
);

export default Providers;
