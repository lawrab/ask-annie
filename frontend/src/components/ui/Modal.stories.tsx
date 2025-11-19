import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Modal, ConfirmDialog } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { Alert } from './Alert';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onClose: undefined,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicModal: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)} title="Basic Modal">
          <p>This is a basic modal with some content.</p>
        </Modal>
      </>
    );
  },
};

export const WithDescription: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Welcome"
          description="This modal has both a title and description"
        >
          <p>Modal content goes here.</p>
        </Modal>
      </>
    );
  },
};

export const WithFooter: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal with Footer</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Edit Check-in"
          size="large"
          footer={
            <>
              <Button variant="tertiary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Symptom" placeholder="e.g., headache" />
            <TextArea label="Notes" placeholder="Additional details..." rows={3} />
          </div>
        </Modal>
      </>
    );
  },
};

export const SmallSize: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Small Modal</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Small Modal" size="small">
          <p>This is a small modal.</p>
        </Modal>
      </>
    );
  },
};

export const LargeSize: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Large Modal</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Large Modal" size="large">
          <p>This is a large modal with more space for content.</p>
        </Modal>
      </>
    );
  },
};

export const NoCloseButton: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Modal without Close Button</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="No Close Button"
          showCloseButton={false}
          footer={<Button onClick={() => setOpen(false)}>Close</Button>}
        >
          <p>This modal doesn&apos;t have a close button in the header.</p>
        </Modal>
      </>
    );
  },
};

type ConfirmDialogMeta = Meta<typeof ConfirmDialog>;

export const ConfirmDialogPrimary: StoryObj<ConfirmDialogMeta> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Confirm Dialog</Button>
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            alert('Confirmed!');
            setOpen(false);
          }}
          title="Save Changes?"
          description="Are you sure you want to save these changes?"
        />
      </>
    );
  },
};

export const ConfirmDialogDanger: StoryObj<ConfirmDialogMeta> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete Item
        </Button>
        <ConfirmDialog
          open={open}
          onClose={() => {
            setOpen(false);
            setIsDeleting(false);
          }}
          onConfirm={() => {
            setIsDeleting(true);
            setTimeout(() => {
              alert('Deleted!');
              setIsDeleting(false);
              setOpen(false);
            }, 2000);
          }}
          title="Delete Check-in"
          description="This action cannot be undone."
          confirmText="Delete"
          confirmVariant="danger"
          isLoading={isDeleting}
        >
          <Alert type="warning">
            All associated data will be permanently removed.
          </Alert>
        </ConfirmDialog>
      </>
    );
  },
};
