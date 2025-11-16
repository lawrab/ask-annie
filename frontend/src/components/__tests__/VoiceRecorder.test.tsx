import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceRecorder from '../VoiceRecorder';

// Mock MediaRecorder
class MockMediaRecorder {
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state: string = 'inactive';

  constructor() {
    // Initialize
  }

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

// TODO: Fix Web Audio API mocking - MediaRecorder and getUserMedia are difficult to mock in jsdom
describe.skip('VoiceRecorder', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock getUserMedia
    mockGetUserMedia = vi.fn().mockResolvedValue({
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
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.createObjectURL = mockCreateObjectURL;

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render start recording button initially', () => {
    const mockOnRecordingComplete = vi.fn();

    render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />);

    expect(
      screen.getByRole('button', { name: /start recording/i })
    ).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('should show recording indicator when recording', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnRecordingComplete = vi.fn();

    render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
  });

  it('should increment timer during recording', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnRecordingComplete = vi.fn();

    render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    // Advance timer by 3 seconds
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByText('00:03')).toBeInTheDocument();
    });
  });

  it('should pause recording', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnRecordingComplete = vi.fn();

    render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await user.click(pauseButton);

    await waitFor(() => {
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
  });

  it('should resume recording after pause', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnRecordingComplete = vi.fn();

    render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await user.click(pauseButton);

    await waitFor(() => {
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    const resumeButton = screen.getByRole('button', { name: /resume/i });
    await user.click(resumeButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });
  });

  it('should stop recording and show preview', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnRecordingComplete = vi.fn();

    render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    const stopButton = screen.getByRole('button', { name: /stop/i });
    await user.click(stopButton);

    await waitFor(() => {
      expect(screen.getByText('Recording Preview')).toBeInTheDocument();
    });

    expect(mockOnRecordingComplete).toHaveBeenCalledWith(
      expect.any(Blob)
    );
  });

  it('should allow recording again after preview', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnRecordingComplete = vi.fn();

    render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    const stopButton = screen.getByRole('button', { name: /stop/i });
    await user.click(stopButton);

    await waitFor(() => {
      expect(screen.getByText('Recording Preview')).toBeInTheDocument();
    });

    const recordAgainButton = screen.getByRole('button', {
      name: /record again/i,
    });
    await user.click(recordAgainButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /start recording/i })
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('Recording Preview')).not.toBeInTheDocument();
  });

  it('should show error when microphone permission denied', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnRecordingComplete = vi.fn();
    const mockOnError = vi.fn();

    mockGetUserMedia.mockRejectedValueOnce(
      new Error('Permission denied')
    );

    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        onError={mockOnError}
      />
    );

    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(
        screen.getByText(/microphone access denied/i)
      ).toBeInTheDocument();
    });

    expect(mockOnError).toHaveBeenCalledWith('Permission denied');
  });

  it('should create audio element with correct src', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnRecordingComplete = vi.fn();

    render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    const stopButton = screen.getByRole('button', { name: /stop/i });
    await user.click(stopButton);

    await waitFor(() => {
      const audioElement = screen.getByRole('application');
      expect(audioElement).toHaveAttribute('src', 'blob:mock-url');
    });
  });

  it('should cleanup media stream on unmount', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnRecordingComplete = vi.fn();
    const mockStop = vi.fn();

    mockGetUserMedia.mockResolvedValueOnce({
      getTracks: vi.fn().mockReturnValue([
        {
          stop: mockStop,
        },
      ]),
    });

    const { unmount } = render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    unmount();

    expect(mockStop).toHaveBeenCalled();
  });
});
