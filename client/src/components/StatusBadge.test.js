import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

test('renders status badge with correct text and color', () => {
  render(<StatusBadge status="connected" />);
  
  const badgeElement = screen.getByText(/Terhubung/i);
  expect(badgeElement).toBeInTheDocument();
  
  const colorElement = screen.getByRole('generic', { hidden: true });
  expect(colorElement).toHaveClass('bg-green-500');
});

test('renders unknown status when invalid status provided', () => {
  render(<StatusBadge status="invalid-status" />);
  
  const badgeElement = screen.getByText(/Unknown/i);
  expect(badgeElement).toBeInTheDocument();
});