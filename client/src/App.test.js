import { render, screen } from '@testing-library/react';
import App from './App';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  return {
    io: () => ({
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    }),
  };
});

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

test('renders WhatsApp API Dashboard title', () => {
  render(<App />);
  const titleElement = screen.getByText(/WhatsApp API Dashboard/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders main sections', () => {
  render(<App />);
  
  // Check if main components are rendered
  const sendMessageSection = screen.getByText(/Kirim Pesan/i);
  const webhookSection = screen.getByText(/Manajemen Webhook/i);
  const messageLogSection = screen.getByText(/Log Pesan Masuk/i);
  
  expect(sendMessageSection).toBeInTheDocument();
  expect(webhookSection).toBeInTheDocument();
  expect(messageLogSection).toBeInTheDocument();
});
