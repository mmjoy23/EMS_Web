// @ts-expect-error react-dom/client is provided at runtime but lacks type declarations.
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AuthProvider } from "./context/AuthContext";
// @ts-expect-error CSS is handled by the bundler but lacks type declarations.
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
