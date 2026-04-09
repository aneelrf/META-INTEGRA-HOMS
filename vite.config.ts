import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-dr.png', 'dr-logo.png'],
      manifest: {
        name: 'META Integra',
        short_name: 'META',
        description: 'Instituto Bariátrico y Digestivo Dr. Héctor Sánchez N.',
        theme_color: '#0A1C40',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'favicon-dr.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon-dr.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'favicon-dr.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/META-INTEGRA-HOMS/',
})
