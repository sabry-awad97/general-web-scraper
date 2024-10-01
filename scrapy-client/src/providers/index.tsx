import { PropsWithChildren } from "react";
import ReactQueryProvider from "./ReactQueryProvider";

const Providers = ({ children }: Required<PropsWithChildren>) => (
  <ReactQueryProvider>{children}</ReactQueryProvider>
);

export default Providers;
