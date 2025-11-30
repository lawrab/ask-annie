import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup } from '../RadioGroup';
import { Radio } from '../Radio';

describe('RadioGroup', () => {
  describe('Basic rendering', () => {
    it('renders children', () => {
      render(
        <RadioGroup>
          <Radio name="test" value="a" label="Option A" />
          <Radio name="test" value="b" label="Option B" />
        </RadioGroup>
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(2);
    });

    it('renders with label', () => {
      render(
        <RadioGroup label="Select an option">
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('renders required indicator when required', () => {
      render(
        <RadioGroup label="Required field" required>
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByLabelText('required')).toHaveTextContent('*');
    });

    it('does not render required indicator when not required', () => {
      render(
        <RadioGroup label="Optional field">
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.queryByLabelText('required')).not.toBeInTheDocument();
    });
  });

  describe('Direction', () => {
    it('renders vertically by default', () => {
      render(
        <RadioGroup>
          <Radio name="test" value="a" label="Option A" />
          <Radio name="test" value="b" label="Option B" />
        </RadioGroup>
      );

      const group = screen.getByRole('radiogroup');
      expect(group).toHaveClass('space-y-3');
      expect(group).not.toHaveClass('flex-wrap');
    });

    it('renders horizontally when direction is horizontal', () => {
      render(
        <RadioGroup direction="horizontal">
          <Radio name="test" value="a" label="Option A" />
          <Radio name="test" value="b" label="Option B" />
        </RadioGroup>
      );

      const group = screen.getByRole('radiogroup');
      expect(group).toHaveClass('flex', 'flex-wrap', 'gap-4', 'space-y-0');
    });
  });

  describe('Helper text and error', () => {
    it('renders helper text', () => {
      render(
        <RadioGroup helperText="Please select one option">
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByText('Please select one option')).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(
        <RadioGroup error="Please select an option">
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Please select an option');
    });

    it('shows error instead of helper text when both provided', () => {
      render(
        <RadioGroup helperText="Helper" error="Error">
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Error');
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });

    it('sets aria-invalid on group when error is present', () => {
      render(
        <RadioGroup error="Error">
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid to false when no error', () => {
      render(
        <RadioGroup>
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Accessibility', () => {
    it('sets aria-required when required', () => {
      render(
        <RadioGroup required>
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    });

    it('has radiogroup role', () => {
      render(
        <RadioGroup>
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('allows selecting radio options', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <RadioGroup>
          <Radio name="test" value="a" label="Option A" onChange={handleChange} />
          <Radio name="test" value="b" label="Option B" onChange={handleChange} />
        </RadioGroup>
      );

      await user.click(screen.getByLabelText('Option A'));
      expect(handleChange).toHaveBeenCalled();
    });

    it('radio buttons share the same name for grouping', async () => {
      render(
        <RadioGroup>
          <Radio name="test" value="a" label="Option A" />
          <Radio name="test" value="b" label="Option B" />
        </RadioGroup>
      );

      const radios = screen.getAllByRole('radio');
      // Both radios should have the same name attribute for native grouping
      expect(radios[0]).toHaveAttribute('name', 'test');
      expect(radios[1]).toHaveAttribute('name', 'test');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      render(
        <RadioGroup className="custom-class">
          <Radio name="test" value="a" label="Option A" />
        </RadioGroup>
      );

      const container = screen.getByRole('radiogroup').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });
});
