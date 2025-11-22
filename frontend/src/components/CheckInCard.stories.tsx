import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckInCard } from './CheckInCard';
import type { CheckIn } from '../services/api';

// Mock check-in data with various scenarios
const baseCheckIn: CheckIn = {
  _id: 'check-in-1',
  userId: 'user-123',
  timestamp: '2025-11-22T14:30:00.000Z',
  rawTranscript: 'Feeling tired with a headache in my temples',
  structured: {
    symptoms: {
      headache: { severity: 7, location: 'temples' },
      fatigue: { severity: 5 },
    },
    activities: ['walking', 'reading'],
    triggers: ['stress', 'lack of sleep'],
    notes: 'Started after lunch, improving with rest and water',
  },
  flaggedForDoctor: false,
  createdAt: '2025-11-22T14:30:00.000Z',
  updatedAt: '2025-11-22T14:30:00.000Z',
};

const meta = {
  title: 'Components/CheckInCard',
  component: CheckInCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['compact', 'expanded'],
      description: 'Display mode for the card',
    },
    defaultExpanded: {
      control: 'boolean',
      description: 'Initial expanded state (only applies when mode is not set)',
    },
  },
  args: {
    onFlag: () => console.log('Flag toggled'),
    onDelete: () => console.log('Delete clicked'),
    onEdit: () => console.log('Edit clicked'),
  },
} satisfies Meta<typeof CheckInCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Compact Mode Stories
export const CompactDefault: Story = {
  args: {
    checkIn: baseCheckIn,
    mode: 'compact',
  },
};

export const CompactFlagged: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      flaggedForDoctor: true,
    },
    mode: 'compact',
  },
};

export const CompactManySymptoms: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        symptoms: {
          headache: { severity: 8 },
          fatigue: { severity: 6 },
          nausea: { severity: 4 },
          dizziness: { severity: 5 },
          pain: { severity: 7 },
        },
      },
    },
    mode: 'compact',
  },
};

export const CompactLongNotes: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        notes:
          'This is a very long note that should be truncated in compact mode because it exceeds the 60 character limit we set for displaying notes snippets in the compact view',
      },
    },
    mode: 'compact',
  },
};

export const CompactSeverityColors: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        symptoms: {
          mild: { severity: 2 }, // Green (low)
          moderate: { severity: 5 }, // Amber (medium)
          severe: { severity: 9 }, // Red (high)
        },
      },
    },
    mode: 'compact',
  },
};

export const CompactMinimal: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      rawTranscript: undefined,
      structured: {
        symptoms: { headache: { severity: 5 } },
        activities: [],
        triggers: [],
        notes: '',
      },
    },
    mode: 'compact',
  },
};

// Expanded Mode Stories
export const ExpandedDefault: Story = {
  args: {
    checkIn: baseCheckIn,
    mode: 'expanded',
  },
};

export const ExpandedFlagged: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      flaggedForDoctor: true,
    },
    mode: 'expanded',
  },
};

export const ExpandedDetailedSymptoms: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        symptoms: {
          headache: {
            severity: 8,
            location: 'temples and forehead',
            notes: 'Throbbing pain, worse with light',
          },
          fatigue: {
            severity: 6,
            notes: 'Persistent throughout the day',
          },
          nausea: {
            severity: 4,
            location: 'stomach',
          },
        },
      },
    },
    mode: 'expanded',
  },
};

export const ExpandedNoTranscript: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      rawTranscript: undefined,
    },
    mode: 'expanded',
  },
};

export const ExpandedNoActivities: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        activities: [],
      },
    },
    mode: 'expanded',
  },
};

export const ExpandedNoTriggers: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        triggers: [],
      },
    },
    mode: 'expanded',
  },
};

export const ExpandedEmpty: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      rawTranscript: undefined,
      structured: {
        symptoms: {},
        activities: [],
        triggers: [],
        notes: '',
      },
    },
    mode: 'expanded',
  },
};

