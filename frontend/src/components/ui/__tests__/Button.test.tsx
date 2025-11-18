import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with text content', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders as button type by default', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders with custom type', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('forwards ref to button element', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Click me</Button>);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  describe('Variants', () => {
    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-white');
    });

    it('renders tertiary variant', () => {
      render(<Button variant="tertiary">Tertiary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('renders danger variant', () => {
      render(<Button variant="danger">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('renders link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:underline');
    });
  });

  describe('Sizes', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('renders small size', () => {
      render(<Button size="small">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5');
    });

    it('renders large size', () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3');
    });
  });

  describe('States', () => {
    it('applies disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('shows loading state with spinner', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('hides icon when loading', () => {
      render(
        <Button loading icon={<span data-testid="icon">Icon</span>}>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders with icon before text', () => {
      render(
        <Button icon={<span data-testid="icon">✓</span>}>
          With Icon
        </Button>
      );
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon');
      expect(button).toContainElement(icon);
      expect(button).toHaveTextContent('With Icon');
    });

    it('renders icon-only button', () => {
      render(
        <Button iconOnly aria-label="Delete">
          <span data-testid="icon">×</span>
        </Button>
      );
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('warns when iconOnly lacks aria-label', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Button iconOnly>
          <span>×</span>
        </Button>
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('iconOnly buttons must have an aria-label')
      );
      consoleWarn.mockRestore();
    });
  });

  describe('Interaction', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Click me
        </Button>
      );

      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} loading>
          Click me
        </Button>
      );

      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is keyboard accessible with Enter', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      screen.getByRole('button').focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is keyboard accessible with Space', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      screen.getByRole('button').focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2');
    });

    it('applies aria-label for icon-only buttons', () => {
      render(
        <Button iconOnly aria-label="Close dialog">
          ×
        </Button>
      );
      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    });

    it('spinner has aria-hidden', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Styling', () => {
    it('accepts custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('applies fullWidth style', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });
});
