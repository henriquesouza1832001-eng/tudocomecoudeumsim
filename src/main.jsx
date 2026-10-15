import React, { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

const App = lazy(() => import('./App.jsx'))
const MarketingLanding = lazy(() => import('./MarketingLanding.jsx'))
const isMarketingLanding = import.meta.env.PROD && window.location.pathname === '/' && !window.location.hash.startsWith('#convite/') && !window.location.hash.startsWith('#confirmar-email/') && !window.location.hash.startsWith('#redefinir-senha/')

if (isMarketingLanding) {
  const imagePreload = document.createElement('link')
  imagePreload.rel = 'preload'
  imagePreload.as = 'image'
  imagePreload.href = '/images/wedding-pexels.avif'
  imagePreload.type = 'image/avif'
  imagePreload.fetchPriority = 'high'
  document.head.append(imagePreload)
}

if (!isMarketingLanding) {
  const fontPreconnect = document.createElement('link')
  fontPreconnect.rel = 'preconnect'
  fontPreconnect.href = 'https://fonts.googleapis.com'
  document.head.append(fontPreconnect)

  const fontFilePreconnect = document.createElement('link')
  fontFilePreconnect.rel = 'preconnect'
  fontFilePreconnect.href = 'https://fonts.gstatic.com'
  fontFilePreconnect.crossOrigin = 'anonymous'
  document.head.append(fontFilePreconnect)

  const appFonts = document.createElement('link')
  appFonts.rel = 'stylesheet'
  appFonts.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap'
  document.head.append(appFonts)
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
