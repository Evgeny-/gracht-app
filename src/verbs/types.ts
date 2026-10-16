export type VerbExample = { dutch: string; english: string };

export type VerbGroup = { id: string; title: string; description: string };
export type VerbSource = { id: string; title: string; url: string };

export type IrregularVerb = {
  id: string;
  infinitive: string;
  english: string;
  groupId: string;
  priority: number;
  present: { ik: string; wij: string };
  past: { singular: string; plural: string };
  perfect: { auxiliary: 'hebben' | 'zijn'; participle: string; note?: string };
  examples: {
    present: VerbExample;
    pastSingular: VerbExample;
    pastPlural: VerbExample;
    perfect: VerbExample;
  };
  note?: string;
};
