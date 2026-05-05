import React from "react";
import ReactDOM from "react-dom/client";
import "../app.css";
import RootApp from "./app/RootApp";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
