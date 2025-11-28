/* eslint-disable storybook/no-renderer-packages */
import type { Meta, StoryObj } from '@storybook/react';
import PostCheckInInsight from './PostCheckInInsight';
import { InsightCard } from '../services/api';

const meta = {
  title: 'Components/PostCheckInInsight',
  component: PostCheckInInsight,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onDismiss: { action: 'dismissed' },
    autoHideDuration: {
      control: { type: 'number', min: 0, max: 30000, step: 1000 },
    },
  },
} as Meta<typeof PostCheckInInsight>;

export default meta;
type Story = StoryObj<typeof meta>;

const dataContextInsight: InsightCard = {
  type: 'data_context',
  title: 'Great Progress!',
  message: 'Your headache severity is lower than usual.\nKeep up the good habits!',
  icon: '📊',
};

const validationInsight: InsightCard = {
  type: 'validation',
  title: 'Check-in Complete',
  message: 'Your symptoms have been recorded successfully.\nYou can view them on your dashboard.',
  icon: '✅',
};

const patternInsight: InsightCard = {
  type: 'pattern',
  title: 'Interesting Pattern',
  message: 'Your headaches tend to occur in the afternoon.\nConsider tracking your screen time.',
  icon: '🔍',
};

const communityInsight: InsightCard = {
  type: 'community',
  title: 'You\'re Not Alone',
  message: 'Many users report similar symptoms.\nJoin our community to share experiences.',
  icon: '👥',
};

/**
 * Data Context insight appears after check-ins and provides context about the user's data.
 * Uses a blue gradient background.
 */
export const DataContext: Story = {
  args: {
    insight: dataContextInsight,
    autoHideDuration: 10000,
  },
};

/**
 * Validation insight confirms successful check-in submission.
 * Uses a green gradient background.
 */
export const Validation: Story = {
  args: {
    insight: validationInsight,
    autoHideDuration: 10000,
  },
};

/**
 * Pattern insight highlights trends and patterns in user data.
 * Uses a purple gradient background.
 */
export const Pattern: Story = {
  args: {
    insight: patternInsight,
    autoHideDuration: 10000,
  },
};

/**
 * Community insight connects users with others having similar experiences.
 * Uses an orange gradient background.
 */
export const Community: Story = {
  args: {
    insight: communityInsight,
    autoHideDuration: 10000,
  },
};

/**
 * No auto-dismiss - user must manually dismiss the insight.
 */
export const NoAutoDismiss: Story = {
  args: {
    insight: dataContextInsight,
    autoHideDuration: 0,
  },
};

/**
 * Fast auto-dismiss for testing (3 seconds).
 */
export const FastAutoDismiss: Story = {
  args: {
    insight: validationInsight,
    autoHideDuration: 3000,
  },
};

/**
 * Single line message without line breaks.
 */
export const SingleLineMessage: Story = {
  args: {
    insight: {
      type: 'validation',
      title: 'Success!',
      message: 'Your check-in has been recorded.',
      icon: '🎉',
    },
    autoHideDuration: 10000,
  },
};

/**
 * Long message with multiple lines.
 */
export const LongMessage: Story = {
  args: {
    insight: {
      type: 'pattern',
      title: 'Important Pattern Detected',
      message:
        'We\'ve noticed your symptoms are more severe on weekdays.\nThis could be related to work stress or screen time.\nConsider taking regular breaks and practicing relaxation techniques.',
      icon: '📈',
    },
    autoHideDuration: 10000,
  },
};
