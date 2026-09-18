import { useEffect, useMemo, useRef, useState } from 'react';
import { SNACK_DB } from '../data/snackDatabase';
import { analyzeSnackPhoto } from '../lib/snackVision';
import type { Snack, SnackSource } from '../types';

export interface SnackFormInput {
  name: string;
  caloriesPerServing: number;
  servingSizeLabel: string;
  portionMultiplier: number;
  portionLabel: string;
  source: SnackSource;
}

interface AddSnackModalProps {
  mode: 'add' | 'edit';
  initialSnack?: Snack;
  onClose: () => void;
  onSave: (input: SnackFormInput) => void;
}

type Step = 'choose' | 'photo' | 'form';

const PORTION_PRESETS = [
  { label: '반 봉지', multiplier: 0.5 },
  { label: '한 봉지', multiplier: 1 },
  { label: '두 봉지', multiplier: 2 },
];

export function AddSnackModal({ mode, initialSnack, onClose, onSave }: AddSnackModalProps) {
  const [step, setStep] = useState<Step>(mode === 'edit' ? 'form' : 'choose');
  const [source, setSource] = useState<SnackSource>(initialSnack?.source ?? 'manual');

  const [name, setName] = useState(initialSnack?.name ?? '');
  const [calories, setCalories] = useState<string>(
    initialSnack ? String(initialSnack.caloriesPerServing) : ''
  );
  const [servingSizeLabel, setServingSizeLabel] = useState(initialSnack?.servingSizeLabel ?? '');
  const [multiplier, setMultiplier] = useState<number>(initialSnack?.portionMultiplier ?? 1);
  const [customMultiplier, setCustomMultiplier] = useState<string>('');
  const [useCustomMultiplier, setUseCustomMultiplier] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrNote, setOcrNote] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const suggestions = useMemo(() => {
    if (!name.trim() || source === 'photo') return [];
    const q = name.trim().toLowerCase();
    return SNACK_DB.filter((entry) => entry.name.toLowerCase().includes(q)).slice(0, 5);
  }, [name, source]);

  const effectiveMultiplier = useCustomMultiplier
    ? Math.max(0.1, parseFloat(customMultiplier) || 0)
    : multiplier;

  const totalCalories = (parseFloat(calories) || 0) * effectiveMultiplier;

  function handleFileSelected(file: File) {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep('photo');
    setOcrNote(null);

    analyzeSnackPhoto(file).then((result) => {
      URL.revokeObjectURL(url);
      setPreviewUrl(null);

      if (result.success) {
        setName(result.nameGuess);
        if (result.caloriesGuess != null) setCalories(String(result.caloriesGuess));
        setServingSizeLabel(result.servingSizeGuess);
        setSource('photo');
      }
      setOcrNote(result.note);
      setStep('form');
    });
  }

  function handleSubmit() {
    if (!name.trim() || totalCalories <= 0) return;
    const portionLabel = useCustomMultiplier
      ? `${effectiveMultiplier}배`
      : PORTION_PRESETS.find((p) => p.multiplier === multiplier)?.label ?? '1봉지';

    onSave({
      name: name.trim(),
      caloriesPerServing: parseFloat(calories) || 0,
      servingSizeLabel: servingSizeLabel.trim() || '1회 제공량',
      portionMultiplier: effectiveMultiplier,
      portionLabel,
      source,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-navy/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-ivory shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
          <h2 className="text-base font-bold text-charcoal">
            {mode === 'edit' ? '간식 수정' : '간식 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1.5 text-navy-soft hover:bg-navy/5"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 'choose' && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-4 text-left shadow-sm transition-transform active:scale-[0.98]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lavender-soft text-lg">
                  📷
                </span>
                <span>
                  <span className="block text-sm font-semibold text-charcoal">사진으로 인식하기</span>
                  <span className="block text-xs text-navy-soft">
                    포장지·영양정보 사진을 올리면 자동으로 채워줘요
                  </span>
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setSource('manual');
                  setStep('form');
                }}
                className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-4 text-left shadow-sm transition-transform active:scale-[0.98]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/15 text-lg">
                  ✍️
                </span>
                <span>
                  <span className="block text-sm font-semibold text-charcoal">직접 입력하기</span>
                  <span className="block text-xs text-navy-soft">
                    제품명을 입력하면 참고 정보를 제안해줘요
                  </span>
                </span>
              </button>
            </div>
          )}

          {step === 'photo' && (
            <div className="flex flex-col items-center gap-4 py-6">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="분석 중인 미리보기"
                  className="h-40 w-40 rounded-2xl object-cover shadow-sm"
                />
              )}
              <div className="flex items-center gap-2 text-sm text-navy-soft">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
                사진 속 글자를 읽는 중...
              </div>
              <p className="text-center text-[11px] text-navy-soft/70">
                분석이 끝나면 사진은 바로 삭제되고, 결과만 남아요.
              </p>
            </div>
          )}

          {step === 'form' && (
            <div className="flex flex-col gap-4">
              {ocrNote && (
                <p className="rounded-xl bg-lavender-soft px-3 py-2.5 text-xs leading-relaxed text-navy">
                  {ocrNote}
                </p>
              )}

              <div className="relative">
                <label className="mb-1.5 block text-xs font-semibold text-navy-soft">제품명</label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  placeholder="예: 새우깡"
                  className="w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-charcoal outline-none focus:border-teal"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-navy/10 bg-white shadow-lg">
                    {suggestions.map((entry) => (
                      <li key={entry.name}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setName(entry.name);
                            setCalories(String(entry.caloriesPerServing));
                            setServingSizeLabel(entry.servingSizeLabel);
                            setSource('search');
                            setShowSuggestions(false);
                          }}
                          className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-ivory"
                        >
                          <span className="text-charcoal">{entry.name}</span>
                          <span className="text-xs text-navy-soft">
                            {entry.caloriesPerServing}kcal · {entry.servingSizeLabel}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-navy-soft">
                    1회 제공량 칼로리
                  </label>
                  <input
                    value={calories}
                    onChange={(e) => setCalories(e.target.value.replace(/[^0-9.]/g, ''))}
                    inputMode="decimal"
                    placeholder="예: 458"
                    className="w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-charcoal outline-none focus:border-teal"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-navy-soft">1회 제공량</label>
                  <input
                    value={servingSizeLabel}
                    onChange={(e) => setServingSizeLabel(e.target.value)}
                    placeholder="예: 1봉지(90g)"
                    className="w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-charcoal outline-none focus:border-teal"
                  />
                </div>
              </div>

              <p className="text-[11px] text-navy-soft/70">
                인식·검색된 정보는 틀릴 수 있어요. 실제 포장지 정보와 다르면 위 값을 직접 고쳐주세요.
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-navy-soft">먹은 양</label>
                <div className="flex flex-wrap gap-2">
                  {PORTION_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setMultiplier(preset.multiplier);
                        setUseCustomMultiplier(false);
                      }}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        !useCustomMultiplier && multiplier === preset.multiplier
                          ? 'border-teal bg-teal/15 text-teal'
                          : 'border-navy/15 bg-white text-navy-soft'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUseCustomMultiplier(true)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      useCustomMultiplier ? 'border-teal bg-teal/15 text-teal' : 'border-navy/15 bg-white text-navy-soft'
                    }`}
                  >
                    직접 입력
                  </button>
                </div>
                {useCustomMultiplier && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={customMultiplier}
                      onChange={(e) => setCustomMultiplier(e.target.value.replace(/[^0-9.]/g, ''))}
                      inputMode="decimal"
                      placeholder="예: 1.5"
                      className="w-28 rounded-xl border border-navy/15 bg-white px-3.5 py-2 text-sm outline-none focus:border-teal"
                    />
                    <span className="text-sm text-navy-soft">배</span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white px-4 py-3.5 shadow-sm">
                <p className="text-xs text-navy-soft">총 섭취 칼로리</p>
                <p className="text-2xl font-bold text-charcoal">
                  {Math.round(totalCalories)} <span className="text-sm font-semibold text-navy-soft">kcal</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {step === 'form' && (
          <div className="border-t border-navy/10 px-5 py-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim() || totalCalories <= 0}
              className="w-full rounded-2xl bg-charcoal py-3.5 text-sm font-semibold text-ivory transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              {mode === 'edit' ? '수정 완료' : '트레이에 추가'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
