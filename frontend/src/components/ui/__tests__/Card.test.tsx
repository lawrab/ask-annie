import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardHeader, CardBody, CardFooter } from '../Card';

describe('Card', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      render(<Card>Test content</Card>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { container } = render(<Card variant="default">Content</Card>);
      expect(container.firstChild).not.toHaveClass('shadow-md');
      expect(container.firstChild).not.toHaveClass('border');
    });

    it('renders elevated variant with shadow', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-card');
    });

    it('renders outlined variant with border', () => {
      const { container } = render(<Card variant="outlined">Content</Card>);
      expect(container.firstChild).toHaveClass('border');
      expect(container.firstChild).toHaveClass('border-rose/20');
    });

    it('renders interactive variant', () => {
      const { container } = render(<Card variant="interactive">Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-card');
      expect(container.firstChild).toHaveClass('hover:shadow-lifted');
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });
  });

  describe('Padding', () => {
    it('renders with no padding', () => {
      const { container } = render(<Card padding="none">Content</Card>);
      expect(container.firstChild).not.toHaveClass('p-4');
      expect(container.firstChild).not.toHaveClass('p-6');
      expect(container.firstChild).not.toHaveClass('p-8');
    });

    it('renders with compact padding', () => {
      const { container } = render(<Card padding="compact">Content</Card>);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('renders with default padding', () => {
      const { container } = render(<Card padding="default">Content</Card>);
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('renders with spacious padding', () => {
      const { container } = render(<Card padding="spacious">Content</Card>);
      expect(container.firstChild).toHaveClass('p-8');
    });
  });

  describe('Interactive behavior', () => {
    it('makes card interactive when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Content</Card>);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('makes card interactive when interactive prop is true', () => {
      render(<Card interactive>Content</Card>);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('calls onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Space key is pressed', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not have button role when not interactive', () => {
      render(<Card>Content</Card>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Subcomponents', () => {
    it('renders with CardHeader', () => {
      render(
        <Card>
          <Card.Header>Header content</Card.Header>
        </Card>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('renders with CardBody', () => {
      render(
        <Card>
          <Card.Body>Body content</Card.Body>
        </Card>
      );
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('renders with CardFooter', () => {
      render(
        <Card>
          <Card.Footer>Footer content</Card.Footer>
        </Card>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('renders complete card with all subcomponents', () => {
      render(
        <Card>
          <Card.Header>Header</Card.Header>
          <Card.Body>Body</Card.Body>
          <Card.Footer>Footer</Card.Footer>
        </Card>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('applies custom className to CardHeader', () => {
      const { container } = render(
        <CardHeader className="custom-header">Header</CardHeader>
      );
      expect(container.firstChild).toHaveClass('custom-header');
    });

    it('applies custom className to CardBody', () => {
      const { container } = render(
        <CardBody className="custom-body">Body</CardBody>
      );
      expect(container.firstChild).toHaveClass('custom-body');
    });

    it('applies custom className to CardFooter', () => {
      const { container } = render(
        <CardFooter className="custom-footer">Footer</CardFooter>
      );
      expect(container.firstChild).toHaveClass('custom-footer');
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles when interactive', () => {
      const { container } = render(<Card interactive>Content</Card>);
      expect(container.firstChild).toHaveClass('focus:outline-none');
      expect(container.firstChild).toHaveClass('focus:ring-2');
      expect(container.firstChild).toHaveClass('focus:ring-sage');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Card ref={ref}>Content</Card>);
      expect(ref).toHaveBeenCalled();
    });
  });
});
