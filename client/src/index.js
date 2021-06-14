import React from "react";
import ReactDOM from "react-dom";
import "./styles/main.scss";
import App from "./app";
import reportWebVitals from "./reportWebVitals";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root"),
);

Array.from(document.querySelectorAll("[react-cloak]")).forEach((node) =>
  node.removeAttribute("react-cloak"),
);

reportWebVitals(console.log);
