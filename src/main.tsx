import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyColorTheme } from "./lib/color-themes";
import { applyAppearance } from "./lib/appearance";

applyColorTheme();
applyAppearance();
createRoot(document.getElementById("root")!).render(<App />);
