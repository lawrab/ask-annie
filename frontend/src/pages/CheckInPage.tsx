import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { checkInsApi } from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';
import ManualCheckInForm from '../components/ManualCheckInForm';

type CheckInMode = 'voice' | 'manual';

interface StructuredCheckInData {
  symptoms: { [key: string]: number };
  activities: string[];
  triggers: string[];
  notes: string;
}

export default function CheckInPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [mode, setMode] = useState<CheckInMode>('voice');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleVoiceRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
  };

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
        const symptoms = Object.entries(response.data.checkIn.structured.symptoms)
          .map(([name, value]) => `${name}: ${value}`)
          .join(', ');

        setSuccess(
          `Check-in saved! ${symptoms ? `Detected: ${symptoms}` : 'No symptoms detected.'}`
        );

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
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
        const symptoms = Object.entries(response.data.checkIn.structured.symptoms)
          .map(([name, value]) => `${name}: ${value}`)
          .join(', ');

        setSuccess(
          `Check-in saved! ${symptoms ? `Recorded: ${symptoms}` : 'Check-in recorded.'}`
        );

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Ask Annie</h1>
              <p className="text-indigo-100">Hi, {user?.username}!</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 rounded-md text-sm font-medium transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create Check-in
          </h2>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setMode('voice')}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
                mode === 'voice'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Voice Recording
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
                mode === 'manual'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Manual Entry
            </button>
          </div>

          {/* Voice Mode */}
          {mode === 'voice' && (
            <>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecordingComplete}
                onError={handleVoiceError}
              />
              {audioBlob && (
                <div className="mt-4">
                  <button
                    onClick={handleVoiceSubmit}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Check-In'}
                  </button>
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
    </div>
  );
}
