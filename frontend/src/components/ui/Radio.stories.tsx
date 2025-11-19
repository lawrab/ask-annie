import type { Meta, StoryObj } from '@storybook/react';
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
  render: () => {
    const [value, setValue] = useState('email');
    return (
      <div className="space-y-4">
        <RadioGroup
          label="Notification preferences"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <Radio label="Email" value="email" />
          <Radio label="SMS" value="sms" />
          <Radio label="Push notifications" value="push" />
        </RadioGroup>
        <p className="text-sm text-gray-600">Selected: {value}</p>
      </div>
    );
  },
};

export const RadioGroupHorizontal: Story = {
  render: () => {
    const [value, setValue] = useState('moderate');
    return (
      <RadioGroup
        label="Severity Level"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        orientation="horizontal"
      >
        <Radio label="Mild" value="mild" />
        <Radio label="Moderate" value="moderate" />
        <Radio label="Severe" value="severe" />
      </RadioGroup>
    );
  },
};
