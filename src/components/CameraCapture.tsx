import { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('이 브라우저에서는 실시간 카메라를 사용할 수 없어요. 고화질 카메라 촬영을 이용해주세요.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
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
        if (!cancelled) {
          setError('카메라 권한이 없거나 카메라를 찾을 수 없어요. 아래 고화질 카메라 버튼을 이용해주세요.');
        }
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
      {/* 네이티브 카메라 파일 인풋 */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
          e.target.value = '';
        }}
      />

      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-black shadow-md">
        {!error && (
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        )}

        {/* 촬영 가이드 사각형 */}
        {ready && !error && (
          <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/60">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-white">
              제품명 또는 영양정보 표를 맞춰주세요
            </span>
          </div>
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
              onClick={() => nativeCameraInputRef.current?.click()}
              className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold text-white"
            >
              스마트폰 카메라로 촬영
            </button>
          </div>
        )}
      </div>

      {!error && (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleShutter}
            disabled={!ready}
            aria-label="촬영하기"
            className="btn-primary flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white shadow-lg transition-transform active:scale-95 disabled:opacity-40"
          >
            📸
          </button>
          <button
            type="button"
            onClick={() => nativeCameraInputRef.current?.click()}
            className="text-xs text-teal underline"
          >
            초점이 흐리다면? 스마트폰 기본 카메라로 찍기
          </button>
        </div>
      )}

      <button type="button" onClick={onCancel} className="text-xs font-medium text-navy-soft">
        취소
      </button>
    </div>
  );
}
