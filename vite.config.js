import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const token = env.TMDB_TOKEN || env.VITE_TMDB_API_KEY

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/tmdb': {
          target: 'https://api.themoviedb.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/tmdb/, '/3'),
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      },
    },
  }
})