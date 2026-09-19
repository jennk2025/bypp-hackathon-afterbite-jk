import { fetchGeminiJson } from './geminiClient';

interface LookupSnackResponse {
  found?: boolean;
  name?: string;
  caloriesPerServing?: number;
  servingSizeLabel?: string;
}

export interface SnackLookupResult {
  found: boolean;
  name: string;
  caloriesPerServing: number;
  servingSizeLabel: string;
}

/**
 * 이름만으로 칼로리를 찾아줍니다. 로컬 SNACK_DB에 없는 이름을 입력했을 때, 대중적으로
 * 잘 알려진 음식/브랜드 메뉴면 Gemini가 일반적으로 알려진 칼로리를 답해주고, 확실하지
 * 않은 이름이면 found: false를 돌려줘서 그대로 직접 입력하게 둡니다(추측해서 지어내지
 * 않음 — analyze-snack.ts 사진 인식과 같은 원칙).
 */
export async function lookupSnackByName(name: string): Promise<SnackLookupResult> {
  const trimmed = name.trim();
  if (!trimmed) return { found: false, name: trimmed, caloriesPerServing: 0, servingSizeLabel: '' };

  try {
    const data = await fetchGeminiJson<LookupSnackResponse>({
      path: '/api/lookup-snack',
      body: { name: trimmed },
    });

    if (!data?.found || typeof data.caloriesPerServing !== 'number') {
      return { found: false, name: trimmed, caloriesPerServing: 0, servingSizeLabel: '' };
    }

    return {
      found: true,
      name: data.name?.trim() || trimmed,
      caloriesPerServing: Math.max(0, Math.round(data.caloriesPerServing)),
      servingSizeLabel: data.servingSizeLabel ?? '',
    };
  } catch (err) {
    console.warn('[snackLookup] Gemini lookup failed:', err);
    return { found: false, name: trimmed, caloriesPerServing: 0, servingSizeLabel: '' };
  }
}
