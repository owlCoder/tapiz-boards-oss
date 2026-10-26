import { createRoot } from "react-dom/client";
import { ThemeProvider } from "../src/components/theme/ThemeProvider";
import DemoApp from "../src/features/demo/DemoApp";
import "./site.css";
import "../src/features/demo/demo.css";

// The full classroom demo runs in the browser, without Next.js server actions.
const root = document.getElementById("root");
if (!root) throw new Error("Demo root element missing");
createRoot(root).render(
  <ThemeProvider>
    <DemoApp />
  </ThemeProvider>
);
