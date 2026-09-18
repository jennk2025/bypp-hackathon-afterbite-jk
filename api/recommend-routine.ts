// Vercel 서버리스 함수 (Node.js 런타임)로 배포됩니다.
// Gemini API 키는 여기(서버 쪽 환경변수)에만 존재하며 브라우저로 절대 전달되지 않습니다.
//
// 실제 로직은 runRecommendRoutine()에 있고, 아래 default export는 그걸 Vercel의
// (req, res) 시그니처로 감싸는 얇은 어댑터입니다. vite-plugins/apiDevServer.ts가
// `npm run dev` 중에도 runRecommendRoutine()을 그대로 불러 써서, 로컬에서도 실제
// Gemini 연동 코드를 그대로 태워볼 수 있습니다.

const GEMINI_MODEL = 'gemini-2.0-flash';

const PLACE_LABEL: Record<string, string> = {
  narrow_indoor: '좁은 실내(방 한 칸 정도)',
  living_room: '집 거실 정도 공간',
  outdoor: '야외',
};

const INTENSITY_LABEL: Record<string, string> = {
  low: '낮음',
  mid: '보통',
  high: '높음',
};

function buildPrompt(body: {
  minutes: number;
  place: string;
  intensity: string;
  noiseOk: boolean;
  jumpOk: boolean;
  totalCalories: number;
}): string {
  const placeLabel = PLACE_LABEL[body.place] ?? body.place;
  const intensityLabel = INTENSITY_LABEL[body.intensity] ?? body.intensity;

  return `당신은 친근한 홈트레이닝 코치입니다. 사용자가 간식을 먹은 만큼 가볍게 움직이려고 합니다.
아래 조건에 맞는, 서로 다른 움직임 루틴 3개를 한국어로 추천하세요.

조건:
- 움직일 수 있는 시간: 약 ${body.minutes}분
- 장소: ${placeLabel}
- 원하는 강도: ${intensityLabel}
- 소리를 내도 되는지: ${body.noiseOk ? '괜찮음' : '조용해야 함(이웃 등 고려, 점프·쿵쿵거리는 동작 피하기)'}
- 점프 동작 가능 여부: ${body.jumpOk ? '가능' : '불가능(무릎 부담 등으로 점프 없는 동작만)'}
- 참고용 목표 칼로리: 약 ${Math.round(body.totalCalories)}kcal (정확히 맞출 필요는 없고, 주어진 시간 안에서 현실적인 범위로만 추정)

아래 JSON 배열 형식으로만 답하세요. 다른 설명, 마크다운, 코드블록 없이 순수 JSON만 답하세요.
[
  {
    "name": "루틴 이름(간결하게, 10자 내외)",
    "durationMinutes": 숫자,
    "estBurnLowKcal": 숫자,
    "estBurnHighKcal": 숫자,
    "steps": ["동작 설명1", "동작 설명2", "동작 설명3"]
  }
]
정확히 3개를 답하고, 반드시 주어진 장소·소음·점프 조건을 지키는 동작만 추천하세요.
estBurnLowKcal은 estBurnHighKcal보다 작거나 같아야 하고, 두 값 모두 0보다 커야 합니다.`;
}

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export async function runRecommendRoutine(body: any): Promise<ApiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { status: 500, body: { error: 'Server not configured' } };
  }

  const { minutes, place, intensity, noiseOk, jumpOk, totalCalories } = body ?? {};
  if (typeof minutes !== 'number' || typeof place !== 'string' || typeof intensity !== 'string') {
    return { status: 400, body: { error: 'minutes, place, intensity required' } };
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: buildPrompt({
                    minutes,
                    place,
                    intensity,
                    noiseOk: Boolean(noiseOk),
                    jumpOk: Boolean(jumpOk),
                    totalCalories: typeof totalCalories === 'number' ? totalCalories : 0,
                  }),
                },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!geminiRes.ok) {
      // Vercel 함수 로그(대시보드 > 프로젝트 > Deployments > 함수 로그)에서 실제 원인을
      // 확인할 수 있도록 남깁니다. 흔한 원인: 키 오타/무효, Generative Language API
      // 미활성화, 해당 리전/모델 접근 불가, 쿼터 초과 등.
      const errorText = await geminiRes.text().catch(() => '');
      console.error(
        `[recommend-routine] Gemini ${geminiRes.status} ${geminiRes.statusText}: ${errorText.slice(0, 500)}`
      );
      return {
        status: 502,
        body: { error: 'Gemini request failed', geminiStatus: geminiRes.status },
      };
    }

    const data = await geminiRes.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) {
      console.error(
        '[recommend-routine] Gemini returned no text (safety block or empty candidate?)',
        JSON.stringify(data).slice(0, 500)
      );
      return { status: 502, body: { error: 'Gemini returned no usable content' } };
    }
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.routines) ? parsed.routines : null;
    if (!list) {
      console.error('[recommend-routine] Unexpected Gemini response shape', text.slice(0, 500));
      return { status: 502, body: { error: 'Unexpected Gemini response shape' } };
    }

    const routines = list
      .filter((r: any) => r && typeof r.name === 'string' && Array.isArray(r.steps))
      .map((r: any) => ({
        name: r.name,
        durationMinutes: typeof r.durationMinutes === 'number' ? r.durationMinutes : minutes,
        estBurnLowKcal: typeof r.estBurnLowKcal === 'number' ? r.estBurnLowKcal : 0,
        estBurnHighKcal: typeof r.estBurnHighKcal === 'number' ? r.estBurnHighKcal : 0,
        steps: r.steps.filter((s: unknown) => typeof s === 'string').slice(0, 4),
      }))
      .slice(0, 3);

    return { status: 200, body: { routines } };
  } catch (err) {
    console.error('[recommend-routine] Unexpected error', err);
    return { status: 500, body: { error: 'Unexpected error recommending routines' } };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const result = await runRecommendRoutine(req.body);
  res.status(result.status).json(result.body);
}
