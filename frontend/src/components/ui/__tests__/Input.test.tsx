import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email address" />);
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      render(<Input helperText="Enter your email" />);
      expect(screen.getByText('Enter your email')).toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(<Input error="Invalid email" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    });

    it('hides helper text when error is present', () => {
      render(<Input helperText="Helper text" error="Error message" />);
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('shows required asterisk when required', () => {
      render(<Input label="Email" required />);
      expect(screen.getByLabelText('required')).toHaveTextContent('*');
    });

    it('forwards ref to input element', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });
  });

  describe('Types', () => {
    it('renders text input by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders email input', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders password input', () => {
      const { container } = render(<Input type="password" />);
      const input = container.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders number input', () => {
      render(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });
  });

  describe('Password Toggle', () => {
    it('shows password toggle button for password type', () => {
      render(<Input type="password" />);
      expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    });

    it('toggles password visibility when clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<Input type="password" />);

      const input = container.querySelector('input') as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: 'Show password' });

      // Initially password is hidden
      expect(input).toHaveAttribute('type', 'password');

      // Click to show
      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

      // Click to hide again
      await user.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('Sizes', () => {
    it('renders medium size by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-3', 'py-2');
    });

    it('renders small size', () => {
      render(<Input size="small" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-3', 'py-1.5');
    });

    it('renders large size', () => {
      render(<Input size="large" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-4', 'py-3');
    });
  });

  describe('States', () => {
    it('applies error styling when error is provided', () => {
      render(<Input error="Invalid" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-400');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('applies disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:bg-gray-100');
    });

    it('applies normal styling when no error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-300');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Icons', () => {
    it('renders with start icon', () => {
      render(<Input startIcon={<span data-testid="start-icon">📧</span>} />);
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });

    it('renders with end icon', () => {
      render(<Input endIcon={<span data-testid="end-icon">✓</span>} />);
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });

    it('adjusts padding for start icon', () => {
      render(<Input startIcon={<span>📧</span>} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
    });

    it('adjusts padding for end icon', () => {
      render(<Input endIcon={<span>✓</span>} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pr-10');
    });
  });

  describe('Interaction', () => {
    it('calls onChange when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'test');

      expect(handleChange).toHaveBeenCalled();
    });

    it('accepts value prop', () => {
      render(<Input value="test value" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('test value');
    });

    it('accepts defaultValue prop', () => {
      render(<Input defaultValue="default test" />);
      expect(screen.getByRole('textbox')).toHaveValue('default test');
    });

    it('accepts placeholder', () => {
      render(<Input placeholder="Enter email..." />);
      expect(screen.getByPlaceholderText('Enter email...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('associates label with input via htmlFor/id', () => {
      render(<Input label="Email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('generates unique ID if not provided', () => {
      const { container } = render(<Input label="Email" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('id');
      expect(input?.id).toMatch(/^input-/);
    });

    it('links error message with aria-describedby', () => {
      render(<Input id="email" error="Invalid email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      expect(screen.getByRole('alert')).toHaveAttribute('id', 'email-error');
    });

    it('links helper text with aria-describedby', () => {
      render(<Input id="email" helperText="Enter your email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-helper');
    });

    it('marks required inputs with aria-required', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('has proper focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:ring-primary-500');
    });
  });

  describe('Styling', () => {
    it('accepts custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('applies fullWidth by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full');
    });

    it('can disable fullWidth', () => {
      render(<Input fullWidth={false} />);
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveClass('w-full');
    });
  });
});
