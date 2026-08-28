# PM Copilot AI

A data-connected, clarification-first Product Management Copilot built with Next.js, TypeScript and Gemini.

## Product flow

Application → mandatory CSV connection → Requirement / Problem / Feature update → Gemini clarification chat → Evidence → Problem approval → Analysis → Solutions → RICE → Product plan

The CSV step automatically infers identifiers, numbers, dates, booleans and categories; calculates completeness, missing values, unique counts and numeric summaries; and renders category-distribution charts. This analytics profile is passed to Gemini and reused in the later Analysis stage.

## Simple structure

```text
app/
  api/copilot/route.ts   Gemini server API
  page.tsx               Main PM Copilot screen
components/ui/           Seven reusable UI controls
lib/
  pm-engine.ts           PM workflow, types and fallback logic
  utils.ts               CSS helper
```

Everything else is project configuration. There is no Python, Streamlit, database or Cloudflare-specific setup.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Set your Gemini key in `.env.local` and use `GEMINI_MODEL=gemini-3.6-flash`. If Gemini is unavailable or takes longer than 15 seconds, the app automatically continues in practice mode and always unlocks the chat.

## Validate before GitHub

```bash
npm run lint
npm run build
```
