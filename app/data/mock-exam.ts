export interface Option {
  id: string;
  label: "A" | "B" | "C" | "D";
  text: string;
}

export interface Question {
  id: string;
  subject: string;
  text: string;
  options: Option[];
}

export interface ExamConfig {
  subjects: string[];
  questionsPerSubject: number;
  totalTimeMinutes: number;
}

export const MOCK_SUBJECTS = [
  { id: "english", name: "Use of English" },
  { id: "maths", name: "Mathematics" },
  { id: "physics", name: "Physics" },
  { id: "chemistry", name: "Chemistry" },
  { id: "biology", name: "Biology" },
];

export const MOCK_QUESTIONS: Record<string, Question[]> = {
  english: [
    {
      id: "eng-1",
      subject: "Use of English",
      text: "Choose the option that best completes the sentence: The principal, together with the teachers, _______ present at the meeting.",
      options: [
        { id: "opt-e1-a", label: "A", text: "was" },
        { id: "opt-e1-b", label: "B", text: "were" },
        { id: "opt-e1-c", label: "C", text: "are" },
        { id: "opt-e1-d", label: "D", text: "have been" },
      ],
    },
    {
      id: "eng-2",
      subject: "Use of English",
      text: "Identify the word that has the same vowel sound as the one represented by the underlined letter: wOmen.",
      options: [
        { id: "opt-e2-a", label: "A", text: "weed" },
        { id: "opt-e2-b", label: "B", text: "won" },
        { id: "opt-e2-c", label: "C", text: "women" },
        { id: "opt-e2-d", label: "D", text: "whip" },
      ],
    },
  ],
  maths: [
    {
      id: "mat-1",
      subject: "Mathematics",
      text: "If 2x + 3 = 9, what is the value of x?",
      options: [
        { id: "opt-m1-a", label: "A", text: "2" },
        { id: "opt-m1-b", label: "B", text: "3" },
        { id: "opt-m1-c", label: "C", text: "4" },
        { id: "opt-m1-d", label: "D", text: "6" },
      ],
    },
    {
      id: "mat-2",
      subject: "Mathematics",
      text: "Calculate the area of a circle with radius 7cm (Take π = 22/7).",
      options: [
        { id: "opt-m2-a", label: "A", text: "44 cm²" },
        { id: "opt-m2-b", label: "B", text: "154 cm²" },
        { id: "opt-m2-c", label: "C", text: "144 cm²" },
        { id: "opt-m2-d", label: "D", text: "22 cm²" },
      ],
    },
  ],
  physics: [
    {
      id: "phy-1",
      subject: "Physics",
      text: "Which of the following is a scalar quantity?",
      options: [
        { id: "opt-p1-a", label: "A", text: "Velocity" },
        { id: "opt-p1-b", label: "B", text: "Force" },
        { id: "opt-p1-c", label: "C", text: "Acceleration" },
        { id: "opt-p1-d", label: "D", text: "Speed" },
      ],
    },
  ],
};

export function generateMockExam(config: ExamConfig): Question[] {
  const selectedQuestions: Question[] = [];
  
  for (const subjectId of config.subjects) {
    const subjectQuestions = MOCK_QUESTIONS[subjectId] || [];
    // Just take the required number, pad with duplicates if necessary for testing UI
    let toAdd = config.questionsPerSubject;
    let i = 0;
    while (toAdd > 0 && subjectQuestions.length > 0) {
      selectedQuestions.push({
        ...subjectQuestions[i % subjectQuestions.length],
        id: `${subjectId}-${toAdd}-${i}`, // unique ID
      });
      toAdd--;
      i++;
    }
  }
  
  return selectedQuestions;
}
