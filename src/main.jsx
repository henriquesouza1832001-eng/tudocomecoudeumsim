import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
