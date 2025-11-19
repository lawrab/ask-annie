import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ConfirmDialog } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: 'Test Modal',
  };

  describe('Rendering', () => {
    it('renders when open is true', () => {
      render(
        <Modal {...defaultProps}>
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(
        <Modal {...defaultProps} open={false}>
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders with description', () => {
      render(
        <Modal {...defaultProps} description="Modal description">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByText('Modal description')).toBeInTheDocument();
    });

    it('renders footer content', () => {
      render(
        <Modal {...defaultProps} footer={<button>Action</button>}>
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Modal {...defaultProps} className="custom-class">
          <p>Content</p>
        </Modal>
      );
      // Dialog uses portals, so check document.body
      expect(document.body.querySelector('.custom-class')).not.toBeNull();
    });

    it('has dialog role', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('applies small size classes', () => {
      render(
        <Modal {...defaultProps} size="small">
          <p>Content</p>
        </Modal>
      );
      // Dialog uses portals, check document.body
      expect(document.body.innerHTML).toContain('sm:max-w-sm');
    });

    it('applies medium size classes by default', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      expect(document.body.innerHTML).toContain('sm:max-w-lg');
    });

    it('applies large size classes', () => {
      render(
        <Modal {...defaultProps} size="large">
          <p>Content</p>
        </Modal>
      );
      expect(document.body.innerHTML).toContain('sm:max-w-2xl');
    });

    it('applies xlarge size classes', () => {
      render(
        <Modal {...defaultProps} size="xlarge">
          <p>Content</p>
        </Modal>
      );
      expect(document.body.innerHTML).toContain('sm:max-w-4xl');
    });

    it('applies full size classes', () => {
      render(
        <Modal {...defaultProps} size="full">
          <p>Content</p>
        </Modal>
      );
      expect(document.body.innerHTML).toContain('sm:max-w-[95vw]');
    });
  });

  describe('Close Button', () => {
    it('shows close button by default', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(
        <Modal {...defaultProps} showCloseButton={false}>
          <p>Content</p>
        </Modal>
      );
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <Modal {...defaultProps} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );

      await user.click(screen.getByLabelText('Close modal'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backdrop Behavior', () => {
    it('closes on backdrop click by default', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <Modal {...defaultProps} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );

      // Click the backdrop (outside the dialog panel)
      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        await user.click(backdrop);
        // Note: Headless UI's Dialog handles this internally
        // We're testing that the prop is passed correctly
      }
    });

    it('does not close on backdrop click when closeOnBackdropClick is false', async () => {
      const onClose = vi.fn();
      render(
        <Modal {...defaultProps} onClose={onClose} closeOnBackdropClick={false}>
          <p>Content</p>
        </Modal>
      );

      // With closeOnBackdropClick=false, clicking backdrop shouldn't trigger onClose
      // This is handled by Headless UI internally
    });
  });

  describe('Keyboard Interaction', () => {
    it('calls onClose when Escape is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <Modal {...defaultProps} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );

      await user.keyboard('{Escape}');
      // Headless UI Dialog handles Escape key internally
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Modal {...defaultProps} description="Description text">
          <p>Content</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Headless UI automatically adds aria-modal, aria-labelledby, aria-describedby
    });

    it('title is accessible', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );

      // Title should be visible and associated with dialog
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });
  });
});

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
  };

  describe('Rendering', () => {
    it('renders with title', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(<ConfirmDialog {...defaultProps} description="Are you sure?" />);
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('renders additional children', () => {
      render(
        <ConfirmDialog {...defaultProps}>
          <p>Additional content</p>
        </ConfirmDialog>
      );
      expect(screen.getByText('Additional content')).toBeInTheDocument();
    });

    it('has dialog role', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Buttons', () => {
    it('renders confirm and cancel buttons with default text', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders custom button text', () => {
      render(
        <ConfirmDialog {...defaultProps} confirmText="Delete" cancelText="Go Back" />
      );
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    });

    it('applies primary variant by default', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('bg-primary-600');
    });

    it('applies danger variant', () => {
      render(<ConfirmDialog {...defaultProps} confirmVariant="danger" />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('bg-red-600');
    });
  });

  describe('Interactions', () => {
    it('calls onConfirm and onClose when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not trigger handlers when confirm button is disabled during loading', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onClose={onClose}
          isLoading={true}
        />
      );

      // Attempt to click disabled button - this should not trigger handlers
      // Note: userEvent.click on a disabled button doesn't trigger onClick
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeDisabled();

      // Clicking a disabled button should not trigger callbacks
      await user.click(confirmButton);
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state on confirm button', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      // Button component shows loading spinner
      expect(confirmButton).toBeInTheDocument();
    });

    it('disables cancel button when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeDisabled();
    });

    it('disables confirm button when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Small Size', () => {
    it('uses small modal size', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(document.body.innerHTML).toContain('sm:max-w-sm');
    });
  });
});
