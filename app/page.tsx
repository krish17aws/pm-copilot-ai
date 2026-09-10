"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Download,
  Eye,
  FileSpreadsheet,
  Lightbulb,
  MessageSquareText,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  buildAnalysis,
  buildPlan,
  buildProblem,
  buildSolutions,
  contextualAnswerRefinement,
  mockDiscoveryReply,
  newProject,
  parseCsv,
  FileSummary,
  ProblemBrief,
  Project,
  stages,
} from "@/lib/pm-engine";
const STORAGE = "pm-copilot-ts-projects-v2";
const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string | number | boolean =>
        ["string", "number", "boolean"].includes(typeof item),
      )
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const normaliseProblemBrief = (
  candidate: Partial<ProblemBrief>,
  fallback: ProblemBrief,
): ProblemBrief => ({
  title: typeof candidate.title === "string" ? candidate.title : fallback.title,
  targetUsers:
    typeof candidate.targetUsers === "string"
      ? candidate.targetUsers
      : fallback.targetUsers,
  problem:
    typeof candidate.problem === "string" ? candidate.problem : fallback.problem,
  currentBehavior:
    typeof candidate.currentBehavior === "string"
      ? candidate.currentBehavior
      : fallback.currentBehavior,
  desiredOutcome:
    typeof candidate.desiredOutcome === "string"
      ? candidate.desiredOutcome
      : fallback.desiredOutcome,
  businessImpact:
    typeof candidate.businessImpact === "string"
      ? candidate.businessImpact
      : fallback.businessImpact,
  evidence: toStringArray(candidate.evidence),
  assumptions: toStringArray(candidate.assumptions),
  constraints: toStringArray(candidate.constraints),
  successCriteria: toStringArray(candidate.successCriteria).length
    ? toStringArray(candidate.successCriteria)
    : fallback.successCriteria,
});
const saveBlob = (name: string, content: string, type = "application/json") => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};
const inferApplicationName = (fileName: string) => {
  const normalized = fileName.toLowerCase().replace(/\.csv$/, "").replace(/[-_]+/g, " ");
  const known = [
    ["google maps", "Google Maps"], ["make my trip", "MakeMyTrip"],
    ["book my show", "BookMyShow"], ["swiggy", "Swiggy"],
    ["netflix", "Netflix"], ["amazon", "Amazon"], ["facebook", "Facebook"],
    ["chrome", "Chrome"], ["uber", "Uber"], ["airbnb", "Airbnb"],
  ] as const;
  const match = known.find(([key]) => normalized.includes(key));
  if (match) return match[1];
  const first = normalized.split(/\s+(?:user|users|event|events|data|dataset|analytics|viewing)\b/)[0].trim();
  return first.replace(/\b\w/g, (character) => character.toUpperCase());
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]),
    [activeId, setActiveId] = useState(""),
    [ready, setReady] = useState(false),
    [geminiConfigured, setGeminiConfigured] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE),
      list: Project[] = raw ? JSON.parse(raw) : [newProject()];
    setProjects(list);
    setActiveId(list[0].id);
    setReady(true);
  }, []);
  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch("/api/copilot");
        if (response.ok) setGeminiConfigured(Boolean((await response.json()).configured));
      } catch {
        setGeminiConfigured(false);
      }
    };
    void check();
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE, JSON.stringify(projects));
  }, [projects, ready]);
  const project = projects.find((p) => p.id === activeId) || projects[0];
  const update = (patch: Partial<Project>) =>
    setProjects((ps) =>
      ps.map((p) =>
        p.id === activeId
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  const create = () => {
    const p = newProject();
    setProjects((ps) => [p, ...ps]);
    setActiveId(p.id);
  };
  const restart = () => {
    if (!window.confirm("Restart this request? Its current conversation and analysis will be cleared.")) return;
    const fresh = newProject();
    setProjects((ps) => ps.map((p) => (p.id === activeId ? { ...fresh, id: activeId } : p)));
  };
  const remove = (id: string) => {
    const left = projects.filter((p) => p.id !== id),
      next = left.length ? left : [newProject()];
    setProjects(next);
    if (activeId === id) setActiveId(next[0].id);
  };
  if (!ready || !project)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f8fc]">
        <Sparkles className="animate-pulse text-indigo-600" />
      </div>
    );
  const index = stages.findIndex((s) => s.id === project.stage);
  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <Toaster position="top-right" />
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl lg:px-7">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-200">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="font-semibold tracking-tight">PM Copilot</div>
            <div className="text-[11px] text-slate-500">
              Clarify. Decide. Deliver.
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 sm:flex"
          >
            <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500" />
            {project.aiMode === "gemini"
              ? "Gemini active"
              : geminiConfigured
                ? "Gemini configured"
                : "Practice fallback"}
          </Badge>
          <Button
            onClick={restart}
            size="sm"
            variant="outline"
            className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          >
            <RotateCcw size={15} />
            Restart
          </Button>
          <Button
            onClick={create}
            size="sm"
            className="rounded-xl bg-slate-950 text-white shadow-sm hover:bg-slate-800 hover:text-white"
          >
            <Plus size={15} />
            New request
          </Button>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-64px)] border-r border-slate-200 bg-white p-4 lg:block">
          <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[.16em] text-slate-400">
            Projects
          </div>
          <div className="space-y-1">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${p.id === activeId ? "bg-indigo-50 text-indigo-950" : "hover:bg-slate-50"}`}
              >
                <MessageSquareText
                  size={16}
                  className={
                    p.id === activeId ? "text-indigo-600" : "text-slate-400"
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {stages.find((s) => s.id === p.stage)?.label}
                  </div>
                </div>
                <Trash2
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(p.id);
                  }}
                  size={14}
                  className="opacity-0 text-slate-400 hover:text-red-500 group-hover:opacity-100"
                />
              </button>
            ))}
          </div>
        </aside>
        <main className="min-w-0 p-4 md:p-7">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex min-w-[720px] items-center">
                {stages.map((s, i) => (
                  <div key={s.id} className="flex flex-1 items-center">
                    <button
                      type="button"
                      disabled={i > index}
                      onClick={() => i <= index && update({ stage: s.id })}
                      title={i <= index ? `Go to ${s.label}` : `Complete earlier steps first`}
                      className="flex items-center gap-2 text-left disabled:cursor-not-allowed"
                    >
                      <div
                        className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${i < index ? "bg-emerald-500 text-white" : i === index ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : "bg-slate-100 text-slate-400"}`}
                      >
                        {i < index ? <Check size={14} /> : i + 1}
                      </div>
                      <span
                        className={`text-xs font-medium ${i === index ? "text-indigo-700" : "text-slate-500"}`}
                      >
                        {s.label}
                      </span>
                    </button>
                    {i < stages.length - 1 && (
                      <div
                        className={`mx-2 h-px flex-1 ${i < index ? "bg-emerald-300" : "bg-slate-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {project.stage === "intake" && (
              <Intake project={project} update={update} />
            )}{" "}
            {project.stage === "discovery" && (
              <Discovery project={project} update={update} />
            )}{" "}
            {project.stage === "evidence" && (
              <Evidence project={project} update={update} />
            )}{" "}
            {project.stage === "problem" && (
              <Problem project={project} update={update} />
            )}{" "}
            {project.stage === "analysis" && (
              <AnalysisView project={project} update={update} />
            )}{" "}
            {project.stage === "solutions" && (
              <Solutions project={project} update={update} />
            )}{" "}
            {project.stage === "rice" && (
              <Rice project={project} update={update} />
            )}{" "}
            {project.stage === "plan" && (
              <PlanView project={project} create={create} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
function Intake({
  project,
  update,
}: {
  project: Project;
  update: (p: Partial<Project>) => void;
}) {
  const [applicationName, setApplicationName] = useState(
    project.applicationName || (project.fileName ? inferApplicationName(project.fileName) : ""),
  );
  const [requestType, setRequestType] = useState<Project["requestType"]>(
    project.requestType,
  );
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file.");
      return;
    }
    const summary = parseCsv(await file.text());
    const inferredName = applicationName.trim() || inferApplicationName(file.name);
    setApplicationName(inferredName);
    update({ fileName: file.name, fileSummary: summary, applicationName: inferredName });
    toast.success(`${summary.rows.toLocaleString()} rows connected`);
  };
  const canContinue =
    applicationName.trim() && requestType && project.fileSummary;
  const continueToChat = () => {
    if (!canContinue) return;
    update({
      applicationName: applicationName.trim(),
      requestType,
      name: `${applicationName.trim()} — ${requestType}`,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I’ve connected ${project.fileName} for ${applicationName.trim()}. Describe the ${requestType?.toLowerCase()} you want to explore. I’ll use your data context and ask one clarification question at a time before moving forward.`,
        },
      ],
      stage: "discovery",
    });
  };
  return (
    <Shell
      eyebrow="Project setup"
      title="Connect the product context"
      description="Tell the copilot which application you are working on, connect its data, and choose the kind of PM request you want to explore."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-semibold" htmlFor="application-name">
            Application or product
          </label>
          <Input
            id="application-name"
            value={applicationName}
            onChange={(event) => {
              setApplicationName(event.target.value);
              update({ applicationName: event.target.value });
            }}
            placeholder="Example: Swiggy, Netflix, Google Maps"
            className="mt-3 rounded-xl"
          />
          <div className="mt-6 text-sm font-semibold">Request type</div>
          <div className="mt-3 grid gap-2">
            {(["Requirement", "Problem", "Feature update"] as const).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setRequestType(type);
                    update({ requestType: type });
                  }}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${requestType === type ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"}`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-6">
          <div className="grid size-11 place-items-center rounded-2xl bg-white text-indigo-600 shadow-sm">
            <FileSpreadsheet />
          </div>
          <h2 className="mt-4 font-semibold">Connect a data source</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The architecture can support analytics platforms, databases and
            APIs. For this MVP, CSV is the enabled data source
            and is required before discovery begins.
          </p>
          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
            <Upload size={16} />
            {project.fileName ? "Replace CSV" : "Upload CSV"}
            <Input type="file" accept=".csv" onChange={upload} className="hidden" />
          </label>
          {project.fileSummary && (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <div className="font-medium text-slate-800">{project.fileName}</div>
              <div className="mt-1 text-xs text-slate-500">
                {project.fileSummary.rows.toLocaleString()} rows ·{" "}
                {project.fileSummary.columns.length} columns
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {project.fileSummary.columns.slice(0, 8).map((column) => (
                  <Badge key={column} variant="secondary">
                    {column}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-semibold">Ready for discovery?</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["Application", Boolean(applicationName.trim())],
                ["CSV", Boolean(project.fileSummary)],
                ["Request type", Boolean(requestType)],
              ].map(([label, complete]) => (
                <span key={label as string} className={`rounded-full px-2.5 py-1 text-xs font-medium ${complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {complete ? "✓" : "○"} {label as string}
                </span>
              ))}
            </div>
          </div>
          <Button onClick={continueToChat} disabled={!canContinue} className="rounded-xl bg-indigo-600">
            Continue to Gemini discovery <ArrowRight size={16} />
          </Button>
        </div>
        {!canContinue && <p className="mt-3 text-xs text-slate-500">Complete the amber items above. Your selections are saved automatically.</p>}
      </div>
      {project.fileSummary && (
        <DataAnalytics summary={project.fileSummary} />
      )}
    </Shell>
  );
}
function DataAnalytics({ summary }: { summary: FileSummary }) {
  const numeric = summary.profiles.filter((column) => column.type === "numeric");
  const categorical = summary.profiles.filter(
    (column) => column.topValues?.length,
  );
  const incomplete = summary.profiles.filter(
    (column) => column.missingPercent > 0,
  ).length;
  const chartColors = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#e879f9"];
  const pieBackground = (values: { percent: number }[]) => {
    let cursor = 0;
    const slices = values.map((item, index) => {
      const start = cursor;
      cursor += item.percent;
      return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
    });
    if (cursor < 100) slices.push(`#e2e8f0 ${cursor}% 100%`);
    return `conic-gradient(${slices.join(", ")})`;
  };
  return (
    <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[.16em] text-indigo-600">
            Automatic data analytics
          </div>
          <h2 className="mt-1 text-xl font-semibold">What the CSV contains</h2>
        </div>
        <Badge className="rounded-full bg-emerald-50 text-emerald-700">
          {summary.dataQualityScore}% complete
        </Badge>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Rows", summary.rows.toLocaleString()],
          ["Columns", summary.columns.length.toString()],
          ["Numeric metrics", numeric.length.toString()],
          ["Fields with blanks", incomplete.toString()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
          </div>
        ))}
      </div>
      {categorical.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {categorical.slice(0, 2).map((column) => (
            <div key={`pie-${column.name}`} className="rounded-2xl border border-slate-100 p-5">
              <div className="text-sm font-semibold">{column.name} share</div>
              <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
                <div
                  className="relative size-36 shrink-0 rounded-full shadow-inner"
                  style={{ background: pieBackground(column.topValues || []) }}
                  role="img"
                  aria-label={`${column.name} pie chart`}
                >
                  <div className="absolute inset-8 grid place-items-center rounded-full bg-white text-center text-xs font-semibold text-slate-500">
                    Top<br />segments
                  </div>
                </div>
                <div className="w-full space-y-2.5">
                  {column.topValues?.map((item, index) => (
                    <div key={item.value} className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex min-w-0 items-center gap-2 text-slate-600">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                        <span className="truncate">{item.value}</span>
                      </span>
                      <span className="font-semibold text-slate-700">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="pb-3 font-semibold">Column</th>
              <th className="pb-3 font-semibold">Detected type</th>
              <th className="pb-3 font-semibold">Unique</th>
              <th className="pb-3 font-semibold">Missing</th>
              <th className="pb-3 font-semibold">Numeric summary</th>
            </tr>
          </thead>
          <tbody>
            {summary.profiles.map((column) => (
              <tr key={column.name} className="border-b border-slate-100">
                <td className="py-3 font-medium text-slate-700">{column.name}</td>
                <td className="py-3">
                  <Badge variant="secondary">{column.type}</Badge>
                </td>
                <td className="py-3 text-slate-500">{column.uniqueCount}</td>
                <td className="py-3 text-slate-500">{column.missingPercent}%</td>
                <td className="py-3 text-xs text-slate-500">
                  {column.mean !== undefined
                    ? `Avg ${column.mean.toLocaleString()} · ${column.min?.toLocaleString()}–${column.max?.toLocaleString()}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {categorical.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {categorical.slice(0, 4).map((column) => (
            <div key={column.name} className="rounded-2xl border border-slate-100 p-4">
              <div className="text-sm font-semibold">{column.name} distribution</div>
              <div className="mt-4 space-y-3">
                {column.topValues?.map((item) => (
                  <div key={item.value}>
                    <div className="mb-1 flex justify-between gap-3 text-xs text-slate-600">
                      <span className="truncate">{item.value}</span>
                      <span>{item.count.toLocaleString()} · {item.percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.max(item.percent, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {summary.warnings.length > 0 && (
        <div className="mt-5 rounded-2xl bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-800">Data-quality notes</div>
          {summary.warnings.map((warning) => (
            <p key={warning} className="mt-1 text-xs leading-5 text-amber-700">
              {warning}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
function Shell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-indigo-600">
          {eyebrow}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
function Discovery({
  project,
  update,
}: {
  project: Project;
  update: (p: Partial<Project>) => void;
}) {
  const [text, setText] = useState(""),
    [loading, setLoading] = useState(false),
    bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [project.messages]);
  const send = async () => {
    if (!text.trim() || loading) return;
    const input = text.trim();
    setText("");
    setLoading(true);
    const first = !project.rawRequest,
      user = { id: crypto.randomUUID(), role: "user" as const, content: input },
      base = {
        ...project,
        rawRequest: project.rawRequest || input,
        messages: [...project.messages, user],
        name: first ? input.slice(0, 42) : project.name,
      };
    update({
      rawRequest: base.rawRequest,
      name: base.name,
      messages: base.messages,
    });
    let reply = {
      ...mockDiscoveryReply(project, input),
      refinedAnswer: contextualAnswerRefinement(project.messages, input),
    };
    let aiMode: Project["aiMode"] = "practice";
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 27000);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "discovery", project: base }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          const contextualRefinement = contextualAnswerRefinement(project.messages, input);
          const modelRefinement =
            typeof data.refinedAnswer === "string" ? data.refinedAnswer.trim() : "";
          const unresolvedShorthand = /^(both|all|yes|no|none)[.!]?$/i.test(modelRefinement);
          reply = {
            ...data,
            refinedAnswer:
              unresolvedShorthand || !modelRefinement
                ? contextualRefinement
                : modelRefinement,
          };
          const answeredTurns = base.messages.filter((message) => message.role === "user").length;
          if (reply.ready && answeredTurns < 7) {
            reply = {
              ...mockDiscoveryReply(project, input),
              refinedAnswer:
                unresolvedShorthand || !modelRefinement
                  ? contextualRefinement
                  : modelRefinement,
            };
          }
        }
        aiMode = data.mode || aiMode;
      }
    } catch {
      // The deterministic discovery flow remains available if Gemini times out.
    } finally {
      window.clearTimeout(timeout);
      const assistant = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: reply.message,
      };
      const refinedMessages = base.messages.map((message) =>
        message.id === user.id && "refinedAnswer" in reply && typeof reply.refinedAnswer === "string"
          ? { ...message, refinedContent: reply.refinedAnswer }
          : message,
      );
      update({
        rawRequest: base.rawRequest,
        name: base.name,
        messages: [...refinedMessages, assistant],
        aiMode,
        stage: reply.ready ? "evidence" : "discovery",
      });
      setLoading(false);
    }
  };
  return (
    <Shell
      eyebrow="Discovery"
      title="Let’s understand the real problem"
      description="Start with whatever you know. Your copilot asks one relevant question at a time and moves forward automatically when the brief is clear."
    >
      <Button onClick={() => update({ stage: "intake" })} variant="outline" className="mb-4 rounded-xl">
        ← Back to setup
      </Button>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[520px] min-h-[390px] space-y-5 overflow-y-auto p-5 md:p-7">
          {project.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === "user" ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md bg-slate-100 text-slate-700"}`}
              >
                {m.content}
                {m.role === "user" && m.refinedContent && m.refinedContent !== m.content && (
                  <div className="mt-3 border-t border-white/25 pt-3 text-xs leading-5 text-indigo-50">
                    <span className="font-semibold">Refined for documents:</span> {m.refinedContent}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="w-fit rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-400">
              Thinking…
            </div>
          )}
          <div ref={bottom} />
        </div>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Describe your request or answer the question…"
              className="min-h-12 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              onClick={send}
              disabled={!text.trim() || loading}
              className="size-10 rounded-xl bg-indigo-600 p-0"
            >
              <Send size={17} />
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
function Evidence({
  project,
  update,
}: {
  project: Project;
  update: (p: Partial<Project>) => void;
}) {
  const [notes, setNotes] = useState(project.evidenceNotes);
  const [loading, setLoading] = useState(false);
  const next = async (without = false) => {
    if (loading) return;
    setLoading(true);
    const temp = { ...project, evidenceNotes: without ? "" : notes };
    let problem = buildProblem(temp);
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "brief", project: temp }),
      });
      const data = response.ok ? await response.json() : null;
      if (
        data?.problem?.targetUsers &&
        data?.problem?.desiredOutcome &&
        data?.problem?.businessImpact &&
        data.problem.desiredOutcome.trim().toLowerCase() !== data.problem.businessImpact.trim().toLowerCase()
      ) {
        problem = normaliseProblemBrief(data.problem, problem);
      }
    } catch {
      // The request-aware local brief remains available if Gemini is unavailable.
    }
    update({ evidenceNotes: temp.evidenceNotes, problem, stage: "problem" });
    setLoading(false);
  };
  return (
    <Shell
      eyebrow="Evidence"
      title="Strengthen the decision"
      description="Your CSV already provides quantitative evidence. Add optional qualitative evidence here so the problem brief can separate facts, assumptions, and constraints."
    >
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-3">
          <label className="mb-2 block text-sm font-semibold">
            Optional qualitative evidence
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste interview findings, support tickets, app reviews, survey comments, stakeholder constraints, or existing PRD notes…"
            className="min-h-44 rounded-2xl"
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => void next(false)}
              disabled={loading}
              className="rounded-xl bg-indigo-600"
            >
              {loading ? "Creating problem brief…" : "Continue with evidence"}
              <ArrowRight size={16} />
            </Button>
            <Button
              onClick={() => void next(true)}
              disabled={loading}
              variant="ghost"
              className="rounded-xl"
            >
              Continue without evidence
            </Button>
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/60 p-6 md:col-span-2">
          <div className="grid size-11 place-items-center rounded-2xl bg-white text-indigo-600 shadow-sm">
            <FileSpreadsheet />
          </div>
          <h3 className="mt-4 font-semibold">Quantitative evidence connected</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            The required CSV was connected during setup and does not need to be uploaded again.
          </p>
          {project.fileSummary && (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <div className="font-medium">{project.fileName}</div>
              <div className="mt-1 text-xs text-slate-500">
                {project.fileSummary.rows.toLocaleString()} rows ·{" "}
                {project.fileSummary.columns.length} columns
              </div>
              {project.fileSummary.warnings.map((w) => (
                <p key={w} className="mt-2 text-xs leading-5 text-amber-700">
                  {w}
                </p>
              ))}
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700"><Check size={14} /> Ready for problem definition</div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
function BriefCard({ brief }: { brief: ProblemBrief }) {
  const rows = [
    [Users, "Target users", brief.targetUsers],
    [Target, "Problem", brief.problem],
    [Zap, "Desired outcome", brief.desiredOutcome],
    [BarChart3, "Business impact", brief.businessImpact],
  ] as const;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{brief.title}</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {rows.map(([Icon, label, value]) => (
          <div key={label} className="flex gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <Icon size={17} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {label}
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-700">
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-3">
        {[
          ["Evidence", brief.evidence],
          ["Assumptions", brief.assumptions],
          ["Constraints", brief.constraints],
        ].map(([l, v]) => (
          <div key={l as string}>
            <div className="text-xs font-semibold text-slate-500">
              {l as string}
            </div>
            {(v as string[]).length ? (
              (v as string[]).map((x) => (
                <p key={x} className="mt-1 text-xs leading-5 text-slate-600">
                  • {x}
                </p>
              ))
            ) : (
              <p className="mt-1 text-xs text-slate-400">None captured</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function Problem({
  project,
  update,
}: {
  project: Project;
  update: (p: Partial<Project>) => void;
}) {
  const [edit, setEdit] = useState(false),
    [brief, setBrief] = useState(project.problem!);
  const go = () => {
    const p = { ...project, problem: brief };
    update({ problem: brief, analysis: buildAnalysis(p), stage: "analysis" });
  };
  return (
    <Shell
      eyebrow="Problem definition"
      title="Confirm we are solving the right problem"
      description="Analysis begins only after you approve this brief. Edit any field that does not reflect your intent."
    >
      <BriefCard brief={brief} />
      {edit && (
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Target users", "targetUsers"],
              ["Problem", "problem"],
              ["Desired outcome", "desiredOutcome"],
              ["Business impact", "businessImpact"],
            ].map(([l, k]) => (
              <label key={k} className="text-sm font-medium">
                {l}
                <Textarea
                  value={brief[k as keyof ProblemBrief] as string}
                  onChange={(e) => setBrief({ ...brief, [k]: e.target.value })}
                  className="mt-2 rounded-xl"
                />
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Button onClick={go} className="rounded-xl bg-indigo-600">
          Approve and analyse
          <ArrowRight size={16} />
        </Button>
        <Button
          onClick={() => setEdit(!edit)}
          variant="outline"
          className="rounded-xl"
        >
          {edit ? "Finish editing" : "Edit brief"}
        </Button>
      </div>
    </Shell>
  );
}
function AnalysisView({
  project,
  update,
}: {
  project: Project;
  update: (p: Partial<Project>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const continueToSolutions = async () => {
    if (loading) return;
    setLoading(true);
    let solutions = buildSolutions(project);
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "solutions", project }),
      });
      const data = response.ok ? await response.json() : null;
      const sourceContext = JSON.stringify({
        applicationName: project.applicationName,
        rawRequest: project.rawRequest,
        problem: project.problem,
        analysis: project.analysis,
        evidenceNotes: project.evidenceNotes,
      });
      const generatedContext = JSON.stringify(data?.solutions || []);
      const contextBoundaries = [
        /\bAR\b|augmented reality/i,
        /navigation|landmark|walking route/i,
        /sponsored|advertis(?:e|ing|ement)|moneti[sz]/i,
      ];
      const introducesUnsupportedConcept = contextBoundaries.some(
        (pattern) => pattern.test(generatedContext) && !pattern.test(sourceContext),
      );
      if (
        Array.isArray(data?.solutions) &&
        data.solutions.length >= 3 &&
        !introducesUnsupportedConcept
      ) solutions = data.solutions;
    } catch {
      // The request-aware local recommendations remain available.
    }
    update({ solutions, stage: "solutions" });
    setLoading(false);
  };
  const a = project.analysis!,
    groups = [
      ["Observations", a.observations, "bg-blue-50 text-blue-700"],
      ["Possible causes to validate", a.causes, "bg-amber-50 text-amber-700"],
      ["Evidence gaps", a.gaps, "bg-rose-50 text-rose-700"],
    ] as const;
  return (
    <Shell
      eyebrow="Analysis"
      title="What the evidence suggests"
      description="Observations, possible causes, and missing evidence remain separate so assumptions never masquerade as facts."
    >
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-100">
        <div className="text-xs font-semibold uppercase tracking-widest text-indigo-100">
          Executive finding
        </div>
        <p className="mt-3 text-lg leading-8">{a.finding}</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {groups.map(([title, items, color]) => (
          <div
            key={title}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}
            >
              {title}
            </div>
            <div className="mt-4 space-y-3">
              {items.map((x) => (
                <div
                  key={x}
                  className="flex gap-2 text-sm leading-6 text-slate-600"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300" />
                  {x}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button
        onClick={() => void continueToSolutions()}
        disabled={loading}
        className="mt-5 rounded-xl bg-indigo-600"
      >
        {loading ? "Creating relevant recommendations…" : "Continue to solution workshop"}
        <ArrowRight size={16} />
      </Button>
    </Shell>
  );
}
function Solutions({
  project,
  update,
}: {
  project: Project;
  update: (p: Partial<Project>) => void;
}) {
  const [selected, setSelected] = useState<string[]>(project.selectedSolutionIds || (project.selectedSolutionId ? [project.selectedSolutionId] : []));
  const [solutions, setSolutions] = useState(project.solutions || []);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const addRecommendation = () => {
    if (!customName.trim() || !customDescription.trim()) return;
    const solution = { id: crypto.randomUUID(), name: customName.trim(), description: customDescription.trim(), impact: "To assess", effort: "To assess", risks: ["Requires validation"] };
    const next = [...solutions, solution];
    setSolutions(next);
    setSelected((current) => [...current, solution.id]);
    setCustomName("");
    setCustomDescription("");
    update({ solutions: next });
  };
  return (
    <Shell
      eyebrow="Solution workshop"
      title="Explore before you converge"
      description="Compare distinct approaches, select one or more recommendations, and add your own. The first selected recommendation becomes the primary option for RICE evaluation."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {solutions.map((s, i) => (
          <button
            onClick={() => toggle(s.id)}
            key={s.id}
            className={`relative rounded-3xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${selected.includes(s.id) ? "border-indigo-500 ring-4 ring-indigo-50" : "border-slate-200"}`}
          >
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-slate-950 font-semibold text-white">
                0{i + 1}
              </div>
              {selected.includes(s.id) && (
                <div className="grid size-7 place-items-center rounded-full bg-indigo-600 text-white">
                  <Check size={15} />
                </div>
              )}
            </div>
            <h3 className="mt-5 text-lg font-semibold">{s.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {s.description}
            </p>
            <div className="mt-5 flex gap-2">
              <Badge variant="secondary">Impact {s.impact}</Badge>
              <Badge variant="secondary">Effort {s.effort}</Badge>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Risks: {s.risks.join(" · ")}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/50 p-5">
        <h3 className="font-semibold">Add your own recommendation</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <Input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Recommendation name" className="rounded-xl bg-white" />
          <Input value={customDescription} onChange={(event) => setCustomDescription(event.target.value)} placeholder="What should the team do?" className="rounded-xl bg-white" />
          <Button onClick={addRecommendation} disabled={!customName.trim() || !customDescription.trim()} variant="outline" className="rounded-xl bg-white"><Plus size={16} /> Add</Button>
        </div>
      </div>
      {selected.length > 0 && <p className="mt-4 text-sm text-slate-600">{selected.length} recommendation{selected.length > 1 ? "s" : ""} selected. The first selected option will be prioritised with RICE.</p>}
      <Button
        disabled={!selected.length}
        onClick={() => update({ solutions, selectedSolutionIds: selected, selectedSolutionId: selected[0], stage: "rice" })}
        className="mt-5 rounded-xl bg-indigo-600"
      >
        Prioritise recommendations
        <ArrowRight size={16} />
      </Button>
    </Shell>
  );
}
function Rice({
  project,
  update,
}: {
  project: Project;
  update: (p: Partial<Project>) => void;
}) {
  const [reach, setReach] = useState(500),
    [impact, setImpact] = useState(1),
    [confidence, setConfidence] = useState(70),
    [effort, setEffort] = useState(2),
    score = (reach * impact * (confidence / 100)) / effort,
    solution = project.solutions!.find(
      (s) => s.id === project.selectedSolutionId,
    )!;
  const approve = () => {
    const rice = {
        reach,
        impact,
        confidence,
        effort,
        score: +score.toFixed(1),
      },
      p = { ...project, rice };
    update({ rice, plan: buildPlan(p), stage: "plan" });
  };
  return (
    <Shell
      eyebrow="RICE validation"
      title="You control every assumption"
      description={`Selected solution: ${solution.name}. Adjust inputs using evidence and team judgment before approving.`}
    >
      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <NumberField
            label="Reach in selected period"
            value={reach}
            set={setReach}
            step={50}
          />
          <NumberField
            label="Impact (0.25–3)"
            value={impact}
            set={setImpact}
            step={0.25}
          />
          <NumberField
            label="Effort in person-months"
            value={effort}
            set={setEffort}
            step={0.25}
          />
          <label className="mt-5 block text-sm font-medium">
            Confidence
            <span className="float-right text-indigo-600">{confidence}%</span>
            <Slider
              className="mt-4"
              value={[confidence]}
              onValueChange={(v) => setConfidence(v[0])}
              min={0}
              max={100}
              step={5}
            />
          </label>
        </div>
        <div className="flex flex-col justify-between rounded-3xl bg-slate-950 p-6 text-white">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              RICE score
            </div>
            <div className="mt-3 text-6xl font-semibold">
              {score.toFixed(1)}
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Reach × Impact × Confidence ÷ Effort
            </div>
          </div>
          <Button
            onClick={approve}
            className="mt-8 rounded-xl bg-white text-slate-950 hover:bg-slate-100"
          >
            Approve and create plan
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </Shell>
  );
}
function NumberField({
  label,
  value,
  set,
  step,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  step: number;
}) {
  return (
    <label className="mb-4 block text-sm font-medium">
      {label}
      <Input
        type="number"
        min={step}
        step={step}
        value={value}
        onChange={(e) => set(+e.target.value)}
        className="mt-2 rounded-xl"
      />
    </label>
  );
}
function enrichDocument(title: string, content: string, project: Project) {
  const brief = project.problem!;
  const bullets = (items: unknown) =>
    toStringArray(items).map((item) => `- ${item}`).join("\n");
  const common = `\n\n## Source context and document status\n- Product: ${project.applicationName}\n- Request type: ${project.requestType}\n- Dataset: ${project.fileName} (${project.fileSummary?.rows.toLocaleString()} rows, ${project.fileSummary?.columns.length} columns)\n- Status: Draft for review; unconfirmed information is not presented as fact\n- Evidence quality: ${project.fileSummary?.dataQualityScore}% field completeness, with qualitative evidence ${brief.evidence.length ? "included" : "still to be collected"}\n\n## Assumptions requiring validation\n${bullets(brief.assumptions.length ? brief.assumptions : ["No explicit assumptions captured; stakeholder validation remains required"])}\n\n## Constraints\n${bullets(brief.constraints.length ? brief.constraints : ["No explicit constraints captured; technical, legal, budget, and timeline constraints remain to be confirmed"])}\n\n## Open decisions\n- Confirm baseline and target for the primary metric\n- Confirm owners, delivery estimate, dependencies, and decision dates\n- Confirm privacy, security, accessibility, legal, support, and operational requirements\n- Confirm pilot audience, sample size, duration, stop conditions, and rollback criteria\n\n## Review and approval\nProduct, Engineering, Design, Data, and applicable business/control owners should review this draft. Material changes to scope, metrics, risk, cost, or timing should be recorded before approval.`;
  const additions: Record<string, string> = {
    PRD: `\n\n## Detailed functional requirements\n- Support the approved target user and critical journey from entry through completion\n- Define eligibility, entry points, permissions, success, failure, loading, empty, retry, and recovery states\n- Instrument exposure, interaction, completion, abandonment, error, and recovery events\n- Allow controlled pilot rollout and rollback without requiring a full release\n- Make the primary metric and guardrails observable before exposure increases\n\n## Non-functional requirements\n- Performance: Establish targets from the current baseline with Engineering\n- Reliability: Define monitoring, alerting, fallback, incident ownership, and rollback\n- Accessibility: Review against the organisation's applicable standard\n- Privacy and security: Collect only necessary data and complete required reviews\n- Compatibility: Confirm supported devices, platforms, browsers, and versions\n\n## Analytics specification\nFor each event, document the name, business definition, trigger, properties, source, owner, validation query, and dashboard. Monitor missing, duplicated, delayed, and invalid events. Segment results using the approved target-user definition.\n\n## Release readiness checklist\n- User journey and edge cases validated\n- Acceptance criteria passed\n- Events and dashboards verified\n- Guardrails, alerts, fallback, and rollback ready\n- Support and operations briefed\n- Required stakeholder approvals recorded`,
    BRD: `\n\n## Current and future state\nCurrent state: ${brief.currentBehavior}\n\nFuture state: ${brief.desiredOutcome}\n\n## Scope boundaries\nIn scope is the approved MVP and measurement needed to validate it. Out of scope are unvalidated segments, unrelated platform redesign, full rollout before pilot evidence, and commitments not explicitly approved.\n\n## Benefits and value case\n- User value: ${brief.desiredOutcome}\n- Business value: ${brief.businessImpact}\n- Financial value: To be quantified with Finance or the business owner\n- Operational impact: To be assessed during feasibility and rollout planning\n\n## Governance\nProduct owns the problem, priority, scope, and outcome. Engineering owns feasibility and operability. Design and Research own experience validation. Data owns measurement quality. Business and operational owners approve process readiness.`,
    "Executive summary": `\n\n## Why this matters now\nThe opportunity is tied to ${brief.businessImpact}. Timing, urgency, and cost of delay must be confirmed with the business owner rather than inferred.\n\n## Options considered\nThe solution workshop retained multiple recommendations so leadership can compare impact, effort, risk, and sequencing rather than treating the primary recommendation as the only possible answer.\n\n## Leadership asks\n- Approve the problem and pilot objective\n- Confirm accountable owner and delivery capacity\n- Approve metric definitions, guardrails, and decision threshold\n- Resolve material dependencies and risks before launch`,
    "User stories": `\n\n## Additional story — Failure and recovery\nAs a target user, I want clear recovery guidance when the journey fails so that I can continue without avoidable confusion or support contact.\n\n### Acceptance criteria\n- Given a recoverable error, when it occurs, then the user receives a clear next action\n- Given an unrecoverable error, when it occurs, then the user is not left in an ambiguous state\n- Error type, context, recovery action, and outcome are recorded\n\n## Additional story — Controlled rollout\nAs a PM, I want eligibility and rollout controls so that the MVP can be piloted, monitored, paused, or rolled back safely.\n\n## Definition of done\nDesign, engineering, analytics, QA, accessibility, privacy/security, documentation, support readiness, monitoring, and approval requirements are complete for the agreed MVP scope.`,
    "Experiment plan": `\n\n## Experiment design details\n- Population: Approved target segment; exclusions must be documented\n- Control: Existing experience or trusted baseline\n- Exposure: Record assignment and actual feature exposure separately\n- Duration and sample: Calculate before launch using baseline, minimum detectable effect, power, and significance assumptions\n- Analysis: Report absolute and relative change, uncertainty, segment effects, and data-quality limitations\n\n## Decision framework\nExpand when the primary metric improves meaningfully and guardrails remain acceptable. Iterate when the signal is promising but incomplete or a remediable guardrail worsens. Stop or roll back when harm, invalid instrumentation, or predefined stop conditions occur.`,
    "MVP roadmap": `\n\n## Milestones and exit criteria\n- Discovery exit: Problem, segment, evidence, baseline, and constraints approved\n- Definition exit: PRD, designs, event specification, estimate, risks, and owners approved\n- Build exit: Acceptance criteria, QA, analytics validation, monitoring, and operational readiness complete\n- Pilot exit: Required sample and observation period reached with trustworthy data\n- Decision exit: Expand, iterate, pause, or stop decision documented\n\n## Workstreams\nProduct and governance; design and research; engineering and QA; data and experimentation; privacy/security/legal; operations, support, enablement, and communication.\n\n## Status and ownership template\nFor every milestone record the accountable owner, contributors, target date, status, dependencies, decision needed, and latest evidence.`,
  };
  return `${content}${additions[title] || ""}${common}`;
}
function PlanView({
  project,
  create,
}: {
  project: Project;
  create: () => void;
}) {
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);
  const rawPlan = project.plan!,
    plan = {
      ...rawPlan,
      guardrails: toStringArray(rawPlan.guardrails),
      mvp: toStringArray(rawPlan.mvp),
      okrs: toStringArray(rawPlan.okrs),
    },
    solution = project.solutions!.find(
      (s) => s.id === project.selectedSolutionId,
    )!,
    recommendations = project.solutions!.filter((item) => (project.selectedSolutionIds || [project.selectedSolutionId]).includes(item.id)),
    list = (items: unknown) => toStringArray(items).map((item) => `- ${item}`).join("\n"),
    recommendationList = recommendations.map((item, index) => `${index + 1}. **${item.name}** — ${item.description}`).join("\n"),
    brief = project.problem!,
    prd = `# Product Requirements Document (PRD)\n\n## 1. Overview\n${brief.title}\n\n## 2. Problem statement\n${brief.problem}\n\n## 3. Target users\n${brief.targetUsers}\n\n## 4. Current behaviour\n${brief.currentBehavior}\n\n## 5. Goals\n${brief.desiredOutcome}\n\n## 6. Business impact\n${brief.businessImpact}\n\n## 7. Evidence\n${list(brief.evidence.length ? brief.evidence : ["Quantitative CSV analysis; qualitative validation pending"])}\n\n## 8. Recommended solutions\n${recommendationList}\n\n## 9. MVP scope\n${list(plan.mvp)}\n\n## 10. User stories\n- As a ${brief.targetUsers}, I want ${solution.name.toLowerCase()} so that I can achieve ${brief.desiredOutcome.toLowerCase()}.\n- As a product team, we want journey instrumentation so that we can measure impact safely.\n\n## 11. Acceptance criteria\n- The primary journey is instrumented end to end.\n- The MVP works for the agreed target segment.\n- Error, loading, empty, and recovery states are handled.\n- Accessibility and privacy requirements are reviewed.\n- Primary and guardrail metrics are visible before rollout.\n\n## 12. Success metrics\n- North Star: ${plan.northStar}\n- Primary metric: ${plan.primaryMetric}\n${list(plan.guardrails.map((item) => `Guardrail: ${item}`))}\n\n## 13. Risks and dependencies\n${list([...solution.risks, ...brief.constraints, "Engineering feasibility", "Analytics instrumentation", "Design and stakeholder approval"])}\n\n## 14. Rollout\nPilot → measure → review guardrails → iterate → staged expansion.`,
    brd = `# Business Requirements Document (BRD)\n\n## Executive summary\n${brief.title} addresses ${brief.problem}\n\n## Business objective\n${brief.businessImpact}\n\n## Business need\n${brief.desiredOutcome}\n\n## Scope\n${list(plan.mvp)}\n\n## Recommended initiatives\n${recommendationList}\n\n## Stakeholders\n- Product management\n- Engineering\n- Design and research\n- Data and analytics\n- Operations, support, legal or compliance as applicable\n\n## Business requirements\n- Improve the target journey for ${brief.targetUsers}.\n- Establish a measurable baseline before launch.\n- Protect customer experience through agreed guardrails.\n- Maintain an auditable approval and rollout decision.\n\n## Success criteria\n${list(brief.successCriteria)}\n\n## Constraints and assumptions\n${list([...brief.constraints, ...brief.assumptions])}`,
    executive = `# Executive Summary\n\n## Decision\nPrioritise **${solution.name}** with an approved RICE score of **${project.rice?.score}**.\n\n## Problem\n${brief.problem}\n\n## Business value\n${brief.businessImpact}\n\n## Recommendations\n${recommendationList}\n\n## Measurement\n${plan.primaryMetric}; guardrails: ${plan.guardrails.join(", ")}.\n\n## Next action\nValidate the MVP with the target segment and use the success rule: ${plan.successRule}`,
    stories = `# User Stories and Acceptance Criteria\n\n## Epic\nEnable ${brief.targetUsers} to achieve ${brief.desiredOutcome}.\n\n## Story 1 — Core journey\nAs a target user, I want ${solution.name.toLowerCase()} so that I can complete the critical journey successfully.\n\n### Acceptance criteria\n- Given an eligible user, when they enter the journey, then the recommended experience is available.\n- Given a successful action, when it completes, then the outcome is recorded.\n- Given an error, when it occurs, then recovery guidance is provided and the event is logged.\n\n## Story 2 — Measurement\nAs a PM, I want funnel and guardrail instrumentation so that I can evaluate the release.\n\n### Acceptance criteria\n- Primary and guardrail events have documented definitions.\n- Dashboards distinguish target and control segments.\n- Missing or invalid events are monitored.`,
    experiment = `# Experiment and Metrics Plan\n\n## Hypothesis\n${plan.hypothesis}\n\n## Primary metric\n${plan.primaryMetric}\n\n## North Star\n${plan.northStar}\n\n## Guardrails\n${list(plan.guardrails)}\n\n## Evaluation rule\n${plan.successRule}\n\n## Recommended design\nPilot with one target segment; compare against baseline or a control; predefine sample size, duration, minimum detectable effect, and stop conditions before launch.`,
    roadmap = `# MVP Roadmap\n\n## Phase 1 — Discover and baseline\n- Validate the problem with users and stakeholders\n- Confirm event definitions and baseline metrics\n- Review feasibility and dependencies\n\n## Phase 2 — Design and build\n${list(plan.mvp)}\n\n## Phase 3 — Pilot and learn\n- Release to one target segment\n- Monitor primary metric and guardrails\n- Collect qualitative feedback\n\n## Phase 4 — Decide\n- Expand, iterate, or stop based on evidence\n- Update PRD, roadmap, and stakeholder communication`,
    documents = [
      ["PRD", "Complete product requirements", "pm-copilot-prd.md", enrichDocument("PRD", prd, project)],
      ["BRD", "Business needs and scope", "pm-copilot-brd.md", enrichDocument("BRD", brd, project)],
      ["Executive summary", "Leadership decision brief", "pm-copilot-executive-summary.md", enrichDocument("Executive summary", executive, project)],
      ["User stories", "Stories and acceptance criteria", "pm-copilot-user-stories.md", enrichDocument("User stories", stories, project)],
      ["Experiment plan", "Metrics, hypothesis and guardrails", "pm-copilot-experiment-plan.md", enrichDocument("Experiment plan", experiment, project)],
      ["MVP roadmap", "Phased delivery plan", "pm-copilot-roadmap.md", enrichDocument("MVP roadmap", roadmap, project)],
    ] as const,
    fullPack = documents.map((document) => document[3]).join("\n\n---\n\n"),
    activeDocument = documents[selectedDocumentIndex];
  return (
    <Shell
      eyebrow="Product plan"
      title="Decision ready"
      description="The approved problem, selected solution, priority assumptions, experiment, metrics, MVP and OKRs are assembled into one plan."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white md:col-span-2">
          <div className="text-xs uppercase tracking-widest text-indigo-100">
            Primary recommendation
          </div>
          <h2 className="mt-2 text-2xl font-semibold">{solution.name}</h2>
          <p className="mt-3 text-sm leading-6 text-indigo-50">
            {solution.description}
          </p>
        </div>
        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Approved RICE
          </div>
          <div className="mt-3 text-5xl font-semibold">
            {project.rice?.score}
          </div>
        </div>
      </div>
      {recommendations.length > 1 && (
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">All approved recommendations</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {recommendations.map((item, index) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-semibold text-indigo-600">Recommendation {index + 1}</div><div className="mt-1 font-semibold">{item.name}</div><p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p></div>)}
          </div>
        </div>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <PlanCard
          icon={Target}
          title="North Star"
          items={[plan.northStar, `Primary: ${plan.primaryMetric}`]}
        />
        <PlanCard
          icon={Lightbulb}
          title="Experiment"
          items={[plan.hypothesis, plan.successRule]}
        />
        <PlanCard icon={Zap} title="MVP scope" items={plan.mvp} />
        <PlanCard
          icon={BarChart3}
          title="OKRs & guardrails"
          items={[
            ...plan.okrs,
            ...plan.guardrails.map((x) => `Guardrail: ${x}`),
          ]}
        />
      </div>
      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-[.16em] text-indigo-600">PM document centre</div>
        <h2 className="mt-1 text-2xl font-semibold">Ready-to-use product documents</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {documents.map(([title, description], index) => (
            <button key={title} onClick={() => setSelectedDocumentIndex(index)} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md ${selectedDocumentIndex === index ? "border-indigo-500 ring-4 ring-indigo-50" : "border-slate-200"}`}>
              <div className="flex items-center justify-between"><span className="font-semibold">{title}</span><Eye size={16} className="text-indigo-600" /></div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
              <p className="mt-3 text-xs font-semibold text-indigo-600">View document</p>
            </button>
          ))}
        </div>
        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <div><div className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600">Document preview</div><h3 className="mt-1 text-lg font-semibold">{activeDocument[0]}</h3></div>
            <Button onClick={() => saveBlob(activeDocument[2], activeDocument[3], "text/markdown")} className="rounded-xl bg-indigo-600"><Download size={16} /> Download this document</Button>
          </div>
          <div className="max-h-[680px] overflow-y-auto p-5 md:p-8"><DocumentPreview content={activeDocument[3]} /></div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          onClick={() => saveBlob("pm-copilot-complete-document-pack.md", fullPack, "text/markdown")}
          className="rounded-xl bg-indigo-600"
        >
          <Download size={16} />
          Download complete document pack
        </Button>
        <Button
          onClick={() =>
            saveBlob(
              "pm-copilot-project.json",
              JSON.stringify(project, null, 2),
            )
          }
          variant="outline"
          className="rounded-xl"
        >
          <Download size={16} />
          Export project data
        </Button>
        <Button onClick={create} variant="ghost" className="rounded-xl">
          <Plus size={16} />
          Start another request
        </Button>
      </div>
    </Shell>
  );
}
function DocumentPreview({ content }: { content: string }) {
  return (
    <article className="max-w-none space-y-2 text-slate-700">
      {content.split("\n").map((line, index) => {
        if (line.startsWith("# ")) return <h1 key={index} className="mb-6 text-3xl font-semibold tracking-tight text-slate-950">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={index} className="mb-2 mt-7 border-b border-slate-100 pb-2 text-xl font-semibold text-slate-900">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={index} className="mb-1 mt-5 font-semibold text-slate-900">{line.slice(4)}</h3>;
        if (line.startsWith("- ")) return <div key={index} className="ml-2 flex gap-2 text-sm leading-6"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-indigo-400" />{line.slice(2)}</div>;
        if (/^\d+\. /.test(line)) return <p key={index} className="ml-2 text-sm leading-6">{line}</p>;
        if (!line.trim()) return <div key={index} className="h-1" />;
        return <p key={index} className="text-sm leading-7">{line.replace(/\*\*/g, "")}</p>;
      })}
    </article>
  );
}
function PlanCard({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={17} />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="mt-4 space-y-2">
        {toStringArray(items).map((x) => (
          <div key={x} className="flex gap-2 text-sm leading-6 text-slate-600">
            <Check size={15} className="mt-1 shrink-0 text-emerald-500" />
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}
