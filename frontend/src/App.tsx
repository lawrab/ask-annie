import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-50">
              <header className="bg-primary-600 text-white shadow-md">
                <div className="container mx-auto px-4 py-6">
                  <h1 className="text-3xl font-bold">Ask Annie 🐰</h1>
                  <p className="text-primary-100">Your daily health companion</p>
                </div>
              </header>

              <main className="container mx-auto px-4 py-8">
                <div className="rounded-lg bg-white p-8 shadow-md">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-800">
                    Welcome to Ask Annie
                  </h2>
                  <p className="text-gray-600">
                    Track symptoms, spot patterns, empower your health.
                  </p>
                </div>
              </main>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
