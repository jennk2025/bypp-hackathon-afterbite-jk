// Vercel 서버리스 함수 (Node.js 런타임)로 배포됩니다.
// 사진이 아니라 "이름"만으로 칼로리를 찾아주는 텍스트 전용 Gemini 호출입니다.
// analyze-snack.ts(사진 인식)와 같은 "확실하지 않으면 지어내지 말고 모른다고 답하라"
// 원칙을 그대로 씁니다 — 로컬 SNACK_DB에 없는 이름을 입력했을 때, 대중적으로 잘 알려진
// 음식/브랜드 메뉴면 자동으로 채워주고 그렇지 않으면 사용자가 직접 입력하게 유도합니다.

const CANDIDATE_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest'];

function buildPrompt(name: string): string {
  return `당신은 한국에서 파는 음식·간식·음료의 칼로리 정보를 잘 아는 영양 정보 도우미입니다.
사용자가 "${name}"이라는 이름을 입력했습니다.

이 이름이 대중적으로 잘 알려진 프랜차이즈 메뉴, 유명 브랜드 제품, 또는 칼로리가 널리
알려진 일반적인 음식이라면 일반적으로 알려진 1회 제공량 기준 칼로리를 답하세요.
이름이 모호하거나, 처음 들어보거나, 확실하지 않다면 절대 추측해서 숫자를 지어내지 말고
found를 false로 답하세요.

아래 JSON 형식으로만 답하세요. 다른 설명, 마크다운, 코드블록 없이 순수 JSON만 답하세요:
{
  "found": boolean,
  "name": "정확한 상품/메뉴명 (모르면 입력받은 이름 그대로)",
  "caloriesPerServing": 숫자 또는 null,
  "servingSizeLabel": "1회 제공량 설명 (예: '1인분', '1개(250g)') 또는 빈 문자열"
}`;
}

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export async function runLookupSnack(rawBody: unknown): Promise<ApiResult> {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
  if (!apiKey) {
    console.error('[lookup-snack] GEMINI_API_KEY is missing from environment variables');
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

  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 60) : '';
  if (!name) {
    return { status: 400, body: { error: 'name required' } };
  }

  // responseSchema로 caloriesPerServing을 INTEGER로 못 박아뒀더니, "빅맥"처럼 실제로는
  // 잘 알려진 메뉴인데도 found:false가 더 자주 나오는 걸 확인해서(스키마가 숫자를 반드시
  // 채우도록 강제하니 모델이 더 보수적으로 "모른다"를 택하는 것으로 보임), analyze-snack.ts와
  // 같은 방식으로 프롬프트 지시문 + JSON 모드만 쓰고 별도 스키마는 강제하지 않습니다.
  const requestPayload = {
    contents: [{ parts: [{ text: buildPrompt(name) }] }],
    generationConfig: {
      responseMimeType: 'application/json',
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
        console.warn(`[lookup-snack] Model ${model} failed (${geminiRes.status}): ${lastErrorText.slice(0, 300)}`);
        continue;
      }

      const data = (await geminiRes.json()) as any;
      let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) {
        console.warn(`[lookup-snack] Model ${model} returned no text`);
        continue;
      }

      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(text);

      if (!parsed?.found || typeof parsed.caloriesPerServing !== 'number') {
        return { status: 200, body: { found: false } };
      }

      return {
        status: 200,
        body: {
          found: true,
          name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : name,
          caloriesPerServing: Math.max(0, Math.round(parsed.caloriesPerServing)),
          servingSizeLabel: typeof parsed.servingSizeLabel === 'string' ? parsed.servingSizeLabel.trim() : '',
        },
      };
    } catch (err) {
      console.warn(`[lookup-snack] Error with model ${model}:`, err);
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
  const result = await runLookupSnack(req.body);
  res.status(result.status).json(result.body);
}
