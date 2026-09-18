// Vercel 서버리스 함수 (Node.js 런타임)로 배포됩니다.
// Gemini API 키는 여기(서버 쪽 환경변수)에만 존재하며 브라우저로 절대 전달되지 않습니다.

// gemini-1.5-flash, gemini-2.5-flash 계열은 이 API 키(신규 사용자)로는 이제
// "no longer available to new users" 404를 반환합니다. gemini-3.6-flash가 현재
// 실제로 응답하는 모델이고, gemini-flash-latest는 Google이 계속 최신 안정 버전으로
// 갈아끼워주는 alias라 다음 세대 전환 때도 fallback으로 살아있을 가능성이 높습니다.
const CANDIDATE_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest'];

const PROMPT = `이 사진은 과자, 음료, 빵, 아이스크림 등 간식의 포장지(앞면) 또는 영양정보 표(뒷면)입니다.
사진을 꼼꼼히 분석하여 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록이나 다른 부연 설명 없이 오직 순수 JSON만 반환하세요:
{
  "detectedType": "package_front" | "nutrition_facts" | "both" | "unknown",
  "name": "제품 브랜드명 및 상품명 (예: '포카칩 오리지널', '코카콜라 제로', 포장지에 크게 적힌 글자)",
  "caloriesPerServing": 1회 제공량(또는 총 내용량) 기준 칼로리(숫자, 예: 325) 또는 null,
  "servingSizeLabel": "1회 제공량 및 기준 설명 (예: '1봉지(66g)', '총 500ml')",
  "totalContentCalories": 총 내용량 전체 칼로리(숫자) 또는 null
}
규칙:
1. 영양정보 표에 '1회 제공량당' 또는 '총 내용량당' 열량이 있으면 숫자로 적으세요.
2. 제품명이 크게 적혀있으면 브랜드명과 함께 정확하게 적으세요.
3. 찾을 수 없는 항목은 빈 문자열("") 또는 null로 채우세요. 추측해서 지어내지 마세요.`;

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export async function runAnalyzeSnack(rawBody: any): Promise<ApiResult> {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
  if (!apiKey) {
    console.error('[analyze-snack] GEMINI_API_KEY is missing from environment variables');
    return { status: 500, body: { error: 'Server not configured (API key missing)' } };
  }

  let body: any = rawBody;
  if (typeof rawBody === 'string') {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return { status: 400, body: { error: 'Invalid JSON body' } };
    }
  }

  const { imageBase64, mimeType } = body ?? {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return { status: 400, body: { error: 'imageBase64 required' } };
  }

  const requestPayload = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: { responseMimeType: 'application/json' },
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
        console.warn(`[analyze-snack] Model ${model} failed (${geminiRes.status}): ${lastErrorText.slice(0, 300)}`);
        continue;
      }

      const data = await geminiRes.json();
      let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) {
        console.warn(`[analyze-snack] Model ${model} returned no text`);
        continue;
      }

      // JSON 앞뒤에 혹시 붙은 마크다운 코드블록 제거
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();

      const parsed = JSON.parse(text);

      const calories =
        typeof parsed.caloriesPerServing === 'number'
          ? parsed.caloriesPerServing
          : typeof parsed.totalContentCalories === 'number'
            ? parsed.totalContentCalories
            : null;

      return {
        status: 200,
        body: {
          name: typeof parsed.name === 'string' ? parsed.name.trim() : '',
          caloriesPerServing: calories,
          servingSizeLabel: typeof parsed.servingSizeLabel === 'string' ? parsed.servingSizeLabel.trim() : '',
          detectedType: typeof parsed.detectedType === 'string' ? parsed.detectedType : 'unknown',
        },
      };
    } catch (err) {
      console.warn(`[analyze-snack] Error with model ${model}:`, err);
      lastErrorText = String(err);
    }
  }

  return {
    status: 502,
    body: {
      error: 'Gemini request failed on all candidate models',
      detail: lastErrorText.slice(0, 300),
      geminiStatus: lastStatus,
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const result = await runAnalyzeSnack(req.body);
  res.status(result.status).json(result.body);
}
