import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManualCheckInForm from '../ManualCheckInForm';

describe('ManualCheckInForm', () => {
  it('should render form fields', () => {
    const mockOnSubmit = vi.fn();

    render(<ManualCheckInForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText(/symptoms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/activities/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/triggers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/additional notes/i)).toBeInTheDocument();
    // Submit button shows "Add at least one symptom" when no symptoms added
    expect(
      screen.getByRole('button', { name: /add at least one symptom/i })
    ).toBeInTheDocument();
  });

  it('should add symptom with severity', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ManualCheckInForm onSubmit={mockOnSubmit} />);

    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const addButton = screen.getByRole('button', { name: /add symptom/i });

    await user.type(symptomInput, 'headache');
    await user.click(addButton);

    expect(screen.getByText(/headache: 5/i)).toBeInTheDocument();
  });

  it('should remove symptom', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ManualCheckInForm onSubmit={mockOnSubmit} />);

    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const addButton = screen.getByRole('button', { name: /add symptom/i });

    await user.type(symptomInput, 'headache');
    await user.click(addButton);

    expect(screen.getByText(/headache: 5/i)).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(screen.queryByText(/headache: 5/i)).not.toBeInTheDocument();
  });

  // TODO: Fix range input interaction in test
  it.skip('should adjust symptom severity', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ManualCheckInForm onSubmit={mockOnSubmit} />);

    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const severitySlider = screen.getByRole('slider') as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: /add symptom/i });

    await user.type(symptomInput, 'pain');
    // Set slider value directly instead of clear + type
    await user.click(severitySlider);
    severitySlider.value = '8';
    severitySlider.dispatchEvent(new Event('change', { bubbles: true }));
    await user.click(addButton);

    expect(screen.getByText(/pain: 8/i)).toBeInTheDocument();
  });

  it('should submit form with structured data', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ManualCheckInForm onSubmit={mockOnSubmit} />);

    // Add symptom
    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const addButton = screen.getByRole('button', { name: /add symptom/i });
    await user.type(symptomInput, 'headache');
    await user.click(addButton);

    // Fill activities
    const activitiesInput = screen.getByPlaceholderText(/working, exercising/i);
    await user.type(activitiesInput, 'working, reading');

    // Fill triggers
    const triggersInput = screen.getByPlaceholderText(/stress, lack of sleep/i);
    await user.type(triggersInput, 'stress, weather');

    // Fill notes
    const notesInput = screen.getByPlaceholderText(/additional details/i);
    await user.type(notesInput, 'Felt tired all day');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit check-in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        symptoms: { headache: { severity: 5 } },
        activities: ['working', 'reading'],
        triggers: ['stress', 'weather'],
        notes: 'Felt tired all day',
      });
    });
  });

  it('should clear form after submission', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ManualCheckInForm onSubmit={mockOnSubmit} />);

    // Add symptom
    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const addButton = screen.getByRole('button', { name: /add symptom/i });
    await user.type(symptomInput, 'nausea');
    await user.click(addButton);

    // Fill activities
    const activitiesInput = screen.getByPlaceholderText(/working, exercising/i);
    await user.type(activitiesInput, 'walking');

    // Fill triggers
    const triggersInput = screen.getByPlaceholderText(/stress, lack of sleep/i);
    await user.type(triggersInput, 'food');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit check-in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Check form is cleared
    expect(screen.queryByText(/nausea: 5/i)).not.toBeInTheDocument();
    expect(activitiesInput).toHaveValue('');
    expect(triggersInput).toHaveValue('');
  });

  it('should handle empty activities and triggers', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ManualCheckInForm onSubmit={mockOnSubmit} />);

    // Add symptom only
    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const addButton = screen.getByRole('button', { name: /add symptom/i });
    await user.type(symptomInput, 'fatigue');
    await user.click(addButton);

    // Submit without activities/triggers
    const submitButton = screen.getByRole('button', { name: /submit check-in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        symptoms: { fatigue: { severity: 5 } },
        activities: [],
        triggers: [],
        notes: '',
      });
    });
  });

  it('should not add symptom with empty name', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ManualCheckInForm onSubmit={mockOnSubmit} />);

    const addButton = screen.getByRole('button', { name: /add symptom/i });
    await user.click(addButton);

    // No symptom should be added
    expect(screen.queryByText(/: 5/i)).not.toBeInTheDocument();
  });

  it('should handle multiple symptoms', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ManualCheckInForm onSubmit={mockOnSubmit} />);

    const symptomInput = screen.getByPlaceholderText(/symptom name/i);
    const addButton = screen.getByRole('button', { name: /add symptom/i });

    // Add first symptom
    await user.type(symptomInput, 'headache');
    await user.click(addButton);

    // Add second symptom
    await user.type(symptomInput, 'nausea');
    await user.click(addButton);

    expect(screen.getByText(/headache: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/nausea: 5/i)).toBeInTheDocument();

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit check-in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          symptoms: {
            headache: { severity: 5 },
            nausea: { severity: 5 },
          },
        })
      );
    });
  });
});
