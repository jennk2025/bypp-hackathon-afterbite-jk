import { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  // 카메라 접근 자체가 안 될 때(권한 거부·미지원) "폰 카메라로 촬영" 버튼을 눌러
  // 네이티브 capture="environment" 파일 입력으로 넘어가고 싶을 때 호출됩니다.
  // 버튼 클릭이라는 실제 사용자 제스처 안에서 호출돼야 브라우저가 파일 선택창을
  // 막지 않으므로, getUserMedia 실패 시 자동으로 부르지 않고 에러 화면의 버튼을
  // 사용자가 직접 눌러야 호출되게 해뒀습니다.
  onUnavailable: () => void;
}

type FacingMode = 'environment' | 'user';

/**
 * 노트북 웹캠·아이패드 카메라처럼 capture="environment" 힌트가 안 먹히는 기기에서
 * 쓰는 실시간 촬영 화면입니다. 폰에서는 네이티브 카메라 앱이 화질이 더 좋아서
 * AddSnackModal이 이 컴포넌트 대신 파일 입력을 바로 열지만, 이 컴포넌트도 실패하면
 * 아래 에러 화면에서 같은 파일 입력으로 넘어갈 수 있습니다.
 */
export function CameraCapture({ onCapture, onCancel, onUnavailable }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('이 브라우저에서는 카메라를 사용할 수 없어요.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch {
        if (!cancelled) setError('카메라 권한이 없거나 카메라를 찾을 수 없어요.');
      }
    }

    // 카메라를 전환할 때 이전 스트림을 먼저 꺼줘야 두 카메라가 동시에 켜진 채로
    // 남지 않습니다.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode]);

  function handleShutter() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], 'snack-photo.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-3">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-black shadow-md">
        {!error && <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />}

        {ready && !error && (
          <>
            <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/60">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-white">
                제품명 또는 영양정보 표를 맞춰주세요
              </span>
            </div>
            {/* 반대쪽(전면) 카메라로 전환 — 노트북 웹캠은 원래 나를 향해 있어서
                environment가 안 잡힐 때, 또는 그냥 반대편에서 찍고 싶을 때 씁니다. */}
            <button
              type="button"
              onClick={() => {
                setReady(false);
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
              }}
              aria-label="카메라 방향 전환"
              className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-sm text-white backdrop-blur-sm active:scale-90"
            >
              🔄
            </button>
          </>
        )}

        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
            카메라를 켜는 중...
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-xs text-white/80">
            <p className="mb-3">{error}</p>
            <button
              type="button"
              onClick={onUnavailable}
              className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold text-white"
            >
              폰 카메라로 촬영
            </button>
          </div>
        )}
      </div>

      {!error && (
        <button
          type="button"
          onClick={handleShutter}
          disabled={!ready}
          aria-label="촬영하기"
          className="btn-primary flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white shadow-lg transition-transform active:scale-95 disabled:opacity-40"
        >
          📸
        </button>
      )}

      <button type="button" onClick={onCancel} className="text-xs font-medium text-navy-soft">
        취소
      </button>
    </div>
  );
}
