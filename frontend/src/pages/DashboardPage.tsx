import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { checkInsApi, CheckIn } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

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
            <Button onClick={handleLogout} variant="secondary" size="small">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Action Bar */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Your Check-ins</h2>
            <Button onClick={() => navigate('/checkin')} variant="primary" size="small">
              + New Check-in
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading check-ins...</p>
            </div>
          )}

          {/* Error State */}
          {error && <Alert type="error">{error}</Alert>}

          {/* Empty State */}
          {!isLoading && !error && checkIns.length === 0 && (
            <Card variant="default" className="p-12 text-center">
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
              <Button
                onClick={() => navigate('/checkin')}
                variant="primary"
                size="small"
                className="mt-6"
              >
                Create your first check-in
              </Button>
            </Card>
          )}

          {/* Check-ins List */}
          {!isLoading && !error && checkIns.length > 0 && (
            <div className="space-y-4">
              {checkIns.map((checkIn) => (
                <Card key={checkIn._id} variant="default">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(checkIn.timestamp)}
                    </span>
                    {checkIn.flaggedForDoctor && (
                      <Badge variant="warning">Flagged for Doctor</Badge>
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
                              <Badge key={symptom} variant="primary">
                                {symptom}: {value}
                              </Badge>
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
                            <Badge key={activity} variant="success">
                              {activity}
                            </Badge>
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
                            <Badge key={trigger} variant="error">
                              {trigger}
                            </Badge>
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
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
