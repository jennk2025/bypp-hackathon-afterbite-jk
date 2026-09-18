import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

// `npm run dev`(Vite)는 api/ 폴더의 Vercel 서버리스 함수를 전혀 실행하지 않습니다
// (Vercel에 배포됐을 때만 라우팅됨) — 그래서 로컬에서는 늘 /api/* 요청이 404가 나고,
// 클라이언트 쪽 "Gemini 우선, 실패 시 로컬 대체" 로직이 항상 대체 경로로만 빠집니다.
// 이 플러그인은 같은 요청을 Vite의 ssrLoadModule로 api/*.ts를 그대로 불러와 처리해서,
// 로컬에서도 실제 Gemini 연동 코드가 (키가 설정돼 있다면) 진짜로 호출되도록 합니다.

interface ApiResult {
  status: number;
  body: unknown;
}

const ROUTES: Record<string, { modulePath: string; exportName: string }> = {
  '/api/analyze-snack': { modulePath: '/api/analyze-snack.ts', exportName: 'runAnalyzeSnack' },
  '/api/recommend-routine': { modulePath: '/api/recommend-routine.ts', exportName: 'runRecommendRoutine' },
};

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function apiDevServer(): Plugin {
  return {
    name: 'afterbite-api-dev-server',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const route = req.url ? ROUTES[req.url] : undefined;
        if (!route || req.method !== 'POST') {
          next();
          return;
        }

        try {
          const body = await readJsonBody(req);
          const mod = await server.ssrLoadModule(route.modulePath);
          const run = mod[route.exportName] as (body: unknown) => Promise<ApiResult>;
          const result = await run(body);
          sendJson(res, result.status, result.body);
        } catch (err) {
          sendJson(res, 500, { error: 'Dev API route failed', detail: String(err) });
        }
      });
    },
  };
}
