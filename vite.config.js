import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // open: true launches your OS default browser on `npm run dev`
  // (set Chrome as Windows default and it'll open there, not VS Code)
  server: { host: true, port: 5173, open: true },
})
