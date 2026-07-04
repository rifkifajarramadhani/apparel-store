import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

// Only load the Netlify plugin on Netlify itself; it runs Netlify-dev
// orchestration that breaks non-Netlify runtimes (e.g. Bun in Docker).
const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    process.env.NETLIFY && netlify(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
