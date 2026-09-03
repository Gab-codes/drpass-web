export interface SyllabusConcept {
  id: string;
  name: string;
  description?: string | null;
}

export interface SyllabusTopic {
  id: string;
  name: string;
  description?: string | null;
  learningObjectives: string[];
  sortOrder: number;
  parentId?: string | null;
  concepts: SyllabusConcept[];
  children: SyllabusTopic[];
}

export interface SyllabusResource {
  id: string;
  title: string;
  author?: string | null;
  publisher?: string | null;
  type: string;
}

export interface SyllabusSubject {
  id: string;
  subjectId: string;
  sourceUrl?: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  topics: SyllabusTopic[];
  resources: SyllabusResource[];
}

export interface Syllabus {
  id: string;
  exam: string;
  year: number;
  status: string;
  syllabusSubjects: SyllabusSubject[];
}
