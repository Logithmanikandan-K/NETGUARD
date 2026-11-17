import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom' // 1. Import HashRouter
import App from './App.jsx'
import './index.css' // (or your main css file)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter> 
      <App />
    </HashRouter>
  </React.StrictMode>,
)
