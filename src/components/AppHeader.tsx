import { useState } from 'react';
import { HelpModal } from './HelpModal';

interface AppHeaderProps {
  onLogoClick?: () => void;
}

export function AppHeader({ onLogoClick }: AppHeaderProps) {
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

        {/* 헤더 전체 폭 기준 정중앙에 절대 위치시켜서, 로고/도움말 버튼 폭에 상관없이
            진짜 가운데(정중앙)에 오도록 합니다. */}
        <p className="font-brand absolute left-1/2 hidden -translate-x-1/2 text-base text-teal sm:block lg:text-lg">
          오늘 먹은 간식, 오늘의 운동으로 가볍게
        </p>

        <button
          type="button"
          onClick={() => setShowHelp(true)}
          aria-label="이 화면 설명 보기"
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-navy/15 text-[11px] font-bold text-navy-soft transition-colors hover:bg-navy/5 lg:h-8 lg:w-8 lg:text-sm"
        >
          ?
        </button>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
