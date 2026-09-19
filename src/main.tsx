import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { installLiquidGlassEngine } from "./lib/engine";

installLiquidGlassEngine().catch((error: unknown) => {
  console.error('Could not initialize image refraction.', error);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
