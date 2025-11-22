import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInCard, getSeverityVariant } from '../CheckInCard';
import type { CheckIn } from '../../services/api';

// Mock check-in data
const createMockCheckIn = (overrides?: Partial<CheckIn>): CheckIn => ({
  _id: 'test-id-123',
  userId: 'user-123',
  timestamp: '2025-11-22T14:30:00.000Z',
  rawTranscript: 'Feeling tired with a headache',
  structured: {
    symptoms: {
      headache: { severity: 7, location: 'temples' },
      fatigue: { severity: 5 },
    },
    activities: ['walking', 'reading'],
    triggers: ['stress'],
    notes: 'Started after lunch, improving with rest',
  },
  flaggedForDoctor: false,
  createdAt: '2025-11-22T14:30:00.000Z',
  updatedAt: '2025-11-22T14:30:00.000Z',
  ...overrides,
});

describe('CheckInCard', () => {
  describe('getSeverityVariant helper', () => {
    it('returns success for low severity (1-3)', () => {
      expect(getSeverityVariant(1)).toBe('success');
      expect(getSeverityVariant(2)).toBe('success');
      expect(getSeverityVariant(3)).toBe('success');
    });

    it('returns warning for medium severity (4-7)', () => {
      expect(getSeverityVariant(4)).toBe('warning');
      expect(getSeverityVariant(5)).toBe('warning');
      expect(getSeverityVariant(6)).toBe('warning');
      expect(getSeverityVariant(7)).toBe('warning');
    });

    it('returns error for high severity (8-10)', () => {
      expect(getSeverityVariant(8)).toBe('error');
      expect(getSeverityVariant(9)).toBe('error');
      expect(getSeverityVariant(10)).toBe('error');
    });
  });

  describe('Compact Mode', () => {
    it('renders in compact mode by default', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} />);

      // Should show time but not full timestamp
      expect(screen.getByText(/PM/)).toBeInTheDocument();
      // Should not show raw transcript in compact mode
      expect(screen.queryByText(checkIn.rawTranscript!)).not.toBeInTheDocument();
    });

    it('displays severity dots for top 3 symptoms', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: {
            headache: { severity: 8 },
            fatigue: { severity: 5 },
            nausea: { severity: 3 },
            pain: { severity: 7 },
          },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      render(<CheckInCard checkIn={checkIn} />);

      // Should show exactly 3 symptom dots
      const dots = screen.getAllByRole('generic').filter((el) =>
        el.className.includes('rounded-full')
      );
      expect(dots).toHaveLength(3);

      // Should show +1 indicator for remaining symptom
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('displays correct severity colors for dots', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: {
            headache: { severity: 8 }, // Red (error)
            fatigue: { severity: 5 }, // Amber (warning)
            mood: { severity: 2 }, // Green (success)
          },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      const { container } = render(<CheckInCard checkIn={checkIn} />);

      // Check for severity-specific colors
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-amber-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
    });

    it('truncates long notes with ellipsis', () => {
      const longNotes = 'This is a very long note that should be truncated because it exceeds the 60 character limit for compact mode display';
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: { headache: { severity: 5 } },
          activities: [],
          triggers: [],
          notes: longNotes,
        },
      });

      render(<CheckInCard checkIn={checkIn} />);

      // Should show truncated version with ellipsis
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
      // Should not show full text
      expect(screen.queryByText(longNotes)).not.toBeInTheDocument();
    });

    it('shows flagged badge when flagged', () => {
      const checkIn = createMockCheckIn({ flaggedForDoctor: true });
      render(<CheckInCard checkIn={checkIn} />);

      expect(screen.getByText('Flagged')).toBeInTheDocument();
    });

    it('does not show flagged badge when not flagged', () => {
      const checkIn = createMockCheckIn({ flaggedForDoctor: false });
      render(<CheckInCard checkIn={checkIn} />);

      expect(screen.queryByText('Flagged')).not.toBeInTheDocument();
    });

    it('expands when clicked', async () => {
      const user = userEvent.setup();
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} />);

      // Should not show raw transcript initially
      expect(screen.queryByText(/feeling tired with a headache/i)).not.toBeInTheDocument();

      // Click to expand
      const button = screen.getByRole('button', { name: /click to expand/i });
      await user.click(button);

      // Should now show raw transcript
      expect(screen.getByText(/feeling tired with a headache/i)).toBeInTheDocument();
    });

    it('expands with Enter key', async () => {
      const user = userEvent.setup();
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} />);

      const button = screen.getByRole('button', { name: /click to expand/i });
      button.focus();
      await user.keyboard('{Enter}');

      // Should expand
      expect(screen.getByText(/feeling tired with a headache/i)).toBeInTheDocument();
    });

    it('expands with Space key', async () => {
      const user = userEvent.setup();
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} />);

      const button = screen.getByRole('button', { name: /click to expand/i });
      button.focus();
      await user.keyboard(' ');

      // Should expand
      expect(screen.getByText(/feeling tired with a headache/i)).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} />);

      const button = screen.getByRole('button', { name: /click to expand/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Expanded Mode', () => {
    it('renders in expanded mode when mode prop is expanded', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      // Should show raw transcript
      expect(screen.getByText(/feeling tired with a headache/i)).toBeInTheDocument();
      // Should show full timestamp
      expect(screen.getByText(/Nov 22, 2025/)).toBeInTheDocument();
    });

    it('renders in expanded mode when defaultExpanded is true', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} defaultExpanded={true} />);

      expect(screen.getByText(/feeling tired with a headache/i)).toBeInTheDocument();
    });

    it('displays all symptoms with severity badges', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: {
            headache: { severity: 8 },
            fatigue: { severity: 5 },
            nausea: { severity: 3 },
          },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      expect(screen.getByText('headache: 8')).toBeInTheDocument();
      expect(screen.getByText('fatigue: 5')).toBeInTheDocument();
      expect(screen.getByText('nausea: 3')).toBeInTheDocument();
    });

    it('displays symptom location when available', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: {
            headache: { severity: 7, location: 'temples' },
          },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      expect(screen.getByText(/temples/)).toBeInTheDocument();
    });

    it('displays symptom notes in details section', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: {
            headache: { severity: 7, notes: 'Throbbing pain' },
          },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      expect(screen.getByText(/Throbbing pain/)).toBeInTheDocument();
    });

    it('displays activities with success badges', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      expect(screen.getByText('walking')).toBeInTheDocument();
      expect(screen.getByText('reading')).toBeInTheDocument();
    });

    it('displays triggers with error badges', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      expect(screen.getByText('stress')).toBeInTheDocument();
    });

    it('displays full notes', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      expect(screen.getByText(checkIn.structured.notes)).toBeInTheDocument();
    });

    it('does not show sections when data is empty', () => {
      const checkIn = createMockCheckIn({
        rawTranscript: undefined,
        structured: {
          symptoms: {},
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      expect(screen.queryByText('Symptoms:')).not.toBeInTheDocument();
      expect(screen.queryByText('Activities:')).not.toBeInTheDocument();
      expect(screen.queryByText('Triggers:')).not.toBeInTheDocument();
      expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
    });

    it('collapses when Show less is clicked', async () => {
      const user = userEvent.setup();
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} defaultExpanded={true} />);

      // Should be expanded initially
      expect(screen.getByText(/feeling tired with a headache/i)).toBeInTheDocument();

      // Click "Show less"
      const showLessButton = screen.getByText('Show less');
      await user.click(showLessButton);

      // Should be collapsed
      expect(screen.queryByText(/feeling tired with a headache/i)).not.toBeInTheDocument();
    });

    it('does not show Show less button when mode is expanded', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      expect(screen.queryByText('Show less')).not.toBeInTheDocument();
    });
  });

  describe('Flag Interaction', () => {
    it('calls onFlag when flag button is clicked', async () => {
      const user = userEvent.setup();
      const onFlag = vi.fn();
      const checkIn = createMockCheckIn({ flaggedForDoctor: false });

      render(<CheckInCard checkIn={checkIn} mode="expanded" onFlag={onFlag} />);

      const flagButton = screen.getByRole('button', { name: /flag for doctor/i });
      await user.click(flagButton);

      expect(onFlag).toHaveBeenCalledWith('test-id-123', true);
    });

    it('toggles flag state when clicked', async () => {
      const user = userEvent.setup();
      const checkIn = createMockCheckIn({ flaggedForDoctor: false });

      render(<CheckInCard checkIn={checkIn} mode="expanded" onFlag={vi.fn()} />);

      // Initially not flagged
      expect(screen.getByRole('button', { name: /flag for doctor/i })).toBeInTheDocument();

      // Click to flag
      await user.click(screen.getByRole('button', { name: /flag for doctor/i }));

      // Should now show as flagged
      expect(screen.getByRole('button', { name: /flagged/i })).toBeInTheDocument();
    });

    it('updates badge when unflagging', async () => {
      const user = userEvent.setup();
      const checkIn = createMockCheckIn({ flaggedForDoctor: true });

      render(<CheckInCard checkIn={checkIn} mode="expanded" onFlag={vi.fn()} />);

      // Initially flagged - should show badge
      expect(screen.getByText('Flagged for Doctor')).toBeInTheDocument();

      // Click to unflag
      await user.click(screen.getByRole('button', { name: /flagged/i }));

      // Badge should disappear
      await waitFor(() => {
        expect(screen.queryByText('Flagged for Doctor')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Interaction', () => {
    it('shows confirmation dialog when delete is clicked', async () => {
      const user = userEvent.setup();
      const checkIn = createMockCheckIn();

      render(<CheckInCard checkIn={checkIn} mode="expanded" onDelete={vi.fn()} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirmation dialog should appear
      expect(screen.getByText('Delete Check-In')).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to delete this check-in/i)
      ).toBeInTheDocument();
    });

    it('calls onDelete when confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const checkIn = createMockCheckIn();

      render(<CheckInCard checkIn={checkIn} mode="expanded" onDelete={onDelete} />);

      // Click delete button (get all buttons and find the first one in card actions)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm deletion in dialog - find the danger variant button
      await waitFor(() => {
        expect(screen.getByText('Delete Check-In')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
      const confirmButton = confirmButtons.find(btn =>
        btn.className.includes('bg-red-600')
      );
      await user.click(confirmButton!);

      expect(onDelete).toHaveBeenCalledWith('test-id-123');
    });

    it('does not call onDelete when cancelled', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const checkIn = createMockCheckIn();

      render(<CheckInCard checkIn={checkIn} mode="expanded" onDelete={onDelete} />);

      // Click delete button
      await user.click(screen.getByRole('button', { name: /delete/i }));

      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('closes dialog when cancelled', async () => {
      const user = userEvent.setup();
      const checkIn = createMockCheckIn();

      render(<CheckInCard checkIn={checkIn} mode="expanded" onDelete={vi.fn()} />);

      // Click delete button
      await user.click(screen.getByRole('button', { name: /delete/i }));

      // Dialog should be visible
      expect(screen.getByText('Delete Check-In')).toBeInTheDocument();

      // Cancel deletion
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Delete Check-In')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Interaction', () => {
    it('shows edit button when onEdit is provided', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} mode="expanded" onEdit={vi.fn()} />);

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('does not show edit button when onEdit is not provided', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('calls onEdit when clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const checkIn = createMockCheckIn();

      render(<CheckInCard checkIn={checkIn} mode="expanded" onEdit={onEdit} />);

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(onEdit).toHaveBeenCalledWith('test-id-123');
    });
  });

  describe('Accessibility', () => {
    it('has keyboard accessible expand/collapse in compact mode', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} />);

      const button = screen.getByRole('button', { name: /click to expand/i });
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('has ARIA labels for severity dots', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: { headache: { severity: 8 } },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      const { container } = render(<CheckInCard checkIn={checkIn} />);

      const dot = container.querySelector('[aria-label*="headache severity"]');
      expect(dot).toBeInTheDocument();
    });

    it('has ARIA labels for severity badges in expanded mode', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: { headache: { severity: 8 } },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      const badge = screen.getByLabelText(/headache.*high severity/i);
      expect(badge).toBeInTheDocument();
    });

    it('has proper focus indicators', () => {
      const checkIn = createMockCheckIn();
      render(<CheckInCard checkIn={checkIn} />);

      const button = screen.getByRole('button', { name: /click to expand/i });
      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toContain('focus:ring-indigo-500');
    });
  });

  describe('Edge Cases', () => {
    it('handles check-in with no symptoms', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: {},
          activities: ['walking'],
          triggers: [],
          notes: 'Just notes',
        },
      });

      render(<CheckInCard checkIn={checkIn} />);

      // Should render without errors
      expect(screen.getByText(/just notes/i)).toBeInTheDocument();
    });

    it('handles check-in with no raw transcript', () => {
      const checkIn = createMockCheckIn({ rawTranscript: undefined });

      render(<CheckInCard checkIn={checkIn} mode="expanded" />);

      // Should render without transcript section
      expect(screen.queryByText('ldquo;')).not.toBeInTheDocument();
    });

    it('handles check-in with empty notes', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: { headache: { severity: 5 } },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      render(<CheckInCard checkIn={checkIn} />);

      // Should not show notes snippet in compact mode
      const notes = screen.queryByText(/ldquo;/);
      expect(notes).not.toBeInTheDocument();
    });

    it('handles very short notes without truncation', () => {
      const shortNotes = 'Short note';
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: { headache: { severity: 5 } },
          activities: [],
          triggers: [],
          notes: shortNotes,
        },
      });

      render(<CheckInCard checkIn={checkIn} />);

      // Should show full text without ellipsis
      expect(screen.getByText(/Short note/)).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });

    it('handles exactly 3 symptoms without +N indicator', () => {
      const checkIn = createMockCheckIn({
        structured: {
          symptoms: {
            headache: { severity: 7 },
            fatigue: { severity: 5 },
            nausea: { severity: 3 },
          },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      render(<CheckInCard checkIn={checkIn} />);

      // Should not show +N indicator
      expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
    });
  });
});
