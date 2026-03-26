import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Note: StrictMode removed to prevent double-mounting in development
// which causes duplicate API calls and Prisma queries
createRoot(document.getElementById("root")).render(<App />);
