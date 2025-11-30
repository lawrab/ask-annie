import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onError?: (error: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export interface VoiceRecorderHandle {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
}

// NOTE: This component has lower test coverage due to Web Audio API (MediaRecorder/getUserMedia)
// being extremely difficult to mock properly in jsdom. The implementation is functional and
// tested manually. See skipped tests in VoiceRecorder.test.tsx for details.
const VoiceRecorder = forwardRef<VoiceRecorderHandle, VoiceRecorderProps>(function VoiceRecorder(
  { onRecordingComplete, onError, onRecordingStateChange },
  ref
) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop MediaRecorder without triggering onstop handler
      // (prevents setState on unmounted component and unwanted onRecordingComplete callback)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = null; // Clear handler before stopping
        mediaRecorderRef.current.ondataavailable = null; // Clear data handler too
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      // Stop all media tracks
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks?.(); // Defensive optional chaining
        tracks?.forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Revoke object URL when audioURL changes or on unmount
  useEffect(() => {
    return () => {
      if (audioURL && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    startRecording: () => startRecording(),
    stopRecording: () => stopRecording(),
    isRecording,
  }));

  const startRecording = async () => {
    // Reset any previous recording state
    setAudioURL(null);
    setRecordingTime(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detect supported MIME type (iOS Safari needs audio/mp4)
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];

      let supportedMimeType = 'audio/webm'; // default fallback
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          supportedMimeType = mimeType;
          break;
        }
      }
      mimeTypeRef.current = supportedMimeType;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current,
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onRecordingComplete(audioBlob);

        // Stop all tracks
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks?.();
          tracks?.forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setPermissionDenied(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to access microphone';
      setPermissionDenied(true);
      onError?.(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const resetRecording = () => {
    setAudioURL(null);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording control buttons component - reused in both inline and sticky
  const RecordingControls = ({ className = '' }: { className?: string }) => (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Left: Timer and status */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-2xl font-mono text-gray-900">
          {formatTime(recordingTime)}
        </span>
        <span className="text-sm text-gray-500">
          {isPaused ? 'Paused' : 'Recording'}
        </span>
      </div>

      {/* Right: Control buttons */}
      <div className="flex gap-2">
        {!isPaused ? (
          <>
            <button
              onClick={pauseRecording}
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Pause
            </button>
            <button
              onClick={stopRecording}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Stop
            </button>
          </>
        ) : (
          <>
            <button
              onClick={resumeRecording}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Resume
            </button>
            <button
              onClick={stopRecording}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {permissionDenied && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          Microphone access denied. Please enable microphone permissions in your
          browser settings.
        </div>
      )}

      {/* Inline Recording Controls - hidden on mobile when recording */}
      {!audioURL && isRecording && (
        <div className="hidden sm:block bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <RecordingControls />
        </div>
      )}

      {/* Sticky Bottom Recording Controls - mobile only via portal */}
      {!audioURL && isRecording && createPortal(
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40">
          <RecordingControls />
        </div>,
        document.body
      )}

      {/* Audio Preview */}
      {audioURL && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Preview:</span>
            <audio controls src={audioURL} className="flex-1 h-10" />
            <button
              onClick={resetRecording}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              Re-record
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default VoiceRecorder;
