import { recognizeSnackPhoto } from './ocr';
import { fetchGeminiJson } from './geminiClient';

interface GeminiSnackResponse {
  name?: string;
  caloriesPerServing?: number;
  servingSizeLabel?: string;
  detectedType?: 'package_front' | 'nutrition_facts' | 'both' | 'unknown';
}

export interface VisionResult {
  success: boolean;
  nameGuess: string;
  caloriesGuess: number | null;
  servingSizeGuess: string;
  method: 'gemini' | 'ocr' | 'none';
  note: string;
  detectedType?: string;
}

function buildNote(params: {
  method: 'gemini' | 'ocr';
  hasName: boolean;
  hasCalories: boolean;
  matchedDb?: boolean;
  detectedType?: string;
}): string {
  const { method, hasName, hasCalories, matchedDb, detectedType } = params;
  if (matchedDb) {
    return '사진 속 글자로 내장 간식 DB에서 제품을 찾았어요. 포장지와 비교해 확인해주세요.';
  }
  if (method === 'gemini') {
    if (hasName && hasCalories) {
      return 'AI가 제품명과 칼로리를 모두 성공적으로 인식했어요! 실제 값과 맞는지 확인해주세요.';
    }
    if (hasName && !hasCalories) {
      return detectedType === 'package_front'
        ? '포장지 앞면에서 제품명을 인식했어요. 칼로리는 아래에 직접 입력하거나 영양정보 표를 찍어주세요.'
        : '제품명은 인식했지만 칼로리는 찾지 못했어요. 아래에 직접 입력해주세요.';
    }
    if (!hasName && hasCalories) {
      return '영양정보 표에서 칼로리를 인식했어요. 제품명을 아래에 직접 입력해주세요.';
    }
    return '사진에서 정보를 읽지 못했어요. 아래에 직접 입력해주세요.';
  }

  // OCR fallback
  if (hasName && hasCalories) {
    return '사진에서 제품명과 칼로리를 읽었어요. 실제 포장지와 비교해 확인해주세요.';
  }
  if (hasName && !hasCalories) {
    return '제품명은 읽었지만 칼로리는 찾지 못했어요. 아래에 칼로리를 직접 입력해주세요.';
  }
  if (!hasName && hasCalories) {
    return '칼로리는 읽었지만 제품명은 찾지 못했어요. 아래에 제품명을 직접 입력해주세요.';
  }
  return '사진에서 글자를 읽지 못했어요. 아래에 직접 입력해주세요.';
}

// 모바일 카메라 원본(5~15MB)은 Vercel 서버리스 페이로드 한도(4.5MB)를 초과하므로
// 긴 변 기준 1400px 이하로 안전하게 압축 및 리사이징합니다.
async function downscaleImageForVision(file: File, maxDimension = 1400): Promise<{ base64: string; mimeType: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const targetWidth = Math.round(bitmap.width * scale);
    const targetHeight = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      throw new Error('Canvas context not available');
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1] ?? '';
    return { base64, mimeType: 'image/jpeg' };
  } catch (e) {
    console.warn('[snackVision] Image resize failed, falling back to raw base64:', e);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          base64: result.split(',')[1] ?? '',
          mimeType: file.type || 'image/jpeg',
        });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}

async function tryGemini(file: File): Promise<VisionResult | null> {
  try {
    const { base64: imageBase64, mimeType } = await downscaleImageForVision(file);
    const data = await fetchGeminiJson<GeminiSnackResponse>({
      path: '/api/analyze-snack',
      body: { imageBase64, mimeType },
    });
    if (!data) return null;

    const hasName = Boolean(data.name);
    const hasCalories = data.caloriesPerServing != null;
    if (!hasName && !hasCalories) return null;

    return {
      success: true,
      nameGuess: data.name ?? '',
      caloriesGuess: typeof data.caloriesPerServing === 'number' ? data.caloriesPerServing : null,
      servingSizeGuess: data.servingSizeLabel ?? '',
      method: 'gemini',
      detectedType: data.detectedType,
      note: buildNote({
        method: 'gemini',
        hasName,
        hasCalories,
        detectedType: data.detectedType,
      }),
    };
  } catch (err) {
    console.warn('[snackVision] Gemini analysis failed:', err);
    return null;
  }
}

/**
 * 1) Gemini Vision 인식을 먼저 시도하고 (서버리스 프록시 경유, 모델 fallback 탑재)
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
