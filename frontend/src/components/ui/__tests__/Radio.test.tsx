import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Radio } from '../Radio';

describe('Radio', () => {
  describe('Basic rendering', () => {
    it('renders a radio input', () => {
      render(<Radio />);
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Radio label="Option A" />);
      expect(screen.getByLabelText('Option A')).toBeInTheDocument();
    });

    it('renders with custom id', () => {
      render(<Radio id="custom-radio" label="Custom" />);
      expect(screen.getByRole('radio')).toHaveAttribute('id', 'custom-radio');
    });

    it('generates unique id when not provided', () => {
      render(<Radio label="Auto ID" />);
      const radio = screen.getByRole('radio');
      expect(radio.id).toMatch(/^radio-/);
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Radio size="small" data-testid="radio" />);
      expect(screen.getByTestId('radio')).toHaveClass('h-3', 'w-3');
    });

    it('renders medium size by default', () => {
      render(<Radio data-testid="radio" />);
      expect(screen.getByTestId('radio')).toHaveClass('h-4', 'w-4');
    });

    it('renders large size', () => {
      render(<Radio size="large" data-testid="radio" />);
      expect(screen.getByTestId('radio')).toHaveClass('h-5', 'w-5');
    });
  });

  describe('States', () => {
    it('can be checked', () => {
      render(<Radio checked onChange={() => {}} />);
      expect(screen.getByRole('radio')).toBeChecked();
    });

    it('can be unchecked', () => {
      render(<Radio checked={false} onChange={() => {}} />);
      expect(screen.getByRole('radio')).not.toBeChecked();
    });

    it('can be disabled', () => {
      render(<Radio disabled label="Disabled option" />);
      expect(screen.getByRole('radio')).toBeDisabled();
    });

    it('applies disabled styles to label', () => {
      render(<Radio disabled label="Disabled option" />);
      expect(screen.getByText('Disabled option')).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Helper text and error', () => {
    it('renders helper text', () => {
      render(<Radio label="Option" helperText="This is helpful" />);
      expect(screen.getByText('This is helpful')).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(<Radio label="Option" error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('shows error instead of helper text when both provided', () => {
      render(<Radio label="Option" helperText="Helpful" error="Error" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error');
      expect(screen.queryByText('Helpful')).not.toBeInTheDocument();
    });

    it('sets aria-invalid when error is present', () => {
      render(<Radio error="Error" />);
      expect(screen.getByRole('radio')).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid to false when no error', () => {
      render(<Radio />);
      expect(screen.getByRole('radio')).toHaveAttribute('aria-invalid', 'false');
    });

    it('associates error message with aria-describedby', () => {
      render(<Radio id="test-radio" label="Option" error="Error message" />);
      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-describedby', 'test-radio-error');
    });

    it('associates helper text with aria-describedby when no error', () => {
      render(<Radio id="test-radio" label="Option" helperText="Helper" />);
      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-describedby', 'test-radio-helper');
    });
  });

  describe('Interaction', () => {
    it('calls onChange when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Radio onChange={handleChange} />);

      await user.click(screen.getByRole('radio'));
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Radio disabled onChange={handleChange} />);

      await user.click(screen.getByRole('radio'));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('can be part of a radio group with name', () => {
      render(
        <>
          <Radio name="group" value="a" label="Option A" />
          <Radio name="group" value="b" label="Option B" />
        </>
      );

      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('name', 'group');
      expect(radios[1]).toHaveAttribute('name', 'group');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to radio input', () => {
      render(<Radio className="custom-class" data-testid="radio" />);
      expect(screen.getByTestId('radio')).toHaveClass('custom-class');
    });
  });

  describe('Forwarded ref', () => {
    it('forwards ref to input element', () => {
      const ref = vi.fn();
      render(<Radio ref={ref} />);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });
  });
});
