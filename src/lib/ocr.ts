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

  const nameGuess =
    matchedDbEntry?.name ??
    lines.find((line) => /[가-힣]{2,}/.test(line) && !EXCLUDE_KEYWORDS.some((kw) => line.includes(kw))) ??
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

export async function recognizeSnackPhoto(file: File): Promise<OcrResult> {
  try {
    const worker = await createWorker('kor+eng');
    try {
      const {
        data: { text },
      } = await worker.recognize(file);
      return parseOcrText(text ?? '');
    } finally {
      await worker.terminate();
    }
  } catch {
    return {
      success: false,
      rawText: '',
      nameGuess: '',
      caloriesGuess: null,
      servingSizeGuess: '',
      matchedDbEntry: null,
    };
  }
}
