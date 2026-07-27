export type EditionSlot = "am" | "pm";

export type Edition = {
  id: string;
  date: string;
  slot: EditionSlot;
  topic: string;
  title: string;
  prompt: string;
  constraints: unknown;
  tasks: unknown;
  rubric: unknown;
  followUpProbes: unknown;
  referenceOutline: string;
  pairedEditionId: string | null;
  generatedAt: Date;
};
