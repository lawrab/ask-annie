import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Card Title</h3>
      </CardHeader>
      <CardBody>
        <p>This is the card content.</p>
      </CardBody>
    </Card>
  ),
};

export const WithFooter: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Check-in Details</h3>
        <Badge variant="success">Complete</Badge>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-gray-600">Headache severity: 7/10</p>
        <p className="text-sm text-gray-600 mt-2">Notes: Started after lunch...</p>
      </CardBody>
      <CardFooter>
        <Button variant="tertiary">Edit</Button>
        <Button variant="danger">Delete</Button>
      </CardFooter>
    </Card>
  ),
};

export const Elevated: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => (
    <Card variant="elevated">
      <CardBody>
        <p>Elevated card with shadow</p>
      </CardBody>
    </Card>
  ),
};

export const Outlined: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => (
    <Card variant="outlined">
      <CardBody>
        <p>Outlined card with border</p>
      </CardBody>
    </Card>
  ),
};

export const Interactive: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => (
    <Card variant="interactive" onClick={() => alert('Card clicked!')}>
      <CardBody>
        <p>Click me! I&apos;m interactive</p>
      </CardBody>
    </Card>
  ),
};

export const AllVariants: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: undefined as any,
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card variant="default">
        <CardBody>Default</CardBody>
      </Card>
      <Card variant="elevated">
        <CardBody>Elevated</CardBody>
      </Card>
      <Card variant="outlined">
        <CardBody>Outlined</CardBody>
      </Card>
      <Card variant="interactive">
        <CardBody>Interactive</CardBody>
      </Card>
    </div>
  ),
};
