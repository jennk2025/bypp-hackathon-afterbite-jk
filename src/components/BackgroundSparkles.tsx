// 화면을 느슨한 격자로 나눠 칸마다 하나씩 — 정돈되어 보이면서도 규칙적이지 않게
// 살짝 자리를 어긋나게 두어 자연스럽습니다. delay는 음수를 씁니다 — 무한 반복
// 애니메이션에 양수 delay를 주면 페이지가 열릴 때 별들이 순서대로 "팝" 하고
// 하나씩 나타나며 번지는 것처럼 보여서, 처음부터 이미 재생 중인 것처럼 보이게
// 음수로 바꿨습니다.
const SPARKLES: { top: string; left: string; size: number; color: string; delay: string }[] = [
  { top: '8%', left: '15%', size: 12, color: '#FFC26B', delay: '0s' },
  { top: '16%', left: '85%', size: 10, color: '#C9B6FF', delay: '-0.9s' },
  { top: '48%', left: '92%', size: 11, color: '#7DD3FC', delay: '-1.8s' },
  { top: '58%', left: '8%', size: 10, color: '#4ADE80', delay: '-0.5s' },
  { top: '86%', left: '25%', size: 12, color: '#FF9A76', delay: '-1.3s' },
  { top: '90%', left: '80%', size: 10, color: '#C9B6FF', delay: '-2.1s' },
];

/** 배경 전체에 은은하게 반짝이는 별 장식 — 장식용, 인터랙션 없음 */
export function BackgroundSparkles() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {SPARKLES.map((s, i) => (
        <svg
          key={i}
          className="sparkle-icon absolute opacity-45"
          width={s.size}
          height={s.size}
          viewBox="0 0 20 20"
          fill={s.color}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >
          <path d="M10 0 12.2 7.8 20 10 12.2 12.2 10 20 7.8 12.2 0 10 7.8 7.8Z" />
        </svg>
      ))}
    </div>
  );
}
