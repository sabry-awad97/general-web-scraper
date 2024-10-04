import { Toaster } from "@/components/ui/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PropsWithChildren } from "react";
import ReactQueryProvider from "./ReactQueryProvider";
import { WebSocketProvider } from "./WebSocketProvider";

const Providers = ({ children }: Required<PropsWithChildren>) => (
  <WebSocketProvider url="/api/ws">
    <ReactQueryProvider>
      {children}
      <ReactQueryDevtools />
      <Toaster />
    </ReactQueryProvider>
  </WebSocketProvider>
);

export default Providers;
