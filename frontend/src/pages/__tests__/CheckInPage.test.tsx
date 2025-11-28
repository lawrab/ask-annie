import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import CheckInPage from '../CheckInPage';
import { useAuthStore } from '../../stores/authStore';
import * as api from '../../services/api';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the API
vi.mock('../../services/api', () => ({
  checkInsApi: {
    createVoice: vi.fn(),
    createManual: vi.fn(),
  },
}));

// Mock react-router navigation
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock MediaRecorder
class MockMediaRecorder {
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state: string = 'inactive';

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
    }
    if (this.onstop) {
      this.onstop();
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

// TODO: Fix Web Audio API mocking in VoiceRecorder component for integration tests
describe('CheckInPage', () => {
  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    notificationTimes: ['08:00'],
    notificationsEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = {
        user: mockUser,
        token: 'mock-token',
        isLoading: false,
        isAuthenticated: () => true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        restoreSession: vi.fn(),
      };
      return selector(state);
    });

    // Mock getUserMedia
    const mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([
        {
          stop: vi.fn(),
        },
      ]),
    });

    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    // Mock MediaRecorder
    global.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render check-in page with user greeting', () => {
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Annie's Health Journal")).toBeInTheDocument();
    expect(screen.getByText('Hi, testuser!')).toBeInTheDocument();
    expect(screen.getByText('Create Check-in')).toBeInTheDocument();
  });

  it('should show voice mode by default', () => {
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );

    const voiceButton = screen.getByRole('button', { name: /voice recording/i });
    const manualButton = screen.getByRole('button', { name: /manual entry/i });

    expect(voiceButton).toHaveClass('bg-primary-600');
    expect(manualButton).not.toHaveClass('bg-primary-600');
    expect(
      screen.getByRole('button', { name: /start recording/i })
    ).toBeInTheDocument();
  });

  it.skip('should switch to manual mode', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );

    const manualButton = screen.getByRole('button', { name: /manual entry/i });
    await user.click(manualButton);

    expect(manualButton).toHaveClass('bg-indigo-600');
    expect(screen.getByLabelText(/symptoms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/activities/i)).toBeInTheDocument();
  });

  it.skip('should submit manual check-in successfully', async () => {
    const user = userEvent.setup({ delay: null });

    vi.mocked(api.checkInsApi.createManual).mockResolvedValue({
      success: true,
      data: {
        checkIn: {
          _id: '1',
          userId: '123',
          timestamp: '2024-01-01T12:00:00.000Z',
          structured: {
            symptoms: { headache: { severity: 7 } },
            activities: ['working'],
            triggers: ['stress'],
            notes: 'Test note',
          },
          flaggedForDoctor: false,
          createdAt: '2024-01-01T12:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        },
        insight: {
          type: 'validation',
          title: 'Check-in Complete',
          message: 'Your symptoms have been recorded.',
          icon: '✅',
        },
      },
    });

    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );

    // Switch to manual mode
    const manualButton = screen.getByRole('button', { name: /manual entry/i });
    await user.click(manualButton);

    // Add symptom
    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.type(symptomInput, 'headache');
    await user.click(addButton);

    // Fill activities
    const activitiesInput = screen.getByPlaceholderText(/working, exercising/i);
    await user.type(activitiesInput, 'working');

    // Fill triggers
    const triggersInput = screen.getByPlaceholderText(/stress, lack of sleep/i);
    await user.type(triggersInput, 'stress');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit check-in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.checkInsApi.createManual).toHaveBeenCalledWith({
        structured: {
          symptoms: { headache: 5 },
          activities: ['working'],
          triggers: ['stress'],
          notes: '',
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/check-in saved.*headache: 7/i)).toBeInTheDocument();
    });

    // Should redirect after 2 seconds
    vi.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it.skip('should show error when manual submission fails', async () => {
    const user = userEvent.setup({ delay: null });

    vi.mocked(api.checkInsApi.createManual).mockRejectedValue(
      new Error('Submission failed')
    );

    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );

    // Switch to manual mode
    const manualButton = screen.getByRole('button', { name: /manual entry/i });
    await user.click(manualButton);

    // Add symptom
    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.type(symptomInput, 'pain');
    await user.click(addButton);

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit check-in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });
  });

  it.skip('should submit voice check-in successfully', async () => {
    const user = userEvent.setup({ delay: null });

    vi.mocked(api.checkInsApi.createVoice).mockResolvedValue({
      success: true,
      data: {
        checkIn: {
          _id: '1',
          userId: '123',
          timestamp: '2024-01-01T12:00:00.000Z',
          rawTranscript: 'I have a headache',
          structured: {
            symptoms: { headache: { severity: 8 } },
            activities: [],
            triggers: [],
            notes: '',
          },
          flaggedForDoctor: false,
          createdAt: '2024-01-01T12:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        },
        insight: {
          type: 'validation',
          title: 'Check-in Complete',
          message: 'Your symptoms have been recorded.',
          icon: '✅',
        },
      },
    });

    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );

    // Start recording
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    // Stop recording
    const stopButton = screen.getByRole('button', { name: /stop/i });
    await user.click(stopButton);

    await waitFor(() => {
      expect(screen.getByText('Recording Preview')).toBeInTheDocument();
    });

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit check-in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.checkInsApi.createVoice).toHaveBeenCalledWith(
        expect.any(File)
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/check-in saved.*headache: 8/i)).toBeInTheDocument();
    });

    // Should redirect after 2 seconds
    vi.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it.skip('should navigate back to dashboard when clicking back button', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back to dashboard/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it.skip('should show loading overlay during submission', async () => {
    const user = userEvent.setup({ delay: null });

    vi.mocked(api.checkInsApi.createManual).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );

    // Switch to manual mode
    const manualButton = screen.getByRole('button', { name: /manual entry/i });
    await user.click(manualButton);

    // Add symptom
    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.type(symptomInput, 'test');
    await user.click(addButton);

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit check-in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/submitting check-in/i)).toBeInTheDocument();
    });
  });
});
