import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root is missing from index.html");
}

createRoot(container).render(
  <Sentry.ErrorBoundary
    fallback={<p>Something went wrong. Please refresh the page and try again.</p>}
  >
    <App />
  </Sentry.ErrorBoundary>,
);
