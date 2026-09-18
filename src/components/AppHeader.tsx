import { useState } from 'react';
import { HelpModal } from './HelpModal';

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

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
