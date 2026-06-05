import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // open: true launches your OS default browser on `npm run dev`
  // (set Chrome as Windows default and it'll open there, not VS Code)
  server: { host: true, port: 5173, open: true },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // split heavy vendors into cacheable chunks that load in parallel
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('postprocessing')) return 'postprocessing'
          if (id.includes('@react-three')) return 'r3f'
          if (
            id.includes('/three/') ||
            id.includes('three-stdlib') ||
            id.includes('three-mesh-bvh')
          )
            return 'three'
          if (id.includes('gsap') || id.includes('lenis')) return 'anim'
          if (id.includes('react') || id.includes('scheduler')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
