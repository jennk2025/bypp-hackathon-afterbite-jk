import { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('이 브라우저에서는 카메라를 사용할 수 없어요. 사진 업로드를 이용해주세요.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
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
          setError('카메라 권한이 없거나 카메라를 찾을 수 없어요. 사진 업로드를 이용해주세요.');
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
      0.9
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-black">
        {!error && (
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        )}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
            카메라를 켜는 중...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-white/80">
            {error}
          </div>
        )}
      </div>

      {!error && (
        <button
          type="button"
          onClick={handleShutter}
          disabled={!ready}
          aria-label="촬영하기"
          className="btn-primary flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white transition-transform active:scale-95 disabled:opacity-40"
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
