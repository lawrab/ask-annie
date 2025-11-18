import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '../Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      render(<Badge>Test badge</Badge>);
      expect(screen.getByText('Test badge')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { container } = render(<Badge variant="default">Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-gray-100');
      expect(container.firstChild).toHaveClass('text-gray-800');
    });

    it('renders primary variant', () => {
      const { container } = render(<Badge variant="primary">Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-primary-100');
      expect(container.firstChild).toHaveClass('text-primary-800');
    });

    it('renders success variant', () => {
      const { container } = render(<Badge variant="success">Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-green-100');
      expect(container.firstChild).toHaveClass('text-green-800');
    });

    it('renders error variant', () => {
      const { container } = render(<Badge variant="error">Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-red-100');
      expect(container.firstChild).toHaveClass('text-red-800');
    });

    it('renders warning variant', () => {
      const { container } = render(<Badge variant="warning">Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-amber-100');
      expect(container.firstChild).toHaveClass('text-amber-800');
    });

    it('renders info variant', () => {
      const { container } = render(<Badge variant="info">Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-blue-100');
      expect(container.firstChild).toHaveClass('text-blue-800');
    });

    it('renders secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-secondary-100');
      expect(container.firstChild).toHaveClass('text-secondary-800');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<Badge size="small">Badge</Badge>);
      expect(container.firstChild).toHaveClass('text-xs');
      expect(container.firstChild).toHaveClass('px-2');
      expect(container.firstChild).toHaveClass('py-0.5');
    });

    it('renders medium size by default', () => {
      const { container } = render(<Badge>Badge</Badge>);
      expect(container.firstChild).toHaveClass('text-sm');
      expect(container.firstChild).toHaveClass('px-3');
      expect(container.firstChild).toHaveClass('py-1');
    });

    it('renders large size', () => {
      const { container } = render(<Badge size="large">Badge</Badge>);
      expect(container.firstChild).toHaveClass('text-base');
      expect(container.firstChild).toHaveClass('px-4');
      expect(container.firstChild).toHaveClass('py-1.5');
    });
  });

  describe('Removable functionality', () => {
    it('renders remove button when removable and onRemove are provided', () => {
      const handleRemove = vi.fn();
      render(
        <Badge removable onRemove={handleRemove}>
          Badge
        </Badge>
      );

      expect(screen.getByRole('button', { name: /remove badge/i })).toBeInTheDocument();
    });

    it('does not render remove button when removable is true but onRemove is missing', () => {
      render(<Badge removable>Badge</Badge>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render remove button when onRemove is provided but removable is false', () => {
      const handleRemove = vi.fn();
      render(<Badge onRemove={handleRemove}>Badge</Badge>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();
      render(
        <Badge removable onRemove={handleRemove}>
          Badge
        </Badge>
      );

      await user.click(screen.getByRole('button', { name: /remove badge/i }));
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('stops event propagation when remove button is clicked', async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();
      const handleBadgeClick = vi.fn();

      render(
        <div onClick={handleBadgeClick}>
          <Badge removable onRemove={handleRemove}>
            Badge
          </Badge>
        </div>
      );

      await user.click(screen.getByRole('button', { name: /remove badge/i }));
      expect(handleRemove).toHaveBeenCalledTimes(1);
      expect(handleBadgeClick).not.toHaveBeenCalled();
    });

    it('calls onRemove when Enter key is pressed on remove button', async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();
      render(
        <Badge removable onRemove={handleRemove}>
          Badge
        </Badge>
      );

      const removeButton = screen.getByRole('button', { name: /remove badge/i });
      removeButton.focus();
      await user.keyboard('{Enter}');
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('calls onRemove when Space key is pressed on remove button', async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();
      render(
        <Badge removable onRemove={handleRemove}>
          Badge
        </Badge>
      );

      const removeButton = screen.getByRole('button', { name: /remove badge/i });
      removeButton.focus();
      await user.keyboard(' ');
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('stops event propagation when keyboard is used on remove button', async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();
      const handleBadgeKeyDown = vi.fn();

      render(
        <div onKeyDown={handleBadgeKeyDown}>
          <Badge removable onRemove={handleRemove}>
            Badge
          </Badge>
        </div>
      );

      const removeButton = screen.getByRole('button', { name: /remove badge/i });
      removeButton.focus();
      await user.keyboard('{Enter}');
      expect(handleRemove).toHaveBeenCalledTimes(1);
      // Parent should not receive the event due to stopPropagation
      expect(handleBadgeKeyDown).not.toHaveBeenCalled();
    });

    it('has accessible label for remove button', () => {
      const handleRemove = vi.fn();
      render(
        <Badge removable onRemove={handleRemove}>
          Symptom Tag
        </Badge>
      );

      expect(
        screen.getByRole('button', { name: 'Remove Symptom Tag' })
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Badge ref={ref}>Badge</Badge>);
      expect(ref).toHaveBeenCalled();
    });

    it('remove button has proper ARIA attributes', () => {
      const handleRemove = vi.fn();
      render(
        <Badge removable onRemove={handleRemove}>
          Test
        </Badge>
      );

      const button = screen.getByRole('button', { name: 'Remove Test' });
      expect(button).toHaveAttribute('aria-label', 'Remove Test');
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
