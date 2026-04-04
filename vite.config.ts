import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  appType: 'spa',
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
})
