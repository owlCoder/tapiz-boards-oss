import { createRoot } from "react-dom/client";
import "@tapizlabs/ui/fonts";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppToastProvider } from "@/components/layout/AppToastProvider";
import DemoApp from "./DemoApp";
import { getState, startStorageSync } from "./runtime/store";

getState();
startStorageSync();
const root = document.getElementById("root");
if (!root) throw new Error("Demo root element missing");
createRoot(root).render(
  <ThemeProvider>
    <AppToastProvider>
      <DemoApp />
    </AppToastProvider>
  </ThemeProvider>,
);
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("./sw.js", { scope: "./", updateViaCache: "none" })
      .catch(() => {
        /* The app still runs when offline caching is unavailable. */
      });
  });
}
