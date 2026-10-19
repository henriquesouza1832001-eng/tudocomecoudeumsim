import React, { Suspense } from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'
import { readFile, writeFile } from 'node:fs/promises'

const vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } })

try {
  const { default: MarketingLanding } = await vite.ssrLoadModule('/src/MarketingLanding.jsx')
  const fallback = React.createElement('div', { className: 'page-loading', 'aria-label': 'Carregando página' })
  const tree = React.createElement(React.StrictMode, null, React.createElement(Suspense, { fallback }, React.createElement(MarketingLanding)))
  const markup = renderToString(tree)
  const manifest = JSON.parse(await readFile('dist/build-manifest.json', 'utf8'))
  const stylesheets = manifest['src/MarketingLanding.jsx']?.css || []
  const stylesheetLinks = stylesheets.map((stylesheet) => `<link rel="stylesheet" href="/${stylesheet}">`).join('')
  const preload = '<link rel="preload" as="image" href="/images/wedding-pexels.avif" type="image/avif" fetchpriority="high">'
  const path = 'dist/index.html'
  let html = await readFile(path, 'utf8')
  html = html.replace('</head>', `${stylesheetLinks}${preload}</head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
  await writeFile(path, html)
} finally {
  await vite.close()
}
