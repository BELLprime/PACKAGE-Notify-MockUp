import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) for real mobile device testing
    port: 5173
  }
})
