/**
 * RICE scoring calculation:
 * (Reach * Impact * Confidence) / Effort
 * 
 * Clamps effort to minimum 0.1 to avoid division by zero.
 */
export function calculateRiceScore(
  reach: number,
  impact: number,
  confidence: number,
  effort: number,
): number {
  const safeEffort = Math.max(0.1, effort);
  const raw = (reach * impact * confidence) / safeEffort;
  return Math.round(raw * 100) / 100;
}

/**
 * ICE scoring calculation:
 * Impact * Confidence * Ease
 * 
 * If ease is omitted, calculates ease from effort (Ease = max(1, 11 - effort)).
 */
export function calculateIceScore(
  impact: number,
  confidence: number,
  easeOrEffort: number,
  isEffort = true,
): number {
  const ease = isEffort ? Math.max(1, 11 - easeOrEffort) : Math.max(1, easeOrEffort);
  const raw = impact * confidence * ease;
  return Math.round(raw * 100) / 100;
}

export interface TaskNode {
  id: string;
  status: string;
  dependencies: string[];
}

/**
 * Given a list of tasks, returns the tasks that are currently ready to execute:
 * - status must be 'pending'
 * - all IDs in dependencies must have status === 'completed'
 */
export function getExecutableTasks<T extends TaskNode>(tasks: T[]): T[] {
  const statusMap = new Map<string, string>();
  for (const t of tasks) {
    statusMap.set(t.id, t.status);
  }

  return tasks.filter((task) => {
    if (task.status !== 'pending') return false;
    if (!task.dependencies || task.dependencies.length === 0) return true;

    return task.dependencies.every((depId) => statusMap.get(depId) === 'completed');
  });
}
