// snackVision.ts와 routineVision.ts가 공유하는 Gemini 서버리스 프록시 호출 클라이언트

interface FetchGeminiJsonOptions {
  path: string;
  body: unknown;
  timeoutMs?: number;
}

export async function fetchGeminiJson<T>({
  path,
  body,
  timeoutMs = 25000,
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

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[fetchGeminiJson] Request to ${path} failed with HTTP ${response.status}:`, errText.slice(0, 400));
      return null;
    }
    return (await response.json()) as T;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn(`[fetchGeminiJson] Request to ${path} timed out after ${timeoutMs}ms`);
    } else {
      console.warn(`[fetchGeminiJson] Network or parsing error requesting ${path}:`, err);
    }
    return null;
  }
}
