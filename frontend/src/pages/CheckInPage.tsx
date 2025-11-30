import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { checkInsApi, InsightCard } from '../services/api';
import VoiceRecorder, { VoiceRecorderHandle } from '../components/VoiceRecorder';
import ManualCheckInForm from '../components/ManualCheckInForm';
import CheckInGuidance from '../components/CheckInGuidance';
import { Header } from '../components/Header';
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
    // Trigger recording via ref (with small delay to ensure component is mounted)
    setTimeout(() => {
      voiceRecorderRef.current?.startRecording();
    }, 100);
  }, []);

  const handleStartManualFromGuidance = useCallback(() => {
    setMode('manual');
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
      <Header currentPage="checkin" subtitle="Create Check-in" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Error Message */}
          {error && <Alert type="error" className="mb-6">{error}</Alert>}

          {/* Pre-Check-In Guidance with Action Buttons */}
          <CheckInGuidance
            className="mb-6"
            onStartRecording={handleStartRecordingFromGuidance}
            onStartManual={handleStartManualFromGuidance}
            isRecording={isRecording}
          />

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
