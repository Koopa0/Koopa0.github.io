// Learning Path
export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description?: string;
  icon?: string;

  // Structure
  phases: LearningPhase[];

  // Progress
  progress: LearningProgress;

  createdAt: string;
  updatedAt: string;
}

// Learning Phase (e.g., "Basics", "Advanced", "Expert")
export interface LearningPhase {
  id: string;
  title: string;
  description?: string;
  pages: LearningPageRef[];
  order: number;
}

// Reference to a page in learning path
export interface LearningPageRef {
  pageId: string;
  title: string;
  order: number;
  estimatedTime?: number;  // minutes
}

// Learning Progress
export interface LearningProgress {
  completedPageIds: string[];
  currentPageId?: string;
  startedAt?: string;
  lastAccessedAt?: string;
}

// Create/Update Learning Path
export interface CreateLearningPathRequest {
  title: string;
  description?: string;
  icon?: string;
}

export interface UpdateLearningPathRequest {
  title?: string;
  description?: string;
  icon?: string;
  phases?: LearningPhase[];
}

// Helper functions (can be used in services)
export function calculatePhaseProgress(phase: LearningPhase, completedIds: string[]): number {
  if (phase.pages.length === 0) return 0;
  const completed = phase.pages.filter(p => completedIds.includes(p.pageId)).length;
  return Math.round((completed / phase.pages.length) * 100);
}

export function calculateTotalProgress(path: LearningPath): number {
  const totalPages = path.phases.reduce((sum, phase) => sum + phase.pages.length, 0);
  if (totalPages === 0) return 0;
  const completed = path.progress.completedPageIds.length;
  return Math.round((completed / totalPages) * 100);
}
