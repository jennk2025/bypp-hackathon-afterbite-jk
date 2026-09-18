import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { apiDevServer } from './vite-plugins/apiDevServer.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // GEMINI_API_KEY는 VITE_ 접두사가 없어 브라우저로는 절대 노출되지 않고,
  // 여기서만 Node 프로세스 환경변수로 읽어 api/*.ts(서버 로직)가 쓸 수 있게 합니다.
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY

  return {
    plugins: [react(), tailwindcss(), apiDevServer()],
    server: {
      port: 3000,
    },
  }
})
