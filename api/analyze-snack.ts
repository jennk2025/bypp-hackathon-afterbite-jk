// Vercel 서버리스 함수 (Node.js 런타임)로 배포됩니다.
// Gemini API 키는 여기(서버 쪽 환경변수)에만 존재하며 브라우저로 절대 전달되지 않습니다.
//
// 실제 로직은 runAnalyzeSnack()에 있고, 아래 default export는 그걸 Vercel의
// (req, res) 시그니처로 감싸는 얇은 어댑터입니다. vite-plugins/apiDevServer.ts가
// `npm run dev` 중에도 runAnalyzeSnack()을 그대로 불러 써서, 로컬에서도 실제
// Gemini 연동 코드를 그대로 태워볼 수 있습니다(배포 때만 동작하는 handler를 거치지 않고).

const GEMINI_MODEL = 'gemini-2.0-flash';

const PROMPT = `이 사진은 과자·음료·아이스크림 등 간식의 포장지 또는 영양정보 표입니다.
사진 속 내용을 바탕으로 아래 JSON 형식으로만 답하세요. 다른 설명은 절대 덧붙이지 마세요.
{"name": "제품명 또는 빈 문자열", "caloriesPerServing": 1회 제공량 기준 칼로리(숫자) 또는 null, "servingSizeLabel": "1회 제공량 설명 또는 빈 문자열"}
확실하지 않은 값은 추측하지 말고 null 또는 빈 문자열로 답하세요.`;

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export async function runAnalyzeSnack(body: any): Promise<ApiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { status: 500, body: { error: 'Server not configured' } };
  }

  const { imageBase64, mimeType } = body ?? {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return { status: 400, body: { error: 'imageBase64 required' } };
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
                { text: PROMPT },
                { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
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
        `[analyze-snack] Gemini ${geminiRes.status} ${geminiRes.statusText}: ${errorText.slice(0, 500)}`
      );
      return {
        status: 502,
        body: { error: 'Gemini request failed', geminiStatus: geminiRes.status },
      };
    }

    const data = await geminiRes.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) {
      console.error('[analyze-snack] Gemini returned no text (safety block or empty candidate?)', JSON.stringify(data).slice(0, 500));
      return { status: 502, body: { error: 'Gemini returned no usable content' } };
    }
    const parsed = JSON.parse(text);

    return {
      status: 200,
      body: {
        name: typeof parsed.name === 'string' ? parsed.name : '',
        caloriesPerServing:
          typeof parsed.caloriesPerServing === 'number' ? parsed.caloriesPerServing : null,
        servingSizeLabel: typeof parsed.servingSizeLabel === 'string' ? parsed.servingSizeLabel : '',
      },
    };
  } catch (err) {
    console.error('[analyze-snack] Unexpected error', err);
    return { status: 500, body: { error: 'Unexpected error analyzing image' } };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const result = await runAnalyzeSnack(req.body);
  res.status(result.status).json(result.body);
}
