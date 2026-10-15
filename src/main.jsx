import React, { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const App = lazy(() => import('./App.jsx'))
const MarketingLanding = lazy(() => import('./MarketingLanding.jsx'))
const isMarketingLanding = import.meta.env.PROD && window.location.pathname === '/' && !window.location.hash.startsWith('#convite/') && !window.location.hash.startsWith('#confirmar-email/') && !window.location.hash.startsWith('#redefinir-senha/')

if (isMarketingLanding) {
  const imagePreload = document.createElement('link')
  imagePreload.rel = 'preload'
  imagePreload.as = 'image'
  imagePreload.href = '/images/wedding-pexels.webp'
  imagePreload.type = 'image/webp'
  document.head.append(imagePreload)
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div className="page-loading" aria-label="Carregando página" />}>
      {isMarketingLanding ? <MarketingLanding /> : <App />}
    </Suspense>
  </React.StrictMode>,
)
