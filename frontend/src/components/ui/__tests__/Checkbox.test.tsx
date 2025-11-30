import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../Checkbox';

describe('Checkbox', () => {
  describe('Basic rendering', () => {
    it('renders a checkbox input', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Checkbox label="Accept terms" />);
      expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    });

    it('renders with custom id', () => {
      render(<Checkbox id="custom-checkbox" label="Custom" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'custom-checkbox');
    });

    it('generates unique id when not provided', () => {
      render(<Checkbox label="Auto ID" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.id).toMatch(/^checkbox-/);
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Checkbox size="small" data-testid="checkbox" />);
      expect(screen.getByTestId('checkbox')).toHaveClass('h-3', 'w-3');
    });

    it('renders medium size by default', () => {
      render(<Checkbox data-testid="checkbox" />);
      expect(screen.getByTestId('checkbox')).toHaveClass('h-4', 'w-4');
    });

    it('renders large size', () => {
      render(<Checkbox size="large" data-testid="checkbox" />);
      expect(screen.getByTestId('checkbox')).toHaveClass('h-5', 'w-5');
    });
  });

  describe('States', () => {
    it('can be checked', () => {
      render(<Checkbox checked onChange={() => {}} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('can be unchecked', () => {
      render(<Checkbox checked={false} onChange={() => {}} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('can be disabled', () => {
      render(<Checkbox disabled label="Disabled option" />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('applies disabled styles to label', () => {
      render(<Checkbox disabled label="Disabled option" />);
      expect(screen.getByText('Disabled option')).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('supports indeterminate state', () => {
      render(<Checkbox indeterminate data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });
  });

  describe('Helper text and error', () => {
    it('renders helper text', () => {
      render(<Checkbox label="Option" helperText="This is helpful" />);
      expect(screen.getByText('This is helpful')).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(<Checkbox label="Option" error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('shows error instead of helper text when both provided', () => {
      render(<Checkbox label="Option" helperText="Helpful" error="Error" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error');
      expect(screen.queryByText('Helpful')).not.toBeInTheDocument();
    });

    it('sets aria-invalid when error is present', () => {
      render(<Checkbox error="Error" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid to false when no error', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('associates error message with aria-describedby', () => {
      render(<Checkbox id="test-checkbox" label="Option" error="Error message" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-describedby', 'test-checkbox-error');
    });

    it('associates helper text with aria-describedby when no error', () => {
      render(<Checkbox id="test-checkbox" label="Option" helperText="Helper" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-describedby', 'test-checkbox-helper');
    });
  });

  describe('Interaction', () => {
    it('calls onChange when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onChange={handleChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('receives change event on click', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onChange={handleChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledTimes(1);
      // The event object is passed to onChange
      expect(handleChange.mock.calls[0][0]).toHaveProperty('target');
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox disabled onChange={handleChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to checkbox input', () => {
      render(<Checkbox className="custom-class" data-testid="checkbox" />);
      expect(screen.getByTestId('checkbox')).toHaveClass('custom-class');
    });
  });

  describe('Forwarded ref', () => {
    it('forwards ref to input element', () => {
      const ref = vi.fn();
      render(<Checkbox ref={ref} />);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });

    it('forwards ref as object', () => {
      const ref = { current: null };
      render(<Checkbox ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
