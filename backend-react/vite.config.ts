import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Sur Windows, `localhost` peut se résoudre en IPv4 alors que Vite écoute en IPv6 (::1),
    // ce qui provoque ERR_CONNECTION_REFUSED dans le navigateur. On force donc l'écoute IPv4.
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
