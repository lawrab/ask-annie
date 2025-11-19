import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Modal title (required for accessibility)
   */
  title: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Modal content
   */
  children: ReactNode;

  /**
   * Modal size
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'full';

  /**
   * Whether to show close button
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Whether clicking outside closes the modal
   * @default true
   */
  closeOnBackdropClick?: boolean;

  /**
   * Additional CSS classes for the modal panel
   */
  className?: string;

  /**
   * Optional footer content (typically action buttons)
   */
  footer?: ReactNode;

  /**
   * Initial focus element ref (optional)
   */
  initialFocus?: React.MutableRefObject<HTMLElement | null>;
}

const sizeClasses = {
  small: 'sm:max-w-sm',
  medium: 'sm:max-w-lg',
  large: 'sm:max-w-2xl',
  xlarge: 'sm:max-w-4xl',
  full: 'sm:max-w-[95vw]',
};

/**
 * Modal component for displaying content in a dialog overlay
 *
 * Built on Headless UI Dialog with full accessibility support:
 * - Focus trap keeps focus within modal
 * - Escape key closes modal
 * - Returns focus to trigger element on close
 * - Proper ARIA attributes
 * - Body scroll lock when open
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Delete Check-in"
 *   description="Are you sure you want to delete this check-in?"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="danger" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   <p>This action cannot be undone.</p>
 * </Modal>
 * ```
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className,
  footer,
  initialFocus,
}: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog
        onClose={closeOnBackdropClick ? onClose : () => {}}
        className="relative z-50"
        initialFocus={initialFocus}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Full-screen container to center the panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={cn(
                'relative w-full transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-2xl transition-all',
                sizeClasses[size],
                className
              )}
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Dialog.Title className="text-lg font-semibold text-neutral-900">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-neutral-600">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="ml-4 rounded-md text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="text-sm text-neutral-700">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

/**
 * ConfirmDialog - Pre-configured modal for confirmation actions
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Check-in"
 *   description="Are you sure you want to delete this check-in? This action cannot be undone."
 *   confirmText="Delete"
 *   confirmVariant="danger"
 * />
 * ```
 */
export interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog should close
   */
  onClose: () => void;

  /**
   * Callback when user confirms
   */
  onConfirm: () => void;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog description/message
   */
  description?: string;

  /**
   * Confirm button text
   * @default 'Confirm'
   */
  confirmText?: string;

  /**
   * Cancel button text
   * @default 'Cancel'
   */
  cancelText?: string;

  /**
   * Confirm button variant
   * @default 'primary'
   */
  confirmVariant?: 'primary' | 'danger';

  /**
   * Whether confirm button shows loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Additional content to show in the dialog body
   */
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="small"
      footer={
        <>
          <Button variant="tertiary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} loading={isLoading}>
            {confirmText}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
