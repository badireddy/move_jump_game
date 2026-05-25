import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { setupAutoUpdate } from './lib/pwa'
import './index.css'

setupAutoUpdate()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
