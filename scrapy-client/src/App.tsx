import { useQuery } from "@tanstack/react-query";
import api from "./api";

function App() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["test"],
    queryFn: () => {
      return api.test();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  console.log(data);

  return <h1>Hello World</h1>;
}

export default App;
