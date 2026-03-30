import { createRoot } from "react-dom/client";
import App from "./routes/App.tsx";
import "./core/config/index.css";

createRoot(document.getElementById("root")!).render(<App />);
