import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onDismiss: undefined,
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    type: 'success',
    children: 'Check-in saved successfully!',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    children: 'Failed to save check-in. Please try again.',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    children: 'You have unsaved changes.',
  },
};

export const Info: Story = {
  args: {
    type: 'info',
    children: 'Your data is automatically saved.',
  },
};

export const WithTitle: Story = {
  args: {
    type: 'success',
    title: 'Success!',
    children: 'Your check-in has been recorded.',
  },
};

export const Dismissible: Story = {
  args: {
    type: 'info',
    dismissible: true,
    children: 'This alert can be dismissed.',
    onDismiss: undefined,
  },
};

export const AllTypes: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => (
    <div className="space-y-4">
      <Alert type="success">Success alert</Alert>
      <Alert type="error">Error alert</Alert>
      <Alert type="warning">Warning alert</Alert>
      <Alert type="info">Info alert</Alert>
    </div>
  ),
};
