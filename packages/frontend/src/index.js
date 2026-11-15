import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "@fontsource/fraunces/500.css"
import "@fontsource/fraunces/600.css"
import "@fontsource/geist/400.css"
import "@fontsource/geist/500.css"
import "@fontsource/geist/600.css"
import "@fontsource/geist/700.css"
import "./index.css"
import App from "./App"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
