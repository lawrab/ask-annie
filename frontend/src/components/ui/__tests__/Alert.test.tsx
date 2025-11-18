import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '../Alert';

describe('Alert', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      render(<Alert>Test alert message</Alert>);
      expect(screen.getByText('Test alert message')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Alert className="custom-class">Alert</Alert>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has alert role', () => {
      render(<Alert>Alert message</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Types', () => {
    it('renders success type with correct styles', () => {
      const { container } = render(<Alert type="success">Success!</Alert>);
      expect(container.firstChild).toHaveClass('bg-green-50');
      expect(container.firstChild).toHaveClass('border-green-400');
      expect(container.firstChild).toHaveClass('text-green-700');
    });

    it('renders error type with correct styles', () => {
      const { container } = render(<Alert type="error">Error!</Alert>);
      expect(container.firstChild).toHaveClass('bg-red-50');
      expect(container.firstChild).toHaveClass('border-red-400');
      expect(container.firstChild).toHaveClass('text-red-700');
    });

    it('renders warning type with correct styles', () => {
      const { container } = render(<Alert type="warning">Warning!</Alert>);
      expect(container.firstChild).toHaveClass('bg-amber-50');
      expect(container.firstChild).toHaveClass('border-amber-400');
      expect(container.firstChild).toHaveClass('text-amber-700');
    });

    it('renders info type with correct styles by default', () => {
      const { container } = render(<Alert>Info</Alert>);
      expect(container.firstChild).toHaveClass('bg-blue-50');
      expect(container.firstChild).toHaveClass('border-blue-400');
      expect(container.firstChild).toHaveClass('text-blue-700');
    });
  });

  describe('Title', () => {
    it('renders with title', () => {
      render(<Alert title="Alert Title">Message</Alert>);
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('renders without title', () => {
      render(<Alert>Message only</Alert>);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('applies correct styles to title based on type', () => {
      render(
        <Alert type="success" title="Success Title">
          Message
        </Alert>
      );
      const title = screen.getByText('Success Title');
      expect(title).toHaveClass('text-green-800');
      expect(title).toHaveClass('font-semibold');
    });
  });

  describe('Icons', () => {
    it('renders default icon by default', () => {
      const { container } = render(<Alert>Message</Alert>);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('does not render icon when showIcon is false', () => {
      const { container } = render(<Alert showIcon={false}>Message</Alert>);
      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    it('renders custom icon when provided', () => {
      render(
        <Alert icon={<span data-testid="custom-icon">⚠️</span>}>Message</Alert>
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('renders different icons for different types', () => {
      const { container: successContainer } = render(
        <Alert type="success">Success</Alert>
      );
      const { container: errorContainer } = render(<Alert type="error">Error</Alert>);

      // Both should have SVG icons but they should be different
      const successIcon = successContainer.querySelector('svg');
      const errorIcon = errorContainer.querySelector('svg');

      expect(successIcon).toBeInTheDocument();
      expect(errorIcon).toBeInTheDocument();
      // They have different paths, so the HTML should be different
      expect(successIcon?.innerHTML).not.toBe(errorIcon?.innerHTML);
    });
  });

  describe('Dismissible functionality', () => {
    it('does not render dismiss button by default', () => {
      render(<Alert>Message</Alert>);
      expect(
        screen.queryByRole('button', { name: /dismiss alert/i })
      ).not.toBeInTheDocument();
    });

    it('renders dismiss button when dismissible is true', () => {
      render(<Alert dismissible>Message</Alert>);
      expect(
        screen.getByRole('button', { name: /dismiss alert/i })
      ).toBeInTheDocument();
    });

    it('hides alert when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      render(<Alert dismissible>Message to dismiss</Alert>);

      expect(screen.getByText('Message to dismiss')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /dismiss alert/i }));

      expect(screen.queryByText('Message to dismiss')).not.toBeInTheDocument();
    });

    it('calls onDismiss callback when dismissed', async () => {
      const user = userEvent.setup();
      const handleDismiss = vi.fn();
      render(
        <Alert dismissible onDismiss={handleDismiss}>
          Message
        </Alert>
      );

      await user.click(screen.getByRole('button', { name: /dismiss alert/i }));

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('dismiss button has proper accessibility attributes', () => {
      render(<Alert dismissible>Message</Alert>);
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });

      expect(dismissButton).toHaveAttribute('type', 'button');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss alert');
    });
  });

  describe('Visibility state', () => {
    it('is visible by default', () => {
      render(<Alert>Visible message</Alert>);
      expect(screen.getByText('Visible message')).toBeInTheDocument();
    });

    it('remains hidden after being dismissed', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Alert dismissible>Message</Alert>);

      await user.click(screen.getByRole('button', { name: /dismiss alert/i }));
      expect(screen.queryByText('Message')).not.toBeInTheDocument();

      // Rerender to simulate component update
      rerender(<Alert dismissible>Message</Alert>);
      // Should still be hidden because internal state is maintained
      expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Alert ref={ref}>Message</Alert>);
      expect(ref).toHaveBeenCalled();
    });

    it('has proper ARIA role', () => {
      render(<Alert>Important message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('dismiss button is keyboard accessible', () => {
      render(<Alert dismissible>Message</Alert>);

      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      dismissButton.focus();

      expect(document.activeElement).toBe(dismissButton);
    });
  });

  describe('Complex scenarios', () => {
    it('renders alert with title, icon, and dismiss button', () => {
      render(
        <Alert type="warning" title="Warning Title" dismissible>
          Warning message content
        </Alert>
      );

      expect(screen.getByText('Warning Title')).toBeInTheDocument();
      expect(screen.getByText('Warning message content')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /dismiss alert/i })
      ).toBeInTheDocument();
    });

    it('renders alert with custom icon and no default icon', () => {
      const { container } = render(
        <Alert icon={<span data-testid="custom-icon">🔥</span>}>Message</Alert>
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      // Custom icon is not an SVG, so there should be no SVGs (dismissible is false by default)
      expect(container.querySelectorAll('svg').length).toBe(0);
    });
  });
});
