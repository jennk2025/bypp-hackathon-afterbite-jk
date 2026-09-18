import { recognizeSnackPhoto } from './ocr';

export interface VisionResult {
  success: boolean;
  nameGuess: string;
  caloriesGuess: number | null;
  servingSizeGuess: string;
  method: 'gemini' | 'ocr' | 'none';
  note: string;
}

// 사진 한 장이 포장지 앞면(제품명 위주)인지 영양정보 표인지 미리 구분하지 않고,
// Gemini·OCR 둘 다 "찾은 만큼만" 채우게 한 뒤, 어떤 항목을 못 찾았는지 안내 문구로 알려줍니다.
function buildNote(params: {
  method: 'gemini' | 'ocr';
  hasName: boolean;
  hasCalories: boolean;
  matchedDb?: boolean;
}): string {
  const { method, hasName, hasCalories, matchedDb } = params;
  if (matchedDb) {
    return '사진 속 글자로 내장 DB에서 제품을 찾았어요. 실제 포장지와 비교해 확인해주세요.';
  }
  const methodLabel = method === 'gemini' ? 'AI가' : '사진에서 글자를 읽어';
  if (hasName && hasCalories) {
    return `${methodLabel} 제품명과 칼로리를 모두 인식했어요. 실제 포장지와 비교해 꼭 확인해주세요.`;
  }
  if (hasName && !hasCalories) {
    return '제품명은 인식했지만 칼로리 정보는 찾지 못했어요. 영양정보 표를 다시 찍거나 아래에서 직접 입력해주세요.';
  }
  if (!hasName && hasCalories) {
    return '칼로리 정보는 인식했지만 제품명은 찾지 못했어요. 아래에 제품명을 직접 입력해주세요.';
  }
  return '사진에서 정보를 읽지 못했어요. 아래에 직접 입력해주세요.';
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
    const hasName = Boolean(data?.name);
    const hasCalories = data?.caloriesPerServing != null;
    if (!hasName && !hasCalories) return null;

    return {
      success: true,
      nameGuess: data.name ?? '',
      caloriesGuess: typeof data.caloriesPerServing === 'number' ? data.caloriesPerServing : null,
      servingSizeGuess: data.servingSizeLabel ?? '',
      method: 'gemini',
      note: buildNote({ method: 'gemini', hasName, hasCalories }),
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
      note: buildNote({
        method: 'ocr',
        hasName: Boolean(ocrResult.nameGuess),
        hasCalories: ocrResult.caloriesGuess != null,
        matchedDb: Boolean(ocrResult.matchedDbEntry),
      }),
    };
  }

  return {
    success: false,
    nameGuess: '',
    caloriesGuess: null,
    servingSizeGuess: '',
    method: 'none',
    note: buildNote({ method: 'ocr', hasName: false, hasCalories: false }),
  };
}
