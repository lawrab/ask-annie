import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Divider } from '../Divider';

describe('Divider', () => {
  describe('Horizontal orientation', () => {
    it('renders horizontal divider by default', () => {
      const { container } = render(<Divider />);
      const divider = container.querySelector('hr');
      expect(divider).toBeInTheDocument();
      expect(divider).toHaveAttribute('role', 'separator');
      expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('renders horizontal divider when explicitly set', () => {
      const { container } = render(<Divider orientation="horizontal" />);
      const divider = container.querySelector('hr');
      expect(divider).toBeInTheDocument();
    });

    it('applies correct styles to horizontal divider', () => {
      const { container } = render(<Divider orientation="horizontal" />);
      const divider = container.querySelector('hr');
      expect(divider).toHaveClass('border-t');
      expect(divider).toHaveClass('border-gray-200');
    });

    it('applies custom className to horizontal divider', () => {
      const { container } = render(
        <Divider orientation="horizontal" className="custom-class" />
      );
      const divider = container.querySelector('hr');
      expect(divider).toHaveClass('custom-class');
    });
  });

  describe('Vertical orientation', () => {
    it('renders vertical divider', () => {
      render(<Divider orientation="vertical" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('applies correct styles to vertical divider', () => {
      const { container } = render(<Divider orientation="vertical" />);
      const divider = container.firstChild as HTMLElement;
      expect(divider).toHaveClass('inline-block');
      expect(divider).toHaveClass('h-full');
      expect(divider).toHaveClass('w-px');
      expect(divider).toHaveClass('bg-gray-200');
    });

    it('applies custom className to vertical divider', () => {
      const { container } = render(
        <Divider orientation="vertical" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders as div element for vertical orientation', () => {
      const { container } = render(<Divider orientation="vertical" />);
      const divider = container.firstChild;
      expect(divider?.nodeName).toBe('DIV');
    });
  });

  describe('Label functionality', () => {
    it('renders horizontal divider with text label', () => {
      render(<Divider label="or" />);
      expect(screen.getByText('or')).toBeInTheDocument();
    });

    it('renders horizontal divider with ReactNode label', () => {
      render(<Divider label={<span data-testid="custom-label">Custom</span>} />);
      expect(screen.getByTestId('custom-label')).toBeInTheDocument();
    });

    it('applies correct structure for labeled divider', () => {
      const { container } = render(<Divider label="or" />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveClass('relative');
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
    });

    it('label has correct styles', () => {
      render(<Divider label="or" />);
      const label = screen.getByText('or');

      expect(label).toHaveClass('px-3');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('text-gray-500');
      expect(label).toHaveClass('bg-white');
    });

    it('labeled divider has lines on both sides', () => {
      const { container } = render(<Divider label="or" />);
      const lines = container.querySelectorAll('.border-t.border-gray-200');

      // Should have 2 lines (one before, one after the label)
      expect(lines.length).toBe(2);
    });

    it('applies custom className to labeled divider wrapper', () => {
      const { container } = render(<Divider label="or" className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has separator role for horizontal divider', () => {
      render(<Divider />);
      const divider = screen.getByRole('separator');
      expect(divider).toBeInTheDocument();
    });

    it('has separator role for vertical divider', () => {
      render(<Divider orientation="vertical" />);
      const divider = screen.getByRole('separator');
      expect(divider).toBeInTheDocument();
    });

    it('has separator role for labeled divider', () => {
      render(<Divider label="or" />);
      const divider = screen.getByRole('separator');
      expect(divider).toBeInTheDocument();
    });

    it('has correct aria-orientation for horizontal', () => {
      render(<Divider orientation="horizontal" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('has correct aria-orientation for vertical', () => {
      render(<Divider orientation="vertical" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('forwards ref correctly for horizontal divider', () => {
      const ref = vi.fn();
      render(<Divider ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });

    it('forwards ref correctly for vertical divider', () => {
      const ref = vi.fn();
      render(<Divider orientation="vertical" ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });

    it('forwards ref correctly for labeled divider', () => {
      const ref = vi.fn();
      render(<Divider label="or" ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Custom props', () => {
    it('forwards additional HTML attributes', () => {
      const { container } = render(<Divider data-testid="custom-divider" />);
      const divider = container.querySelector('[data-testid="custom-divider"]');
      expect(divider).toBeInTheDocument();
    });

    it('forwards additional HTML attributes to vertical divider', () => {
      render(
        <Divider orientation="vertical" data-testid="vertical-divider" />
      );
      expect(screen.getByTestId('vertical-divider')).toBeInTheDocument();
    });

    it('forwards additional HTML attributes to labeled divider', () => {
      render(<Divider label="or" data-testid="labeled-divider" />);
      expect(screen.getByTestId('labeled-divider')).toBeInTheDocument();
    });
  });
});
