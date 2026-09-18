const SPARKLES: { top: string; left: string; size: number; color: string; delay: string }[] = [
  { top: '6%', left: '12%', size: 14, color: '#FFC26B', delay: '0s' },
  { top: '14%', left: '82%', size: 11, color: '#C9B6FF', delay: '0.8s' },
  { top: '28%', left: '46%', size: 9, color: '#7DD3FC', delay: '1.6s' },
  { top: '42%', left: '90%', size: 13, color: '#FF9A76', delay: '0.4s' },
  { top: '55%', left: '6%', size: 10, color: '#4ADE80', delay: '1.2s' },
  { top: '68%', left: '70%', size: 12, color: '#FFC26B', delay: '2s' },
  { top: '80%', left: '20%', size: 9, color: '#C9B6FF', delay: '0.6s' },
  { top: '92%', left: '58%', size: 11, color: '#7DD3FC', delay: '1.4s' },
];

/** 배경 전체에 은은하게 반짝이는 별 장식 — 장식용, 인터랙션 없음 */
export function BackgroundSparkles() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {SPARKLES.map((s, i) => (
        <svg
          key={i}
          className="sparkle-icon absolute opacity-60"
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
