export interface Course {
  id: string;
  name: string;
  grade: string;
}

export interface Unit {
  id: string;
  courseId: string;
  number: number;
  title: string;
  objectives: string[];
  standards: string[];
}

export interface Lesson {
  id: string;
  unitId: string;
  number: number;
  title: string;
}

export interface Resource {
  id: string;
  lessonId: string;
  type: 'teacher_guide' | 'student_handout' | 'assessment' | 'slides';
  title: string;
  path: string;
  content: string;
  headings: string[];
  metadata?: Record<string, any>;
}

export interface Rubric {
  id: string;
  courseId: string;
  name: string;
  criteria: RubricCriterion[];
}

export interface RubricCriterion {
  name: string;
  description: string;
  levels: {
    score: number;
    description: string;
  }[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface Artifact {
  id: string;
  type: 'document' | 'lesson_plan' | 'assessment' | 'handout';
  title: string;
  content: string;
  externalUrl?: string;
  embedUrl?: string;
  metadata?: {
    course?: string;
    unit?: string;
    lesson?: string;
    adaptedFor?: string;
    standards?: string[];
    sourceFileId?: string;
    sourceFileType?: string;
    [key: string]: any;
  };
}
