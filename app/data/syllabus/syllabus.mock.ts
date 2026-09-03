import type { Syllabus } from "./syllabus.types";

export const getMockSyllabus = (): Syllabus => {
  return {
    id: "syl_123456789",
    exam: "JAMB UTME",
    year: 2027,
    status: "ACTIVE",
    syllabusSubjects: [
      {
        id: "ss_math",
        subjectId: "sub_math",
        subject: {
          id: "sub_math",
          name: "Mathematics",
          code: "MAT",
        },
        resources: [
          {
            id: "res_m1",
            title: "New General Mathematics for Senior Secondary Schools",
            author: "M.F. Macrae et al.",
            type: "TEXTBOOK",
          },
        ],
        topics: [
          {
            id: "top_m1",
            name: "Number Bases",
            description: "Operations and conversions in different number bases.",
            learningObjectives: [
              "Perform basic operations (addition, subtraction, multiplication, and division) in different number bases.",
              "Convert numbers from one base to another.",
            ],
            sortOrder: 1,
            parentId: null,
            concepts: [
              { id: "con_m1", name: "Number Base Conversion" },
              { id: "con_m2", name: "Arithmetic in Base N" },
            ],
            children: [],
          },
          {
            id: "top_m2",
            name: "Algebra",
            description: "Algebraic expressions, equations, and inequalities.",
            learningObjectives: [
              "Solve problems involving quadratic equations.",
              "Solve simultaneous linear and quadratic equations.",
            ],
            sortOrder: 2,
            parentId: null,
            concepts: [],
            children: [
              {
                id: "top_m2_1",
                name: "Quadratic Equations",
                learningObjectives: ["Find the roots of quadratic equations by factorization and formula methods."],
                sortOrder: 1,
                parentId: "top_m2",
                concepts: [{ id: "con_m3", name: "Factorization Method" }, { id: "con_m4", name: "Quadratic Formula" }],
                children: [],
              },
              {
                id: "top_m2_2",
                name: "Simultaneous Equations",
                description: "Systems of linear and non-linear equations.",
                learningObjectives: ["Solve simultaneous equations where one is linear and the other is quadratic."],
                sortOrder: 2,
                parentId: "top_m2",
                concepts: [],
                children: [],
              }
            ],
          },
          {
            id: "top_m3",
            name: "Calculus",
            description: "Limits, differentiation, and integration.",
            learningObjectives: ["Understand the concept of limits and continuous functions.", "Find the derivative of simple functions.", "Perform indefinite and definite integrations."],
            sortOrder: 3,
            parentId: null,
            concepts: [],
            children: [
              {
                id: "top_m3_1",
                name: "Differentiation",
                learningObjectives: ["Differentiate polynomials and trigonometric functions."],
                sortOrder: 1,
                parentId: "top_m3",
                concepts: [{ id: "con_m5", name: "Power Rule" }, { id: "con_m6", name: "Chain Rule" }],
                children: [],
              },
              {
                id: "top_m3_2",
                name: "Integration",
                learningObjectives: ["Integrate simple functions.", "Evaluate definite integrals to find areas."],
                sortOrder: 2,
                parentId: "top_m3",
                concepts: [{ id: "con_m7", name: "Definite Integral" }],
                children: [],
              }
            ],
          }
        ],
      },
      {
        id: "ss_bio",
        subjectId: "sub_bio",
        subject: {
          id: "sub_bio",
          name: "Biology",
          code: "BIO",
        },
        resources: [
          {
            id: "res_b1",
            title: "Modern Biology for Senior Secondary Schools",
            author: "Ramalingam, S.T.",
            type: "TEXTBOOK",
          },
        ],
        topics: [
          {
            id: "top_b1",
            name: "Living Organisms",
            description: "Characteristics, classification, and organization of living things.",
            learningObjectives: [
              "Identify the characteristics of living organisms.",
              "Classify living organisms into kingdoms, phyla/divisions, classes, etc.",
            ],
            sortOrder: 1,
            parentId: null,
            concepts: [
              { id: "con_b1", name: "Characteristics of Living Things" },
              { id: "con_b2", name: "Binomial Nomenclature" }
            ],
            children: [
               {
                id: "top_b1_1",
                name: "Cell Structure and Functions",
                learningObjectives: ["Identify the different parts of a plant and animal cell and their functions."],
                sortOrder: 1,
                parentId: "top_b1",
                concepts: [{ id: "con_b3", name: "Organelles" }, { id: "con_b4", name: "Cell Division (Mitosis & Meiosis)" }],
                children: [],
              }
            ],
          },
          {
            id: "top_b2",
            name: "Heredity and Variations",
            description: "Principles of genetics and variation among living organisms.",
            learningObjectives: [
              "Understand Mendel's laws of inheritance.",
              "Explain the role of chromosomes and genes in heredity.",
            ],
            sortOrder: 2,
            parentId: null,
            concepts: [
              { id: "con_b5", name: "Mendelian Genetics" },
              { id: "con_b6", name: "DNA Structure" }
            ],
            children: [],
          }
        ],
      },
      {
        id: "ss_chem",
        subjectId: "sub_chem",
        subject: {
          id: "sub_chem",
          name: "Chemistry",
          code: "CHM",
        },
        resources: [],
        topics: [
          {
            id: "top_c1",
            name: "Separation of Mixtures and Purification of Chemical Substances",
            description: "Methods for separating mixtures and purifying substances.",
            learningObjectives: [
              "Distinguish between pure and impure substances.",
              "Apply different methods of separation to various mixtures.",
            ],
            sortOrder: 1,
            parentId: null,
            concepts: [{ id: "con_c1", name: "Distillation" }, { id: "con_c2", name: "Chromatography" }],
            children: [],
          },
          {
            id: "top_c2",
            name: "Atomic Structure and Bonding",
            description: "The concept of atoms, molecules, and chemical bonding.",
            learningObjectives: [
              "Describe the structure of the atom.",
              "Explain the different types of chemical bonds.",
            ],
            sortOrder: 2,
            parentId: null,
            concepts: [],
            children: [
              {
                id: "top_c2_1",
                name: "Atomic Models",
                description: "Historical models of the atom.",
                learningObjectives: ["Outline the discoveries that led to the modern atomic theory."],
                sortOrder: 1,
                parentId: "top_c2",
                concepts: [{ id: "con_c3", name: "Bohr Model" }],
                children: []
              }
            ],
          }
        ],
      },
      {
        id: "ss_phy",
        subjectId: "sub_phy",
        subject: {
          id: "sub_phy",
          name: "Physics",
          code: "PHY",
        },
        resources: [],
        topics: [
          {
            id: "top_p1",
            name: "Measurements and Units",
            description: "Fundamental and derived physical quantities and units.",
            learningObjectives: [
              "Differentiate between fundamental and derived quantities.",
              "Use appropriate measuring instruments and read them accurately.",
            ],
            sortOrder: 1,
            parentId: null,
            concepts: [],
            children: [],
          }
        ],
      }
    ],
  };
};
