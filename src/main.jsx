import { jsx } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

function isMessageChannelNoise(value) {
  const text = typeof value === "string" ? value : value?.message || value?.error?.message || value?.toString?.() || "";
  return text.toLowerCase().includes("message channel closed before a response was received");
}

window.addEventListener("unhandledrejection", (event) => {
  if (isMessageChannelNoise(event.reason)) {
    event.preventDefault();
  }
});

window.addEventListener("error", (event) => {
  if (isMessageChannelNoise(event.error || event.message)) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(App, {}) })
);
