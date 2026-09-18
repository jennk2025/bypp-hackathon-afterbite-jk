import type { ReactNode } from 'react';
import { REFERENCE_MAX_KCAL, STAGE_KCAL_RANGE } from '../lib/energyStage';

interface HelpModalProps {
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold text-charcoal">{title}</p>
      <p className="text-xs leading-relaxed text-navy-soft">{children}</p>
    </div>
  );
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-ivory shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
          <h2 className="text-base font-bold text-charcoal">이 화면 설명</h2>
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

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <Section title="🌊 캐릭터 안의 물결이 뜻하는 것">
            음식이나 체지방이 실제로 사라진다는 뜻이 아니에요. 오늘 기록한 간식 에너지에서
            완료한 움직임을 뺀 만큼을 참고용으로 보여줘요. 많이 채워질수록 아직 못 움직인
            만큼이 쌓였다는 뜻이고, 0%면 완전히 다 움직여서 비운 상태예요.
          </Section>

          <Section title="🎨 색 구간 기준">
            간식 칼로리 기준으로 3단계예요 — 🌱 가벼움 {STAGE_KCAL_RANGE.light}, ⚡ 슬슬 쌓임{' '}
            {STAGE_KCAL_RANGE.rising}, 🔥 많이 쌓임 {STAGE_KCAL_RANGE.heavy} (하루 간식{' '}
            {REFERENCE_MAX_KCAL}kcal 기준 100%).
          </Section>

          <Section title="🙂 표정 변화">
            가벼울 땐 웃으며 새싹이, 슬슬 쌓일 땐 번개가, 많이 쌓이면 땀방울이 나타나요.
          </Section>

          <Section title="🍪 간식 기록하는 법">
            홈 화면의 “+ 간식 추가” 버튼을 누르면 사진 촬영·업로드로 자동 인식하거나, 이름을
            검색하거나, 직접 칼로리를 입력할 수 있어요.
          </Section>

          <Section title="🏃 움직임 추천 받는 법">
            트레이에서 간식을 선택하고 “움직임으로 바꾸기”를 누른 뒤 시간·장소·강도를
            고르면, AI가 지금 상황에 맞는 움직임 3가지를 추천해줘요.
          </Section>
        </div>

        <div className="border-t border-navy/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full rounded-2xl py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            알겠어요
          </button>
        </div>
      </div>
    </div>
  );
}
