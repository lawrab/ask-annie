import '@testing-library/jest-dom';

// Mock ResizeObserver for Headless UI components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;
