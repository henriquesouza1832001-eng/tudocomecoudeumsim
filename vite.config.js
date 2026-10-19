import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { PRODUCT_NAME } from './src/product-config.js'

const productMetadata = {
  name: 'product-metadata',
  transformIndexHtml(html) {
    const description = `${PRODUCT_NAME}: crie o site de casamento, compartilhe convites e organize os detalhes da celebração em um só lugar.`
    const values = {
      __PRODUCT_TITLE__: `${PRODUCT_NAME} | Site de casamento, convites e planejamento`,
      __PRODUCT_DESCRIPTION__: description,
      __PRODUCT_OG_TITLE__: `${PRODUCT_NAME} | Site de casamento e convite`,
      __PRODUCT_OG_DESCRIPTION__: description,
    }

    return Object.entries(values).reduce((result, [placeholder, value]) => result.replace(placeholder, value), html)
  },
}

export default defineConfig({
  plugins: [react(), productMetadata],
  build: { manifest: 'build-manifest.json' },
})
