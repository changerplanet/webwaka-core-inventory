import { describe, it, expect } from 'vitest';
import { VERSION } from './index';

describe('webwaka-core-inventory', () => {
  it('should export version', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
