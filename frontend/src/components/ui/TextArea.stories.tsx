import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TextArea } from './TextArea';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your notes...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Additional Notes',
    placeholder: 'Describe your symptoms...',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Notes',
    value: 'Started feeling headache after lunch. Severity increased over time.',
    rows: 4,
  },
};

export const WithError: Story = {
  args: {
    label: 'Description',
    value: 'Too short',
    error: 'Description must be at least 10 characters',
  },
};

export const WithCharacterCount: Story = {
  args: {
    label: 'Notes',
    maxLength: 200,
    showCharacterCount: true,
    value: 'This textarea shows character count.',
  },
};

export const AutoResize: Story = {
  render: () => {
    const [value, setValue] = useState('Type to see auto-resize...');
    return (
      <TextArea
        label="Auto-resizing TextArea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoResize
        rows={2}
      />
    );
  },
};
