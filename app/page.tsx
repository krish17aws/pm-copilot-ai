"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Download,
  FileSpreadsheet,
  Lightbulb,
  MessageSquareText,
  Plus,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  buildAnalysis,
  buildPlan,
  buildProblem,
  buildSolutions,
  mockDiscoveryReply,
  newProject,
  parseCsv,
  FileSummary,
  ProblemBrief,
  Project,
  stages,
} from "@/lib/pm-engine";
const STORAGE = "pm-copilot-ts-projects-v2";
const saveBlob = (name: string, content: string, type = "application/json") => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]),
    [activeId, setActiveId] = useState(""),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE),
      list: Project[] = raw ? JSON.parse(raw) : [newProject()];
    setProjects(list);
    setActiveId(list[0].id);
    setReady(true);
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
            Practice mode
          </Badge>
          <Button
            onClick={create}
            size="sm"
            className="rounded-xl bg-slate-950"
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
                    <div className="flex items-center gap-2">
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
                    </div>
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
    project.applicationName || "",
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
    update({ fileName: file.name, fileSummary: summary });
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
            onChange={(event) => setApplicationName(event.target.value)}
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
                  onClick={() => setRequestType(type)}
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
            APIs. For this portfolio version, CSV is the enabled data source
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
      {project.fileSummary && (
        <DataAnalytics summary={project.fileSummary} />
      )}
      <Button
        onClick={continueToChat}
        disabled={!canContinue}
        className="mt-5 rounded-xl bg-indigo-600"
      >
        Continue to Gemini discovery <ArrowRight size={16} />
      </Button>
      {!canContinue && (
        <p className="mt-2 text-xs text-slate-500">
          Application, request type and CSV are all required.
        </p>
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
    let reply = mockDiscoveryReply(project, input);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 16000);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "discovery", project: base }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) reply = data;
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
      update({
        rawRequest: base.rawRequest,
        name: base.name,
        messages: [...base.messages, assistant],
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
  const file = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file.");
      return;
    }
    const summary = parseCsv(await f.text());
    update({ fileName: f.name, fileSummary: summary });
    toast.success(`${summary.rows.toLocaleString()} rows understood`);
  };
  const next = (without = false) => {
    const temp = { ...project, evidenceNotes: without ? "" : notes };
    update({
      evidenceNotes: temp.evidenceNotes,
      problem: buildProblem(temp),
      stage: "problem",
    });
  };
  return (
    <Shell
      eyebrow="Evidence"
      title="Strengthen the decision"
      description="Add feedback or product data if available. Evidence is helpful, not mandatory—the plan clearly labels assumptions."
    >
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-3">
          <label className="mb-2 block text-sm font-semibold">
            User feedback or research notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste interview notes, complaints, survey findings, or current metrics…"
            className="min-h-44 rounded-2xl"
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => next(false)}
              className="rounded-xl bg-indigo-600"
            >
              Continue with evidence
              <ArrowRight size={16} />
            </Button>
            <Button
              onClick={() => next(true)}
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
          <h3 className="mt-4 font-semibold">Upload product data</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            CSV is inspected for structure and missing values. The original file
            is never changed.
          </p>
          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-indigo-700">
            <Upload size={16} />
            Choose CSV
            <Input
              type="file"
              accept=".csv"
              onChange={file}
              className="hidden"
            />
          </label>
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
              <Accordion type="single" collapsible>
                <AccordionItem value="columns">
                  <AccordionTrigger className="text-xs">
                    Review detected columns
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-1">
                      {project.fileSummary.columns.map((c) => (
                        <Badge key={c} variant="secondary">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
        onClick={() =>
          update({ solutions: buildSolutions(project), stage: "solutions" })
        }
        className="mt-5 rounded-xl bg-indigo-600"
      >
        Continue to solution workshop
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
  const [selected, setSelected] = useState(project.selectedSolutionId || "");
  return (
    <Shell
      eyebrow="Solution workshop"
      title="Explore before you converge"
      description="Compare distinct approaches, then select one for RICE evaluation. The score is never invented silently by AI."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {project.solutions!.map((s, i) => (
          <button
            onClick={() => setSelected(s.id)}
            key={s.id}
            className={`relative rounded-3xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${selected === s.id ? "border-indigo-500 ring-4 ring-indigo-50" : "border-slate-200"}`}
          >
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-slate-950 font-semibold text-white">
                0{i + 1}
              </div>
              {selected === s.id && (
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
      <Button
        disabled={!selected}
        onClick={() => update({ selectedSolutionId: selected, stage: "rice" })}
        className="mt-5 rounded-xl bg-indigo-600"
      >
        Evaluate selected solution
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
function PlanView({
  project,
  create,
}: {
  project: Project;
  create: () => void;
}) {
  const plan = project.plan!,
    solution = project.solutions!.find(
      (s) => s.id === project.selectedSolutionId,
    )!,
    markdown = `# ${project.problem?.title}\n\n## Problem\n${project.problem?.problem}\n\n## Selected solution\n${solution.name}: ${solution.description}\n\n## RICE\n${project.rice?.score}\n\n## North Star\n${plan.northStar}\n\n## Hypothesis\n${plan.hypothesis}\n\n## MVP\n${plan.mvp.map((x) => `- ${x}`).join("\n")}\n\n## OKRs\n${plan.okrs.map((x) => `- ${x}`).join("\n")}`;
  return (
    <Shell
      eyebrow="Product plan"
      title="Decision ready"
      description="The approved problem, selected solution, priority assumptions, experiment, metrics, MVP and OKRs are assembled into one plan."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white md:col-span-2">
          <div className="text-xs uppercase tracking-widest text-indigo-100">
            Selected solution
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
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          onClick={() =>
            saveBlob("pm-copilot-plan.md", markdown, "text/markdown")
          }
          className="rounded-xl bg-indigo-600"
        >
          <Download size={16} />
          Download product plan
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
        {items.map((x) => (
          <div key={x} className="flex gap-2 text-sm leading-6 text-slate-600">
            <Check size={15} className="mt-1 shrink-0 text-emerald-500" />
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}
