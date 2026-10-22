import React, { lazy, Suspense } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-500.css'
import '@fontsource/playfair-display/latin-600.css'
import '@fontsource/playfair-display/latin-400-italic.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/libre-baskerville/latin-400.css'
import '@fontsource/lora/latin-400.css'
import '@fontsource/manrope/latin-400.css'
import '@fontsource/montserrat/latin-400.css'
import '@fontsource/raleway/latin-400.css'

const App = lazy(() => import('./App.jsx'))
const MarketingLanding = lazy(() => import('./MarketingLanding.jsx'))
const MarketingConcepts = lazy(() => import('./MarketingConcepts.jsx'))
const GiftConcepts = lazy(() => import('./GiftConcepts.jsx'))
const NavigationConcepts = import.meta.env.DEV ? lazy(() => import('./NavigationConcepts.jsx')) : null
const DeviceExperienceConcepts = import.meta.env.DEV ? lazy(() => import('./DeviceExperienceConcepts.jsx')) : null
const isMarketingConcepts = window.location.pathname === '/estudo-identidade'
const isGiftConcepts = window.location.pathname === '/estudo-presentes'
const isNavigationConcepts = import.meta.env.DEV && window.location.pathname === '/estudo-navegacao'
const isDeviceExperienceConcepts = import.meta.env.DEV && window.location.pathname === '/estudo-dispositivos'
const isMarketingLanding = !new URLSearchParams(window.location.search).has('teste-local') && window.location.pathname === '/' && !window.location.hash.startsWith('#convite/') && !window.location.hash.startsWith('#confirmar-email/') && !window.location.hash.startsWith('#redefinir-senha/')

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    if (navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {})
  })
}

async function startApplication() {
  const previewHost = window.location.hostname.endsWith('.tudocomecoudeumsim.pages.dev') && window.location.hostname !== 'tudocomecoudeumsim.pages.dev'
  const demoMode = new URLSearchParams(window.location.search).has('teste-local') && (import.meta.env.DEV || previewHost)
  if (demoMode) {
    const { installDevelopmentAccessSimulator } = await import('./development-access-simulator.js')
    installDevelopmentAccessSimulator()
  }
  const rootElement = document.getElementById('root')
  const application = (
    <React.StrictMode>
      <Suspense fallback={<div className="page-loading" aria-label="Carregando página" />}>
        {isMarketingConcepts ? <MarketingConcepts /> : isGiftConcepts ? <GiftConcepts /> : isNavigationConcepts ? <NavigationConcepts /> : isDeviceExperienceConcepts ? <DeviceExperienceConcepts /> : isMarketingLanding ? <MarketingLanding /> : <App />}
      </Suspense>
    </React.StrictMode>
  )
  if (import.meta.env.PROD && isMarketingLanding) hydrateRoot(rootElement, application)
  else {
    rootElement.replaceChildren()
    createRoot(rootElement).render(application)
  }
}

startApplication()
