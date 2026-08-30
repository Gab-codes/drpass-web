export interface Programme {
  id: string;
  name: string;
  faculty: string;
}

export interface Subject {
  id: string;
  name: string;
}

export type SubjectRecommendationMap = Record<string, string[]>;
