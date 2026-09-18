export function AppHeader() {
  return (
    <div className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-header/90 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-70"
        style={{
          backgroundImage: 'linear-gradient(180deg, rgba(56, 189, 248, 0.12), transparent)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex h-14 w-full max-w-md items-center gap-2 px-5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-aqua text-xs font-black text-ivory">
          A
        </span>
        <span className="font-brand text-sm font-bold tracking-[0.1em] text-navy">
          AFTERBITE
        </span>
      </div>
    </div>
  );
}
