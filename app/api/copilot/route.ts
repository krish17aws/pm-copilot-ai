import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ fallback: true, mode: "practice" });
  const body = await req.json(),
    project = body.project;
  const prompt = `You are a senior product discovery partner. Continue this PM discovery conversation. Ask exactly ONE concise contextual follow-up question based on the application, request type, uploaded dataset and previous answers. Never display confidence, never propose solutions, and never repeat answered questions. Explore target user, current problem or behaviour, desired user and business outcome, evidence, and constraints. When all five are sufficiently clear, set ready=true and do not ask another question; say you are moving to evidence analysis. Return only JSON matching {"message":"string","ready":boolean}.
Application: ${project.applicationName}
Request type: ${project.requestType}
Uploaded CSV: ${project.fileName}
Dataset summary: ${JSON.stringify(project.fileSummary)}
Initial request: ${project.rawRequest}
Conversation: ${JSON.stringify(project.messages)}`;
  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(15000),
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
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.warn(
      "Gemini unavailable; continuing safely in practice mode.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ fallback: true, mode: "practice" });
  }
}
