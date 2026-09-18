// Vercel 서버리스 함수 (Node.js 런타임)로 배포됩니다.
// Gemini API 키는 여기(서버 쪽 환경변수)에만 존재하며 브라우저로 절대 전달되지 않습니다.

const GEMINI_MODEL = 'gemini-2.0-flash';

const PROMPT = `이 사진은 과자·음료·아이스크림 등 간식의 포장지 또는 영양정보 표입니다.
사진 속 내용을 바탕으로 아래 JSON 형식으로만 답하세요. 다른 설명은 절대 덧붙이지 마세요.
{"name": "제품명 또는 빈 문자열", "caloriesPerServing": 1회 제공량 기준 칼로리(숫자) 또는 null, "servingSizeLabel": "1회 제공량 설명 또는 빈 문자열"}
확실하지 않은 값은 추측하지 말고 null 또는 빈 문자열로 답하세요.`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  const { imageBase64, mimeType } = req.body ?? {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    res.status(400).json({ error: 'imageBase64 required' });
    return;
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
      res.status(502).json({ error: 'Gemini request failed' });
      return;
    }

    const data = await geminiRes.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = JSON.parse(text);

    res.status(200).json({
      name: typeof parsed.name === 'string' ? parsed.name : '',
      caloriesPerServing:
        typeof parsed.caloriesPerServing === 'number' ? parsed.caloriesPerServing : null,
      servingSizeLabel: typeof parsed.servingSizeLabel === 'string' ? parsed.servingSizeLabel : '',
    });
  } catch {
    res.status(500).json({ error: 'Unexpected error analyzing image' });
  }
}
