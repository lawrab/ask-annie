import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';

export default function CheckInPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

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
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create Check-in
            </h2>
            <p className="text-gray-600 mb-6">
              This is a placeholder for the check-in page. Voice recording and manual
              form features will be implemented in Issue #11.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Voice recording with Web Audio API</li>
                <li>Manual check-in form</li>
                <li>Toggle between voice and manual modes</li>
                <li>Submit to backend API</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
