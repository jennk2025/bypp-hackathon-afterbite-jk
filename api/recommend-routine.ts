// Vercel 서버리스 함수 (Node.js 런타임)
// gemini-1.5-flash, gemini-2.5-flash 계열은 이 API 키(신규 사용자)로는 이제
// "no longer available to new users" 404를 반환합니다. gemini-3.6-flash가 현재
// 실제로 응답하는 모델이고, gemini-flash-latest는 Google이 계속 최신 안정 버전으로
// 갈아끼워주는 alias라 다음 세대 전환 때도 fallback으로 살아있을 가능성이 높습니다.
const CANDIDATE_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest'];

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
  minutesIsMinimum: boolean;
  place: string;
  intensity: string;
  noiseOk: boolean;
  jumpOk: boolean;
  totalCalories: number;
  extraRequest?: string;
}): string {
  const placeLabel = PLACE_LABEL[body.place] ?? body.place;
  const intensityLabel = INTENSITY_LABEL[body.intensity] ?? body.intensity;
  const timeLabel = body.minutesIsMinimum
    ? `최소 ${body.minutes}분 이상 (더 길어도 좋음, 예: ${body.minutes}~${body.minutes + 15}분)`
    : `정확히 ${body.minutes}분 내외(±2분 이내)`;

  return `당신은 친근한 홈트레이닝 코치입니다. 사용자가 간식을 먹은 만큼 가볍게 움직이려고 합니다.
아래 조건에 맞는, 서로 다른 움직임 루틴 3개를 한국어로 추천하세요.

조건:
- 움직일 수 있는 시간: ${timeLabel}
- 장소: ${placeLabel}
- 원하는 강도: ${intensityLabel}
- 소리를 내도 되는지: ${body.noiseOk ? '괜찮음' : '조용해야 함(이웃 등 고려, 점프·쿵쿵거리는 동작 피하기)'}
- 점프 동작 가능 여부: ${body.jumpOk ? '가능' : '불가능(무릎 부담 등으로 점프 없는 동작만)'}
- 참고용 목표 칼로리: 약 ${Math.round(body.totalCalories)}kcal (정확히 맞출 필요는 없고, 주어진 시간 안에서 현실적인 범위로 추정)
${body.extraRequest ? `- 사용자의 추가 요청사항(참고해서 반영하되, 위 조건과 충돌하면 위 조건을 우선하세요): ${body.extraRequest}` : ''}

정확히 3개의 루틴을 만들어주세요. 소음과 점프 조건을 반드시 지켜주세요.
각 루틴의 durationMinutes는 반드시 위에서 요청한 시간 범위를 지켜주세요 — 짧게 줄이지 마세요.
동작(steps) 개수와 각 동작 설명 길이도 durationMinutes에 맞게 충분히 구성하세요.
estBurnLowKcal은 estBurnHighKcal보다 작거나 같아야 합니다.`;
}

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export async function runRecommendRoutine(rawBody: unknown): Promise<ApiResult> {
  // 💡 Vercel 환경변수에서 API 키를 가져옵니다.
  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
  
  if (!apiKey) {
    console.error('API Key is missing in Vercel Environment Variables');
    return { status: 500, body: { error: '서버에 API 키가 설정되지 않았습니다.' } };
  }

  let body: any = rawBody;
  if (typeof rawBody === 'string') {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return { status: 400, body: { error: '잘못된 JSON 형식입니다.' } };
    }
  }

  // 데이터 안전하게 추출 및 형변환
  const minutes = Number(body?.minutes);
  const place = String(body?.place || '');
  const intensity = String(body?.intensity || '');
  
  if (isNaN(minutes) || !body?.place || !body?.intensity) {
    return { status: 400, body: { error: 'minutes, place, intensity 값이 올바르지 않습니다.' } };
  }

  const extraRequest = typeof body?.extraRequest === 'string' ? body.extraRequest.trim().slice(0, 200) : '';
  const minutesIsMinimum = Boolean(body?.minutesIsMinimum);

  const promptText = buildPrompt({
    minutes,
    minutesIsMinimum,
    place,
    intensity,
    noiseOk: Boolean(body?.noiseOk),
    jumpOk: Boolean(body?.jumpOk),
    totalCalories: Number(body?.totalCalories) || 0,
    extraRequest: extraRequest || undefined,
  });

  // 프롬프트 문구만으로는 모델이 조용히 무시할 수 있어, 구조화 출력 스키마에도
  // durationMinutes 범위를 직접 강제합니다("20분+" 선택 시 15분짜리가 오는 문제 방지).
  const durationRange = minutesIsMinimum
    ? { minimum: minutes, maximum: minutes + 15 }
    : { minimum: Math.max(1, minutes - 2), maximum: minutes + 2 };

  const requestPayload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { 
      responseMimeType: 'application/json',
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "루틴 이름(간결하게, 10자 내외)" },
            durationMinutes: { type: "INTEGER", minimum: durationRange.minimum, maximum: durationRange.maximum },
            estBurnLowKcal: { type: "INTEGER" },
            estBurnHighKcal: { type: "INTEGER" },
            steps: { 
              type: "ARRAY", 
              items: { type: "STRING" },
              description: "동작 설명들"
            }
          },
          required: ["name", "durationMinutes", "estBurnLowKcal", "estBurnHighKcal", "steps"]
        }
      }
    },
  };

  let lastErrorText = '';
  let lastStatus = 500;

  for (const model of CANDIDATE_MODELS) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        }
      );

      if (!geminiRes.ok) {
        lastStatus = geminiRes.status;
        lastErrorText = await geminiRes.text().catch(() => '');
        console.warn(`[recommend-routine] Model ${model} failed (${geminiRes.status}):`, lastErrorText);
        continue;
      }

      const data = (await geminiRes.json()) as any;
      let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      
      if (!text) continue;

      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.routines) ? parsed.routines : null;
      if (!list) throw new Error("배열 형태의 JSON이 아닙니다.");

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
      console.warn(`[recommend-routine] Error with model ${model}:`, err);
      lastErrorText = String(err);
    }
  }

  return {
    status: 502,
    body: {
      error: '모든 모델에서 응답 처리에 실패했습니다.',
      detail: lastErrorText.slice(0, 300),
      geminiStatus: lastStatus,
    },
  };
}

// 💡 Vercel API 라우트 핸들러 (타입 에러 방지를 위해 명시적 처리)
export default async function handler(req: any, res: any) {
  // CORS 처리 (선택 사항이나 프론트엔드 연동 시 유용함)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await runRecommendRoutine(req.body);
  return res.status(result.status).json(result.body);
}
