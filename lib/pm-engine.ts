export type Stage =
  | "intake"
  | "discovery"
  | "evidence"
  | "problem"
  | "analysis"
  | "solutions"
  | "rice"
  | "plan";
export type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  refinedContent?: string;
};
export type ProblemBrief = {
  title: string;
  targetUsers: string;
  problem: string;
  currentBehavior: string;
  desiredOutcome: string;
  businessImpact: string;
  evidence: string[];
  assumptions: string[];
  constraints: string[];
  successCriteria: string[];
};
export type Solution = {
  id: string;
  name: string;
  description: string;
  impact: string;
  effort: string;
  risks: string[];
};
export type FileSummary = {
  rows: number;
  columns: string[];
  preview: string[][];
  warnings: string[];
  dataQualityScore: number;
  profiles: ColumnProfile[];
};
export type ColumnProfile = {
  name: string;
  type: "identifier" | "numeric" | "date" | "boolean" | "category" | "text";
  missingPercent: number;
  uniqueCount: number;
  mean?: number;
  min?: number;
  max?: number;
  topValues?: { value: string; count: number; percent: number }[];
};
export type Analysis = {
  finding: string;
  observations: string[];
  causes: string[];
  gaps: string[];
};
export type Rice = {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  score: number;
};
export type Plan = {
  northStar: string;
  hypothesis: string;
  primaryMetric: string;
  guardrails: string[];
  successRule: string;
  mvp: string[];
  okrs: string[];
};
export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  stage: Stage;
  applicationName?: string;
  requestType?: "Requirement" | "Problem" | "Feature update";
  messages: Message[];
  aiMode?: "configured" | "gemini" | "practice";
  rawRequest?: string;
  evidenceNotes: string;
  fileName?: string;
  fileSummary?: FileSummary;
  problem?: ProblemBrief;
  analysis?: Analysis;
  solutions?: Solution[];
  selectedSolutionId?: string;
  selectedSolutionIds?: string[];
  rice?: Rice;
  plan?: Plan;
};

export const stages: { id: Stage; label: string }[] = [
  { id: "intake", label: "Setup" },
  { id: "discovery", label: "Discovery" },
  { id: "evidence", label: "Evidence" },
  { id: "problem", label: "Problem" },
  { id: "analysis", label: "Analysis" },
  { id: "solutions", label: "Solutions" },
  { id: "rice", label: "RICE" },
  { id: "plan", label: "Product plan" },
];
const questions = [
  (r: string) =>
    `Who is most affected by “${r}”? Describe the user or segment you want us to focus on.`,
  () =>
    "What happens today for this user, and where exactly does the experience break down?",
  () =>
    "What should become easier or better for the user if we solve this well?",
  () =>
    "What business result should this create—for example engagement, retention, revenue, adoption, or competitive differentiation?",
  () =>
    "What evidence do you have today—usage data, feedback, complaints, interviews, or is this still an assumption?",
  () =>
    "Are there any timeline, technical, policy, budget, or scope constraints we must respect?",
];
export function newProject(): Project {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Untitled request",
    createdAt: now,
    updatedAt: now,
    stage: "intake",
    evidenceNotes: "",
    messages: [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Share a requirement, user problem, feature update, or business goal. It can be vague—I’ll clarify it with you before suggesting solutions.",
      },
    ],
  };
}
export function mockDiscoveryReply(project: Project, userText: string) {
  const count = project.messages.filter((m) => m.role === "user").length + 1;
  if (count === 1) return { message: questions[0](userText), ready: false };
  if (count <= questions.length)
    return {
      message: `That helps. ${questions[count - 1](project.rawRequest || "this request")}`,
      ready: false,
    };
  return {
    message:
      "I have enough context now. I’m moving us to evidence collection so we can separate what we know from what we still need to validate.",
    ready: true,
  };
}

/**
 * Makes short discovery answers self-contained for later PM documents.
 * The original answer remains visible in chat; this version is used only by
 * the problem brief and generated documents.
 */
