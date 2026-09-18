// snackVision.ts와 routineVision.ts가 공유하는 "Vercel 서버리스 함수(Gemini 프록시)를
// 타임아웃과 함께 호출하고, 실패하면 조용히 null을 돌려주는" 공통 로직입니다.
// 실패 시 각 호출부가 자기 방식(로컬 OCR, 규칙 기반 추천 등)으로 대체합니다.

interface FetchGeminiJsonOptions {
  path: string;
  body: unknown;
  timeoutMs?: number;
}

export async function fetchGeminiJson<T>({
  path,
  body,
  timeoutMs = 15000,
}: FetchGeminiJsonOptions): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
