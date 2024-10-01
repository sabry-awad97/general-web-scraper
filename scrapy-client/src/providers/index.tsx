import { Toaster } from "@/components/ui/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PropsWithChildren } from "react";
import ReactQueryProvider from "./ReactQueryProvider";

const Providers = ({ children }: Required<PropsWithChildren>) => (
  <ReactQueryProvider>
    {children}
    <ReactQueryDevtools />
    <Toaster />
  </ReactQueryProvider>
);

export default Providers;
