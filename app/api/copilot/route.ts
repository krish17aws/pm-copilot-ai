import { NextRequest, NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  });
}
export async function POST(req: NextRequest) {
  const body = await req.json(),
    project = body.project;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ fallback: true, mode: "practice" });
  let prompt: string;
  if (body.mode === "brief") {
    prompt = `You are a senior Product Manager. Convert the complete discovery conversation into a precise problem brief. Refine blunt answers into professional, self-contained language without changing their intent or inventing facts. Keep these concepts distinct: desiredOutcome describes the improvement experienced by the USER; businessImpact describes the measurable value for the BUSINESS. The problem must state the current user difficulty, not merely repeat a requested feature. Preserve every explicitly requested capability, including technologies such as AR, and label unsupported claims as assumptions.

Return only JSON matching {"problem":{"title":"string","targetUsers":"string","problem":"string","currentBehavior":"string","desiredOutcome":"string","businessImpact":"string","evidence":["string"],"assumptions":["string"],"constraints":["string"],"successCriteria":["string"]}}.
Application: ${project.applicationName}
Request type: ${project.requestType}
Uploaded CSV summary: ${JSON.stringify(project.fileSummary)}
Qualitative evidence: ${project.evidenceNotes || "None supplied"}
Conversation: ${JSON.stringify(project.messages)}`;
  } else if (body.mode === "solutions") {
    prompt = `You are a senior Product Manager facilitating solution discovery. Generate exactly three distinct, actionable recommendations grounded in the approved problem brief, analysis, request, and evidence. Every recommendation must explicitly address the main requested capability; if AR or Augmented Reality was requested, AR must appear in the recommendation name or description. Do not return generic templates. Include one direct solution, one complementary or monetisation-aware solution when relevant, and one phased MVP/pilot. Advertising must be clearly labelled and must not compromise core navigation or user trust.

Return only JSON matching {"solutions":[{"id":"short-kebab-case","name":"string","description":"string","impact":"High|Medium|Low","effort":"High|Medium|Low","risks":["string","string"]}]}.
Initial request: ${project.rawRequest}
Approved problem: ${JSON.stringify(project.problem)}
Analysis: ${JSON.stringify(project.analysis)}
Dataset summary: ${JSON.stringify(project.fileSummary)}`;
  } else {
    prompt = `You are a senior product discovery partner and careful PM editor. Continue this PM discovery conversation. Ask exactly ONE concise contextual follow-up question based on the application, request type, uploaded dataset and previous answers. Never display confidence, never propose solutions, and never repeat answered questions. Collect SIX separate inputs: target user, current problem or behaviour, desired USER outcome, BUSINESS impact, evidence, and constraints. Ask separately for the desired user outcome and business impact; never combine them in one question. Do not set ready=true until all six inputs have been explicitly answered. When all six are sufficiently clear, set ready=true and do not ask another question; say you are moving to evidence analysis.

Also refine ONLY the latest user answer into clear, professional PM language. Use the immediately preceding assistant question to resolve contextual shorthand and make the refined answer self-contained for downstream documents. For example, if the question asks which gender to target (male, female, or both) and the user answers "both", refine it to "The target audience includes both male and female users." If a market question is answered "India", refine it to "The initial target market is India." Do not leave context-dependent words such as "both", "it", "this", or "they" without naming what they refer to.

Preserve the user's exact logic, intent, certainty, scope, and facts. Correct grammar and structure, but NEVER invent a metric, user segment, cause, constraint, evidence, conclusion, or commitment. Use information from the question only to expand what the user's shorthand clearly refers to. If the meaning is ambiguous, retain the wording and ask a clarification question instead of guessing. If the answer is already clear, retain it with minimal editing.

Return only JSON matching {"message":"string","ready":boolean,"refinedAnswer":"string"}.
Application: ${project.applicationName}
Request type: ${project.requestType}
Uploaded CSV: ${project.fileName}
Dataset summary: ${JSON.stringify(project.fileSummary)}
Initial request: ${project.rawRequest}
Conversation: ${JSON.stringify(project.messages)}`;
  }
  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(25000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.35,
          },
        }),
      },
    );
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return NextResponse.json({ ...JSON.parse(text), mode: "gemini" });
  } catch (error) {
    console.warn(
      "Gemini unavailable; continuing safely in practice mode.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ fallback: true, mode: "practice" });
  }
}
