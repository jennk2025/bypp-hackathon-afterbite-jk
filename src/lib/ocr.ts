import { createWorker } from 'tesseract.js';
import { SNACK_DB } from '../data/snackDatabase';
import type { SnackDbEntry } from '../types';

export interface OcrResult {
  success: boolean;
  rawText: string;
  nameGuess: string;
  caloriesGuess: number | null;
  servingSizeGuess: string;
  matchedDbEntry: SnackDbEntry | null;
}

const EXCLUDE_KEYWORDS = ['영양정보', '1회', '열량', '나트륨', '탄수화물', '단백질', '지방', 'kcal', 'KCAL', '%', 'mg'];

function parseOcrText(rawText: string): OcrResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const matchedDbEntry =
    SNACK_DB.find((entry) => lines.some((line) => line.includes(entry.name) || entry.name.includes(line))) ?? null;

  const calorieMatch =
    rawText.match(/(?:열량|칼로리|kcal)[^\d]{0,10}(\d{2,4})/i) ?? rawText.match(/(\d{2,4})\s*kcal/i);
  const caloriesGuess = matchedDbEntry?.caloriesPerServing ?? (calorieMatch ? parseInt(calorieMatch[1], 10) : null);

  const servingMatch = rawText.match(/(?:1회\s*제공량|총\s*내용량|내용량)[^\d]{0,6}(\d+\s*[gGmM]?[lL]?)/);
  const servingSizeGuess = matchedDbEntry?.servingSizeLabel ?? (servingMatch ? servingMatch[1].trim() : '');

  // 영양정보 표 사진이든 포장지 앞면 사진이든 상관없이, 숫자·기호 위주 줄과 너무 긴 설명/문구 줄은
  // 제외하고 남은 짧은 한글 줄을 제품명 후보로 봅니다 (포장지 앞면은 보통 제품명이 가장 짧고 굵게 보임).
  const nameGuess =
    matchedDbEntry?.name ??
    lines.find(
      (line) =>
        /[가-힣]{2,}/.test(line) &&
        line.length <= 20 &&
        !EXCLUDE_KEYWORDS.some((kw) => line.includes(kw))
    ) ??
    '';

  return {
    success: Boolean(nameGuess || caloriesGuess),
    rawText,
    nameGuess,
    caloriesGuess,
    servingSizeGuess,
    matchedDbEntry,
  };
}

const FAILED_OCR_RESULT: OcrResult = {
  success: false,
  rawText: '',
  nameGuess: '',
  caloriesGuess: null,
  servingSizeGuess: '',
  matchedDbEntry: null,
};

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Tesseract는 kor+eng 언어 데이터(수 MB)와 core wasm을 매번 CDN에서 새로 받아오면
// 모바일 회선에서 체감상 "인식을 아예 못 하는" 수준으로 느려질 수 있어, 워커를 한 번만
// 만들어 세션 동안 재사용합니다. 실패하면 다음 시도 때 새 워커로 다시 시작합니다.
let workerPromise: ReturnType<typeof createWorker> | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('kor+eng').catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

// 사진 원본 해상도(특히 카메라로 직접 찍은 사진)가 크면 OCR이 눈에 띄게 느려지므로,
// 텍스트를 읽는 데 충분한 크기로 미리 축소합니다.
async function downscaleForOcr(file: File, maxDimension = 1200): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob ? new File([blob], file.name || 'snack-photo.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

export async function recognizeSnackPhoto(file: File): Promise<OcrResult> {
  try {
    const processedFile = await downscaleForOcr(file);
    const worker = await withTimeout(getWorker(), 20000, 'OCR worker를 준비하지 못했어요');
    const {
      data: { text },
    } = await withTimeout(worker.recognize(processedFile), 20000, 'OCR 인식이 너무 오래 걸려요');
    return parseOcrText(text ?? '');
  } catch {
    // 타임아웃/오류 시 다음 시도에서 새 워커로 다시 시작하도록 리셋합니다.
    workerPromise = null;
    return FAILED_OCR_RESULT;
  }
}
