import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Radio, RadioGroup } from '.';

const meta = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onChange: undefined,
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Option 1',
    value: 'option1',
  },
};

export const Checked: Story = {
  args: {
    label: 'Selected option',
    value: 'option1',
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled option',
    value: 'option1',
    disabled: true,
  },
};

export const RadioGroupExample: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => {
    const [value, setValue] = useState('email');
    return (
      <div className="space-y-4">
        <RadioGroup label="Notification preferences">
          <Radio
            name="notification"
            label="Email"
            value="email"
            checked={value === 'email'}
            onChange={(e) => setValue(e.target.value)}
          />
          <Radio
            name="notification"
            label="SMS"
            value="sms"
            checked={value === 'sms'}
            onChange={(e) => setValue(e.target.value)}
          />
          <Radio
            name="notification"
            label="Push notifications"
            value="push"
            checked={value === 'push'}
            onChange={(e) => setValue(e.target.value)}
          />
        </RadioGroup>
        <p className="text-sm text-gray-600">Selected: {value}</p>
      </div>
    );
  },
};

export const RadioGroupHorizontal: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => {
    const [value, setValue] = useState('moderate');
    return (
      <RadioGroup label="Severity Level" direction="horizontal">
        <Radio
          name="severity"
          label="Mild"
          value="mild"
          checked={value === 'mild'}
          onChange={(e) => setValue(e.target.value)}
        />
        <Radio
          name="severity"
          label="Moderate"
          value="moderate"
          checked={value === 'moderate'}
          onChange={(e) => setValue(e.target.value)}
        />
        <Radio
          name="severity"
          label="Severe"
          value="severe"
          checked={value === 'severe'}
          onChange={(e) => setValue(e.target.value)}
        />
      </RadioGroup>
    );
  },
};
