import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { checkInsApi, CheckIn } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await checkInsApi.getAll();

        if (response.success) {
          setCheckIns(response.data.checkIns);
        }
      } catch {
        setError('Failed to load check-ins. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckIns();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Ask Annie</h1>
              <p className="text-indigo-100">Welcome, {user?.username}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Action Bar */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Your Check-ins</h2>
            <button
              onClick={() => navigate('/checkin')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              + New Check-in
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading check-ins...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && checkIns.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No check-ins yet</h3>
              <p className="mt-1 text-gray-500">
                Get started by recording your first check-in.
              </p>
              <button
                onClick={() => navigate('/checkin')}
                className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Create your first check-in
              </button>
            </div>
          )}

          {/* Check-ins List */}
          {!isLoading && !error && checkIns.length > 0 && (
            <div className="space-y-4">
              {checkIns.map((checkIn) => (
                <div
                  key={checkIn._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(checkIn.timestamp)}
                    </span>
                    {checkIn.flaggedForDoctor && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Flagged for Doctor
                      </span>
                    )}
                  </div>

                  {checkIn.rawTranscript && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 italic">
                        &ldquo;{checkIn.rawTranscript}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {/* Symptoms */}
                    {Object.keys(checkIn.structured.symptoms).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Symptoms:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(checkIn.structured.symptoms).map(
                            ([symptom, value]) => (
                              <span
                                key={symptom}
                                className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                              >
                                {symptom}: {value}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {checkIn.structured.activities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Activities:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {checkIn.structured.activities.map((activity) => (
                            <span
                              key={activity}
                              className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                            >
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Triggers */}
                    {checkIn.structured.triggers.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Triggers:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {checkIn.structured.triggers.map((trigger) => (
                            <span
                              key={trigger}
                              className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                            >
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {checkIn.structured.notes && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Notes:
                        </h4>
                        <p className="text-sm text-gray-600">
                          {checkIn.structured.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
