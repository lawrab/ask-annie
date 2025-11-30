import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { checkInsApi, InsightCard } from '../services/api';
import VoiceRecorder, { VoiceRecorderHandle } from '../components/VoiceRecorder';
import ManualCheckInForm from '../components/ManualCheckInForm';
import CheckInGuidance from '../components/CheckInGuidance';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import PostCheckInInsight from '../components/PostCheckInInsight';

type CheckInMode = 'voice' | 'manual';

import { SymptomValue } from '../services/api';

interface StructuredCheckInData {
  symptoms: { [key: string]: SymptomValue };
  activities: string[];
  triggers: string[];
  notes: string;
}

// NOTE: Voice-related code in this component has lower test coverage due to Web Audio API
// mocking complexity in jsdom. Manual check-in flow is fully tested. See skipped tests in
// CheckInPage.test.tsx for voice-related tests that are skipped.
export default function CheckInPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [mode, setMode] = useState<CheckInMode>('voice');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [insight, setInsight] = useState<InsightCard | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const voiceRecorderRef = useRef<VoiceRecorderHandle>(null);

  const handleVoiceRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
  };

  const handleRecordingStateChange = useCallback((recording: boolean) => {
    setIsRecording(recording);
  }, []);

  const handleStartRecordingFromGuidance = useCallback(() => {
    // Switch to voice mode if not already
    setMode('voice');
    // Trigger recording via ref
    voiceRecorderRef.current?.startRecording();
  }, []);

  const handleVoiceSubmit = async () => {
    if (!audioBlob) {
      setError('No recording available. Please record your check-in first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const audioFile = new File([audioBlob], 'checkin.webm', {
        type: 'audio/webm',
      });

      const response = await checkInsApi.createVoice(audioFile);

      if (response.success) {
        // Show insight modal
        setInsight(response.data.insight);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit check-in'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (data: StructuredCheckInData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await checkInsApi.createManual({ structured: data });

      if (response.success) {
        // Show insight modal
        setInsight(response.data.insight);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit check-in'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleInsightDismiss = () => {
    setInsight(null);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex justify-between items-center gap-4">
            <div className="min-w-0 flex-shrink">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Annie&apos;s Health Journal</h1>
              <p className="text-indigo-100 text-sm sm:text-base truncate">Hi, {user?.username}!</p>
            </div>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="secondary"
              size="small"
              className="whitespace-nowrap flex-shrink-0"
            >
              <span className="hidden sm:inline">← Back to Dashboard</span>
              <span className="sm:hidden">←</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create Check-in
          </h2>

          {/* Error Message */}
          {error && <Alert type="error" className="mb-6">{error}</Alert>}

          {/* Pre-Check-In Guidance */}
          <CheckInGuidance
            className="mb-6"
            onStartRecording={handleStartRecordingFromGuidance}
            isRecording={isRecording}
          />

          {/* Mode Toggle */}
          <div className="flex space-x-2 mb-6">
            <Button
              onClick={() => setMode('voice')}
              variant={mode === 'voice' ? 'primary' : 'secondary'}
              size="medium"
              fullWidth
            >
              Voice Recording
            </Button>
            <Button
              onClick={() => setMode('manual')}
              variant={mode === 'manual' ? 'primary' : 'secondary'}
              size="medium"
              fullWidth
            >
              Manual Entry
            </Button>
          </div>

          {/* Voice Mode */}
          {mode === 'voice' && (
            <>
              <VoiceRecorder
                ref={voiceRecorderRef}
                onRecordingComplete={handleVoiceRecordingComplete}
                onError={handleVoiceError}
                onRecordingStateChange={handleRecordingStateChange}
              />
              {audioBlob && (
                <div className="mt-4">
                  <Button
                    onClick={handleVoiceSubmit}
                    variant="primary"
                    size="medium"
                    fullWidth
                    loading={isSubmitting}
                  >
                    Submit Check-In
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <ManualCheckInForm onSubmit={handleManualSubmit} />
          )}

          {/* Loading Overlay */}
          {isSubmitting && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-900 font-medium">Submitting check-in...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Post Check-In Insight Modal */}
      {insight && (
        <PostCheckInInsight insight={insight} onDismiss={handleInsightDismiss} />
      )}
    </div>
  );
}
