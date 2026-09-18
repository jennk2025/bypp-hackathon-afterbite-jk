import { useState } from 'react';
import { HelpModal } from './HelpModal';

interface AppHeaderProps {
  onLogoClick?: () => void;
  onSnacksClick?: () => void;
  onWorkoutsClick?: () => void;
}

export function AppHeader({ onLogoClick, onSnacksClick, onWorkoutsClick }: AppHeaderProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="fixed inset-x-0 top-0 z-30 border-b border-navy/10 bg-header/92 shadow-[0_8px_24px_rgba(74,55,40,0.08)] backdrop-blur-md">
      <div className="relative flex h-14 w-full items-center gap-2 px-5 lg:h-16 lg:px-10 xl:px-14 2xl:px-20">
        <button
          type="button"
          onClick={onLogoClick}
          disabled={!onLogoClick}
          aria-label="처음 화면으로 돌아가기"
          className="flex shrink-0 items-center gap-2 rounded-full transition-transform active:scale-95 disabled:active:scale-100"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-aqua text-xs font-black text-ivory shadow-sm lg:h-8 lg:w-8 lg:text-sm">
            A
          </span>
          <span className="font-brand hidden text-base tracking-[0.02em] text-[#B24A2C] sm:inline lg:text-lg">
            AFTERBITE
          </span>
        </button>

        <nav className="flex flex-1 items-center justify-center gap-1.5 overflow-x-auto sm:gap-2">
          <button
            type="button"
            onClick={onSnacksClick}
            disabled={!onSnacksClick}
            className="flex shrink-0 items-center gap-1 rounded-full border border-navy/10 bg-ivory-card/80 px-2.5 py-1.5 text-[11px] font-semibold text-navy-soft transition-colors hover:border-teal/40 hover:text-teal disabled:pointer-events-none disabled:opacity-40 lg:px-3.5 lg:py-2 lg:text-xs"
          >
            <span aria-hidden="true">🍪</span>
            <span>오늘 먹은 간식</span>
          </button>
          <button
            type="button"
            onClick={onWorkoutsClick}
            disabled={!onWorkoutsClick}
            className="flex shrink-0 items-center gap-1 rounded-full border border-navy/10 bg-ivory-card/80 px-2.5 py-1.5 text-[11px] font-semibold text-navy-soft transition-colors hover:border-teal/40 hover:text-teal disabled:pointer-events-none disabled:opacity-40 lg:px-3.5 lg:py-2 lg:text-xs"
          >
            <span aria-hidden="true">🏃</span>
            <span>오늘의 운동</span>
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setShowHelp(true)}
          aria-label="이 화면 설명 보기"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-navy/15 text-[11px] font-bold text-navy-soft transition-colors hover:bg-navy/5 lg:h-8 lg:w-8 lg:text-sm"
        >
          ?
        </button>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
