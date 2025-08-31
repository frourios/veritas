import { vi } from 'vitest';

// Mock for opentimestamps module to fix vitest issues
export default {
  DetachedTimestampFile: {
    fromBytes: vi.fn(),
  },
  Ops: {
    OpSHA256: vi.fn(),
  },
  stamp: vi.fn(),
};

export const DetachedTimestampFile = {
  fromBytes: vi.fn(),
};

export const Ops = {
  OpSHA256: vi.fn(),
};

export const stamp = vi.fn();
