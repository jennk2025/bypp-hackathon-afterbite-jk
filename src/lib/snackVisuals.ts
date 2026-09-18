const EMOJI_RULES: [RegExp, string][] = [
  [/아이스크림|콘|메로나|스크류바|설레임|붕어싸만코|투게더/, '🍦'],
  [/콜라|사이다|우유|음료|박카스|라떼|주스|워터/, '🥤'],
  [/초코|파이|몽쉘|카스타드|홈런볼|오레오|쿠키|비스킷|에이스/, '🍫'],
  [/젤리|사탕|마이쮸|하리보|새콤달콤/, '🍬'],
  [/라면|육포|쥐포/, '🍜'],
];

export function getSnackEmoji(name: string): string {
  const rule = EMOJI_RULES.find(([pattern]) => pattern.test(name));
  return rule ? rule[1] : '🍿';
}
