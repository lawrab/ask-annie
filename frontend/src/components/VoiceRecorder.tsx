import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

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

  return (
    <div className="space-y-4">
      {permissionDenied && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          Microphone access denied. Please enable microphone permissions in your
          browser settings.
        </div>
      )}

      {/* Recording Controls */}
      {!audioURL && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-gray-900">
                  {isPaused ? 'Paused' : 'Recording'}
                </span>
              </div>
            )}

            {/* Timer */}
            <div className="text-4xl font-mono text-gray-900">
              {formatTime(recordingTime)}
            </div>

            {/* Control buttons */}
            <div className="flex space-x-3">
              {!isRecording && (
                <button
                  onClick={startRecording}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
                >
                  Start Recording
                </button>
              )}

              {isRecording && !isPaused && (
                <>
                  <button
                    onClick={pauseRecording}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md font-medium transition-colors"
                  >
                    Pause
                  </button>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
                  >
                    Stop
                  </button>
                </>
              )}

              {isRecording && isPaused && (
                <>
                  <button
                    onClick={resumeRecording}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                  >
                    Resume
                  </button>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
                  >
                    Stop
                  </button>
                </>
              )}
            </div>

            {/* Instructions */}
            {!isRecording && (
              <p className="text-sm text-gray-600 text-center max-w-md">
                Click &quot;Start Recording&quot; to record your check-in. Describe
                your symptoms, how you&apos;re feeling, and any activities or
                triggers.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {audioURL && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recording Preview
          </h3>
          <audio controls src={audioURL} className="w-full mb-4" />
          <div className="flex justify-center space-x-3">
            <button
              onClick={resetRecording}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Record Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default VoiceRecorder;