// Interactive Stories
export const InteractiveCompact: Story = {
  args: {
    checkIn: baseCheckIn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the card to expand and see full details',
      },
    },
  },
};

export const InteractiveExpanded: Story = {
  args: {
    checkIn: baseCheckIn,
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Click "Show less" to collapse the card',
      },
    },
  },
};

// Severity Visualization Examples
export const SeverityLow: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        symptoms: {
          'mild headache': { severity: 1 },
          'slight fatigue': { severity: 2 },
          'minor discomfort': { severity: 3 },
        },
      },
    },
    mode: 'expanded',
  },
  parameters: {
    docs: {
      description: {
        story: 'Low severity (1-3) symptoms display with green badges',
      },
    },
  },
};

export const SeverityMedium: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        symptoms: {
          'moderate headache': { severity: 4 },
          'noticeable fatigue': { severity: 5 },
          'persistent pain': { severity: 7 },
        },
      },
    },
    mode: 'expanded',
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium severity (4-7) symptoms display with amber badges',
      },
    },
  },
};

export const SeverityHigh: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        symptoms: {
          'severe headache': { severity: 8 },
          'extreme fatigue': { severity: 9 },
          'debilitating pain': { severity: 10 },
        },
      },
    },
    mode: 'expanded',
  },
  parameters: {
    docs: {
      description: {
        story: 'High severity (8-10) symptoms display with red badges',
      },
    },
  },
};

// Real-world Scenarios
export const MorningCheckIn: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      timestamp: '2025-11-22T09:15:00.000Z',
      rawTranscript: 'Just woke up, feeling okay but a bit tired',
      structured: {
        symptoms: {
          fatigue: { severity: 4 },
        },
        activities: ['sleeping', 'breakfast'],
        triggers: [],
        notes: 'Slept 7 hours, woke up naturally',
      },
    },
    mode: 'expanded',
  },
};

export const AfternoonCheckIn: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      timestamp: '2025-11-22T15:30:00.000Z',
      rawTranscript: 'Headache getting worse after computer work',
      structured: {
        symptoms: {
          headache: { severity: 7, location: 'temples' },
          'eye strain': { severity: 5 },
        },
        activities: ['computer work', 'lunch'],
        triggers: ['screen time', 'bright lights'],
        notes: 'Started after 3 hours of screen time',
      },
      flaggedForDoctor: true,
    },
    mode: 'expanded',
  },
};

export const EveningCheckIn: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      timestamp: '2025-11-22T21:00:00.000Z',
      rawTranscript: 'Feeling much better after rest',
      structured: {
        symptoms: {
          headache: { severity: 2 },
          fatigue: { severity: 3 },
        },
        activities: ['resting', 'meditation', 'light walk'],
        triggers: [],
        notes: 'Symptoms improved significantly with rest and hydration',
      },
    },
    mode: 'expanded',
  },
};

// Edge Cases
export const SingleSymptom: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        symptoms: {
          headache: { severity: 6 },
        },
        activities: [],
        triggers: [],
        notes: '',
      },
    },
    mode: 'compact',
  },
};

export const MaxSymptoms: Story = {
  args: {
    checkIn: {
      ...baseCheckIn,
      structured: {
        ...baseCheckIn.structured,
        symptoms: {
          headache: { severity: 8 },
          fatigue: { severity: 7 },
          nausea: { severity: 6 },
          dizziness: { severity: 5 },
          pain: { severity: 7 },
          'brain fog': { severity: 6 },
          anxiety: { severity: 4 },
          insomnia: { severity: 5 },
        },
      },
    },
    mode: 'compact',
  },
};

// Without Actions
export const ReadOnly: Story = {
  args: {
    checkIn: baseCheckIn,
    mode: 'expanded',
    onFlag: undefined,
    onDelete: undefined,
    onEdit: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card without any action buttons (read-only mode)',
      },
    },
  },
};
