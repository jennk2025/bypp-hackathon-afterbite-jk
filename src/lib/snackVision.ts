import { recognizeSnackPhoto } from './ocr';

export interface VisionResult {
  success: boolean;
  nameGuess: string;
  caloriesGuess: number | null;
  servingSizeGuess: string;
  method: 'gemini' | 'ocr' | 'none';
  note: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function tryGemini(file: File): Promise<VisionResult | null> {
  try {
    const imageBase64 = await fileToBase64(file);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('/api/analyze-snack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType: file.type || 'image/jpeg' }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const hasResult = Boolean(data?.name) || data?.caloriesPerServing != null;
    if (!hasResult) return null;

    return {
      success: true,
      nameGuess: data.name ?? '',
      caloriesGuess: typeof data.caloriesPerServing === 'number' ? data.caloriesPerServing : null,
      servingSizeGuess: data.servingSizeLabel ?? '',
      method: 'gemini',
      note: 'AI가 사진을 보고 인식한 결과예요. 실제 포장지와 비교해 꼭 확인해주세요.',
    };
  } catch {
    return null;
  }
}

/**
 * 1) Gemini 비전 인식을 먼저 시도하고 (서버리스 프록시 경유, 키는 서버에만 존재)
 * 2) 실패하면(네트워크 문제·설정 안 됨·한도 초과 등) 브라우저 내 OCR로 자동 전환합니다.
 * 3) 그마저 실패하면 직접 입력으로 안내합니다.
 */
export async function analyzeSnackPhoto(file: File): Promise<VisionResult> {
  const geminiResult = await tryGemini(file);
  if (geminiResult) return geminiResult;

  const ocrResult = await recognizeSnackPhoto(file);
  if (ocrResult.success) {
    return {
      success: true,
      nameGuess: ocrResult.nameGuess,
      caloriesGuess: ocrResult.caloriesGuess,
      servingSizeGuess: ocrResult.servingSizeGuess,
      method: 'ocr',
      note: ocrResult.matchedDbEntry
        ? '사진 속 글자로 내장 DB에서 제품을 찾았어요. 실제 포장지와 비교해 확인해주세요.'
        : '사진에서 글자를 읽어 자동으로 채웠어요. 정확하지 않을 수 있으니 확인해주세요.',
    };
  }

  return {
    success: false,
    nameGuess: '',
    caloriesGuess: null,
    servingSizeGuess: '',
    method: 'none',
    note: '사진에서 정보를 읽지 못했어요. 아래에 직접 입력해주세요.',
  };
}
