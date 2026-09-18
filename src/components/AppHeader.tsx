import { useState } from 'react';

interface AppHeaderProps {
  onLogoClick?: () => void;
}

export function AppHeader({ onLogoClick }: AppHeaderProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="fixed inset-x-0 top-0 z-30 border-b border-navy/10 bg-header/92 shadow-[0_8px_24px_rgba(74,55,40,0.08)] backdrop-blur-md">
      <div className="relative mx-auto flex h-14 w-full max-w-md items-center justify-between px-5 sm:max-w-xl lg:max-w-2xl">
        <button
          type="button"
          onClick={onLogoClick}
          disabled={!onLogoClick}
          aria-label="처음 화면으로 돌아가기"
          className="flex items-center gap-2 rounded-full transition-transform active:scale-95 disabled:active:scale-100"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-aqua text-xs font-black text-ivory shadow-sm">
            A
          </span>
          <span className="font-brand text-base tracking-[0.02em] text-[#B24A2C]">AFTERBITE</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHelp(true)}
          aria-label="이 화면 설명 보기"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-navy/15 text-[11px] font-bold text-navy-soft transition-colors hover:bg-navy/5"
        >
          ?
        </button>
      </div>

      {showHelp && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-ivory-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-sm font-bold text-charcoal">이게 다 무슨 뜻이에요?</p>
            <p className="text-xs leading-relaxed text-navy-soft">
              캐릭터 안의 물결과 퍼센트는 음식이나 체지방이 실제로 사라진다는 뜻이 아니에요.
              오늘 기록한 간식 에너지에서 완료한 움직임을 뺀 만큼을 참고용으로 보여주는
              표시예요. 많이 채워질수록 아직 못 움직인 만큼이 쌓였다는 뜻이고, 0%면 완전히
              다 움직여서 비운 상태예요.
              <br />
              <br />
              아래 균형 막대의 초록·주황·빨강 구간과 정확한 kcal 기준도 함께 확인할 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="btn-primary mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
            >
              알겠어요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
