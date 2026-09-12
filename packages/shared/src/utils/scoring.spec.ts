import { describe, it, expect } from 'vitest';
import {
  calculateRiceScore,
  calculateIceScore,
  getExecutableTasks,
  TaskNode,
} from './scoring';

describe('Scoring Utilities', () => {
  describe('calculateRiceScore', () => {
    it('calculates correct RICE score for standard inputs', () => {
      // Reach: 1000, Impact: 3, Confidence: 0.8, Effort: 2
      // (1000 * 3 * 0.8) / 2 = 2400 / 2 = 1200
      const score = calculateRiceScore(1000, 3, 0.8, 2);
      expect(score).toBe(1200);
    });

    it('prevents division by zero with zero effort', () => {
      const score = calculateRiceScore(5, 5, 0.5, 0);
      expect(score).toBeGreaterThan(0);
      expect(Number.isFinite(score)).toBe(true);
    });
  });

  describe('calculateIceScore', () => {
    it('calculates correct ICE score with effort inverted to ease', () => {
      // Impact: 8, Confidence: 7, Effort: 3 -> Ease = 11 - 3 = 8
      // 8 * 7 * 8 = 448
      const score = calculateIceScore(8, 7, 3, true);
      expect(score).toBe(448);
    });

    it('calculates correct ICE score with direct ease value', () => {
      const score = calculateIceScore(5, 5, 5, false);
      expect(score).toBe(125);
    });
  });

  describe('getExecutableTasks', () => {
    it('returns pending tasks with no dependencies', () => {
      const tasks: TaskNode[] = [
        { id: '1', status: 'pending', dependencies: [] },
        { id: '2', status: 'completed', dependencies: [] },
        { id: '3', status: 'pending', dependencies: ['1'] },
      ];

      const executable = getExecutableTasks(tasks);
      expect(executable.map((t) => t.id)).toEqual(['1']);
    });

    it('returns pending tasks whose dependencies are completed', () => {
      const tasks: TaskNode[] = [
        { id: '1', status: 'completed', dependencies: [] },
        { id: '2', status: 'completed', dependencies: [] },
        { id: '3', status: 'pending', dependencies: ['1', '2'] },
        { id: '4', status: 'pending', dependencies: ['3'] },
      ];

      const executable = getExecutableTasks(tasks);
      expect(executable.map((t) => t.id)).toEqual(['3']);
    });

    it('excludes tasks that are already completed or running', () => {
      const tasks: TaskNode[] = [
        { id: '1', status: 'completed', dependencies: [] },
        { id: '2', status: 'running', dependencies: ['1'] },
      ];

      const executable = getExecutableTasks(tasks);
      expect(executable.length).toBe(0);
    });
  });
});
