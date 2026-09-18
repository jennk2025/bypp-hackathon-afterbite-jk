import { useState } from 'react';
import type { Intensity, MoveConditions, Place } from '../types';

interface MoveConditionFormProps {
  totalCalories: number;
  snackCount: number;
  onBack: () => void;
  onSubmit: (cond: MoveConditions) => void;
}

const MINUTE_OPTIONS = [5, 10, 15, 20];
const PLACE_OPTIONS: { value: Place; label: string }[] = [
  { value: 'narrow_indoor', label: '좁은 실내' },
  { value: 'living_room', label: '집 거실' },
  { value: 'outdoor', label: '야외' },
];
const INTENSITY_OPTIONS: { value: Intensity; label: string }[] = [
  { value: 'low', label: '낮음' },
  { value: 'mid', label: '보통' },
  { value: 'high', label: '높음' },
];

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-navy-soft">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              value === opt.value
                ? 'border-teal bg-teal/15 text-teal'
                : 'border-navy/15 bg-ivory-card text-navy-soft'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MoveConditionForm({ totalCalories, snackCount, onBack, onSubmit }: MoveConditionFormProps) {
  const [minutes, setMinutes] = useState(10);
  const [useCustomMinutes, setUseCustomMinutes] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [place, setPlace] = useState<Place>('living_room');
  const [intensity, setIntensity] = useState<Intensity>('mid');
  const [noiseOk, setNoiseOk] = useState(true);
  const [jumpOk, setJumpOk] = useState(true);

  const effectiveMinutes = useCustomMinutes ? Math.max(1, parseInt(customMinutes, 10) || 0) : minutes;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-28 pt-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="rounded-full p-2 text-navy-soft hover:bg-navy/5"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
            <path d="M12.5 4.5L6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-charcoal">지금 상황에 맞는 움직임 찾기</h2>
      </div>

      <div className="mb-6 rounded-2xl bg-ivory-card px-4 py-3.5 shadow-sm">
        <p className="text-xs text-navy-soft">선택한 간식 {snackCount}개 · 총합</p>
        <p className="text-2xl font-bold text-charcoal">
          {Math.round(totalCalories)} <span className="text-sm font-semibold text-navy-soft">kcal</span>
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-xs font-semibold text-navy-soft">운동 가능 시간</p>
          <div className="flex flex-wrap gap-2">
            {MINUTE_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMinutes(m);
                  setUseCustomMinutes(false);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  !useCustomMinutes && minutes === m
                    ? 'border-teal bg-teal/15 text-teal'
                    : 'border-navy/15 bg-ivory-card text-navy-soft'
                }`}
              >
                {m}분{m === 20 ? '+' : ''}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustomMinutes(true)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                useCustomMinutes ? 'border-teal bg-teal/15 text-teal' : 'border-navy/15 bg-ivory-card text-navy-soft'
              }`}
            >
              직접 입력
            </button>
          </div>
          {useCustomMinutes && (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="예: 3"
                className="w-24 rounded-xl border border-navy/15 bg-ivory-card px-3.5 py-2 text-sm outline-none focus:border-teal"
              />
              <span className="text-sm text-navy-soft">분</span>
            </div>
          )}
        </div>

        <OptionGroup label="장소" options={PLACE_OPTIONS} value={place} onChange={setPlace} />
        <OptionGroup label="강도" options={INTENSITY_OPTIONS} value={intensity} onChange={setIntensity} />

        <div>
          <p className="mb-2 text-xs font-semibold text-navy-soft">소음을 내도 괜찮나요?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNoiseOk(true)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                noiseOk ? 'border-teal bg-teal/15 text-teal' : 'border-navy/15 bg-ivory-card text-navy-soft'
              }`}
            >
              괜찮아요
            </button>
            <button
              type="button"
              onClick={() => setNoiseOk(false)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                !noiseOk ? 'border-teal bg-teal/15 text-teal' : 'border-navy/15 bg-ivory-card text-navy-soft'
              }`}
            >
              조용해야 해요
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-navy-soft">점프해도 괜찮나요?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setJumpOk(true)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                jumpOk ? 'border-teal bg-teal/15 text-teal' : 'border-navy/15 bg-ivory-card text-navy-soft'
              }`}
            >
              괜찮아요
            </button>
            <button
              type="button"
              onClick={() => setJumpOk(false)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                !jumpOk ? 'border-teal bg-teal/15 text-teal' : 'border-navy/15 bg-ivory-card text-navy-soft'
              }`}
            >
              어려워요
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-3">
        <button
          type="button"
          onClick={() => onSubmit({ minutes: effectiveMinutes, place, intensity, noiseOk, jumpOk })}
          disabled={useCustomMinutes && effectiveMinutes < 1}
          className="btn-primary w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          루틴 추천받기
        </button>
      </div>
    </div>
  );
}