export function contextualAnswerRefinement(
  messages: Message[],
  answer: string,
): string {
  const clean = answer.trim();
  const lower = clean.toLowerCase().replace(/[.!?]+$/, "");
  const question =
    [...messages].reverse().find((message) => message.role === "assistant")
      ?.content.toLowerCase() || "";

  if (lower === "both" && (question.includes("gender") || (question.includes("male") && question.includes("female")))) {
    return "The target audience includes both male and female users.";
  }
  if (lower === "all" && (question.includes("gender") || question.includes("user segment"))) {
    return "The target audience includes all relevant user segments.";
  }
  if (lower === "none" && question.includes("constraint")) {
    return "No specific constraints have been identified at this stage.";
  }
  if (lower === "no" && question.includes("evidence")) {
    return "No supporting evidence is currently available, so this should be treated as an assumption requiring validation.";
  }
  // Gemini handles nuanced answers. These safe rules keep common one-word
  // answers useful even if the API is unavailable or times out.
  if (clean.split(/\s+/).length <= 4) {
    const value = clean.replace(/^./, (character) => character.toUpperCase()).replace(/[.!?]+$/, "");
    if (/market|geograph|country|region/.test(question)) return `The initial target market is ${value}.`;
    if (/gender/.test(question)) return `The target gender segment is ${value}.`;
    if (/timeline|deadline|when/.test(question)) return `The target timeline is ${value}.`;
    if (/platform|device|channel/.test(question)) return `The primary platform or channel is ${value}.`;
    if (/who|target user|user segment|audience/.test(question)) return `The target user segment is ${value}.`;
  }

  return clean;
}
export function buildProblem(project: Project): ProblemBrief {
  const a = project.messages
    .filter((m) => m.role === "user")
    .map((m) => m.refinedContent || m.content);
  return {
    title: (project.rawRequest || "Product opportunity").slice(0, 90),
    targetUsers: a[1] || "Target segment to be confirmed",
    problem: a[2] || project.rawRequest || "Problem to be confirmed",
    currentBehavior: a[2] || "Current behaviour requires validation",
    desiredOutcome: a[3] || "Desired user outcome to be confirmed",
    businessImpact: a[4] || "Business impact to be quantified",
    evidence: [a[5], project.evidenceNotes].filter(Boolean),
    assumptions: a[5] ? [] : ["The request is currently assumption-led"],
    constraints: a[6] ? [a[6]] : [],
    successCriteria: [
      "Agree on a measurable baseline",
      "Validate improvement with the target user segment",
    ],
  };
}
export function buildAnalysis(p: Project): Analysis {
  const b = p.problem!;
  const profile = p.fileSummary;
  const numericInsights =
    profile?.profiles
      .filter((column) => column.type === "numeric" && column.mean !== undefined)
      .slice(0, 2)
      .map(
        (column) =>
          `${column.name} averages ${column.mean?.toLocaleString()} (range ${column.min?.toLocaleString()}–${column.max?.toLocaleString()}).`,
      ) || [];
  const categoryInsights =
    profile?.profiles
      .filter((column) => column.topValues?.length)
      .slice(0, 2)
      .map((column) => {
        const top = column.topValues?.[0];
        return `${column.name} is led by “${top?.value}” at ${top?.percent}% of non-blank rows.`;
      }) || [];
  return {
    finding: `The strongest opportunity is to reduce the gap between the current experience and the desired outcome for ${b.targetUsers}.`,
    observations: [
      ...(profile
        ? [
            `The uploaded dataset contains ${profile.rows.toLocaleString()} rows across ${profile.columns.length} columns with a ${profile.dataQualityScore}% completeness score.`,
          ]
        : []),
      ...numericInsights,
      ...categoryInsights,
      `The current behaviour is: ${b.currentBehavior}`,
      b.evidence.length
        ? `The brief includes ${b.evidence.length} evidence source${b.evidence.length > 1 ? "s" : ""}.`
        : "No supporting evidence has been supplied yet.",
      `Success depends on: ${b.successCriteria[0].toLowerCase()}.`,
    ],
    causes: [
      "The critical journey may contain avoidable friction",
      "The current experience may not match the segment’s core job",
      "The team may lack a reliable feedback or measurement loop",
    ],
    gaps: [
      "Baseline funnel or behaviour metric",
      "Segment-level qualitative feedback",
      "Technical feasibility and dependency assessment",
    ],
  };
}
export function buildSolutions(p: Project): Solution[] {
  const o = p.problem?.desiredOutcome || "the desired outcome";
  return [
    {
      id: "guided",
      name: "Direct experience improvement",
      description: `Improve the specific journey described in the approved problem so the target users can achieve this outcome: ${o}`,
      impact: "High",
      effort: "Medium",
      risks: ["May add clutter", "Needs usability validation"],
    },
    {
      id: "signal",
      name: "Evidence-led intervention",
      description:
        "Use the connected dataset and supplied evidence to identify the highest-impact segment and deliver a relevant intervention at the point of friction.",
      impact: "High",
      effort: "High",
      risks: ["Signal quality", "Privacy and relevance"],
    },
    {
      id: "lean",
      name: "Focused MVP experiment",
      description:
        "Test the smallest version of the proposed improvement with the target segment, measure the agreed outcome, and expand only after validating the result.",
      impact: "Medium",
      effort: "Low",
      risks: ["May treat a symptom", "Requires clean instrumentation"],
    },
  ];
}
export function buildPlan(p: Project): Plan {
  const s = p.solutions?.find((x) => x.id === p.selectedSolutionId)!;
  return {
    northStar: "Successful completion rate for the target user journey",
    hypothesis: `If we introduce ${s.name.toLowerCase()}, then more target users will complete the critical journey because the main source of friction is reduced.`,
    primaryMetric: "Journey completion rate",
    guardrails: [
      "Error rate",
      "Time to complete",
      "Support contacts",
      "User-reported confusion",
    ],
    successRule:
      "Ship only if the primary metric improves meaningfully without worsening any guardrail.",
    mvp: [
      "Instrument the baseline journey",
      `Build the smallest testable version of ${s.name}`,
      "Run with one target segment",
      "Review evidence and decide expand, iterate, or stop",
    ],
    okrs: [
      "Objective: Improve the target user’s critical journey",
      "KR1: Establish a trusted baseline",
      "KR2: Improve journey completion in the pilot",
      "KR3: Keep all guardrails within agreed limits",
    ],
  };
}
export function parseCsv(text: string): FileSummary {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const split = (line: string) =>
    line
      .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
      .map((v) => v.replace(/^\"|\"$/g, "").trim());
  const rows = lines.map(split),
    columns = rows[0] || [];
  const dataRows = rows.slice(1);
  const profiles: ColumnProfile[] = columns.map((col, i) => {
    const values = dataRows.map((row) => row[i] ?? "");
    const nonBlank = values.filter((value) => value !== "");
    const blanks = values.length - nonBlank.length;
    const missingPercent = values.length
      ? Math.round((blanks / values.length) * 100)
      : 0;
    const unique = new Set(nonBlank);
    const normalised = new Set(nonBlank.map((value) => value.toLowerCase()));
    const nameSuggestsId = /(^id$|_id$|id_|identifier|uuid|code$)/i.test(col);
    const booleanValues = new Set(["true", "false", "yes", "no", "0", "1"]);
    const isBoolean =
      normalised.size > 0 &&
      normalised.size <= 4 &&
      [...normalised].every((value) => booleanValues.has(value));
    const numericValues = nonBlank.map(Number);
    const isNumeric =
      nonBlank.length > 0 &&
      numericValues.filter(Number.isFinite).length / nonBlank.length >= 0.9;
    const dateValues = nonBlank.map((value) => Date.parse(value));
    const isDate =
      /(date|time|created|updated|timestamp)/i.test(col) &&
      nonBlank.length > 0 &&
      dateValues.filter(Number.isFinite).length / nonBlank.length >= 0.8;
    const uniqueRatio = nonBlank.length ? unique.size / nonBlank.length : 0;
    let type: ColumnProfile["type"] = "text";
    if (nameSuggestsId || (uniqueRatio > 0.95 && unique.size > 10)) type = "identifier";
    else if (isBoolean) type = "boolean";
    else if (isDate) type = "date";
    else if (isNumeric) type = "numeric";
    else if (unique.size <= Math.min(30, Math.max(8, nonBlank.length * 0.3)))
      type = "category";
    const counts = new Map<string, number>();
    nonBlank.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    const topValues =
      type === "category" || type === "boolean"
        ? [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([value, count]) => ({
              value,
              count,
              percent: nonBlank.length
                ? Math.round((count / nonBlank.length) * 100)
                : 0,
            }))
        : undefined;
    const validNumbers = numericValues.filter(Number.isFinite);
    return {
      name: col,
      type,
      missingPercent,
      uniqueCount: unique.size,
      ...(type === "numeric" && validNumbers.length
        ? {
            mean: Number(
              (validNumbers.reduce((sum, value) => sum + value, 0) / validNumbers.length).toFixed(2),
            ),
            min: Math.min(...validNumbers),
            max: Math.max(...validNumbers),
          }
        : {}),
      ...(topValues ? { topValues } : {}),
    };
  });
  const warnings = profiles.flatMap((profile) => {
    const col = profile.name,
      pct = profile.missingPercent;
    return pct > 30
      ? [
          `${col} is blank in ${pct}% of rows. Analysis using this field will exclude those rows.`,
        ]
      : [];
  });
  const dataQualityScore = profiles.length
    ? Math.round(
        profiles.reduce((sum, profile) => sum + (100 - profile.missingPercent), 0) /
          profiles.length,
      )
    : 0;
  return {
    rows: Math.max(0, rows.length - 1),
    columns,
    preview: rows.slice(1, 6),
    warnings,
    dataQualityScore,
    profiles,
  };
}
