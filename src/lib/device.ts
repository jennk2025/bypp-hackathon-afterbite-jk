// 폰(핸드폰)인지 판별합니다. 폰에서는 네이티브 카메라 앱(capture="environment")이
// 화질이 더 좋아서 그쪽을 우선하고, 그 외(노트북, 아이패드 등)에서는 getUserMedia
// 기반 실시간 촬영으로 대체합니다.
// - 아이패드는 iPadOS 기본 설정에서 데스크톱 Safari와 동일한 UA를 쓰기 때문에
//   이 정규식에 걸리지 않아 "폰이 아님"으로 분류됩니다 — 의도된 동작입니다.
// - 안드로이드 태블릿도 관례상 UA에 "Mobile"이 안 붙어서 마찬가지로 제외됩니다.
export function isLikelyPhone(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(navigator.userAgent);
}
