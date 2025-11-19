import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';

const meta = {
  title: 'Components/Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'or',
  },
};

export const WithCustomLabel: Story = {
  args: {
    label: 'Continue with',
  },
};

export const Vertical: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => (
    <div className="flex items-center h-20">
      <span>Left</span>
      <Divider orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};
