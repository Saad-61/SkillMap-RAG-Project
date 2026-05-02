import { ExternalLink, RotateCcw, Zap, Briefcase, Target, Wrench, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { QuickRewriteCard } from "../components/quick-rewrite-card";
import { CopyButton } from "../components/copy-button";
import { ScorePill } from "../components/score-pill";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatDateTime, safeUrlLabel, stripHtml } from "../lib/utils";
import { loadStoredReport } from "../lib/storage";
import { useCv } from "../state/cv-context";
import type {
  AnalyzeResponse,
  MatchedJob,
  MissingSkill,
  QuickRewriteCandidate,
  StoredReport,
  TopAction,
} from "../types/cv";

function priorityWeight(priority: string) {
  const p = String(priority || "").toUpperCase();
  if (p === "HIGH") return 3;
  if (p === "MEDIUM") return 2;
  if (p === "LOW") return 1;
  return 0;
}

function sectionEmpty(text: string | undefined) {
  return !text || !text.trim();
}

function buildQuickRewriteCandidates(report: AnalyzeResponse): QuickRewriteCandidate[] {
  const analysis = report.analysis || {};
  const candidates: QuickRewriteCandidate[] = [];
  for (const fix of analysis.cv_fixes ?? []) {
    const section = String(fix.section || "").trim();
    if (!section) continue;
    candidates.push({
      section,
      fix: String(fix.fix || "").trim(),
      why: String(fix.why || "").trim(),
      how: String(fix.how || "").trim(),
      source: "cv_fix",
    });
  }
  return candidates;
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job, showScore }: { job: MatchedJob; showScore: boolean }) {
  const score = job.score ?? 0;
  const pct = Math.min(Math.round(score), 100);
  const barColor =
    pct >= 60 ? "bg-green-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-400";
  const textColor =
    pct >= 60 ? "text-green-600" : pct >= 40 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{job.title}</div>
          {job.company_name && (
            <div className="mt-0.5 text-xs text-slate-500">{job.company_name}</div>
          )}
        </div>
        {showScore && (
          <span className={`shrink-0 text-xl font-bold ${textColor}`}>{pct}%</span>
        )}
      </div>

      {showScore && (
        <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {job.matched_skills?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.matched_skills.slice(0, 6).map((s) => (
            <span
              key={s}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
          >
            Apply <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      {job.description ? (
        <>
          <Separator className="my-3" />
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-purple-700 group-open:underline">
              View description
            </summary>
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">
              {stripHtml(job.description).slice(0, 600)}…
            </p>
          </details>
        </>
      ) : null}
    </div>
  );
}

// ── Skill Card ────────────────────────────────────────────────────────────────
function SkillCard({ skill, idx }: { skill: MissingSkill; idx: number }) {
  const isNew =
    String(skill.project_type || "").toLowerCase() === "new";
  const priority = String(skill.priority || "").toUpperCase();

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        isNew ? "border-l-4 border-l-violet-500" : "border-l-4 border-l-amber-500"
      } border-slate-200`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{skill.skill}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                priority === "HIGH"
                  ? "bg-red-50 text-red-600"
                  : priority === "MEDIUM"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {priority}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                isNew
                  ? "bg-violet-50 text-violet-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {isNew ? "New project" : "Add to existing"}
            </span>
          </div>
        </div>
        {skill.project ? (
          <span className="shrink-0 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
            {skill.project}
          </span>
        ) : null}
      </div>

      {skill.why || skill.project_idea ? (
        <div className="mt-3 space-y-1 text-xs text-slate-600">
          {skill.why && (
            <div><span className="font-semibold text-slate-800">Why:</span> {skill.why}</div>
          )}
          {skill.project_idea && (
            <div><span className="font-semibold text-slate-800">How:</span> {skill.project_idea}</div>
          )}
          {skill.implementation && (
            <div><span className="font-semibold text-slate-800">Where:</span> {skill.implementation}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Action Item ───────────────────────────────────────────────────────────────
function ActionItem({ action, idx }: { action: TopAction; idx: number }) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-bold text-white">
        {idx + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-900">{action.action}</div>
        {!sectionEmpty(action.section) && (
          <div className="mt-0.5 text-xs text-slate-500">{action.section}</div>
        )}
        {action.why || action.how ? (
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            {action.why && (
              <div><span className="font-semibold text-slate-800">Why:</span> {action.why}</div>
            )}
            {action.how && (
              <div><span className="font-semibold text-slate-800">How:</span> {action.how}</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate();
  const { report, filename, createdAt, setReport, startOver } = useCv();
  const [rawOpen, setRawOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [jobsView, setJobsView] = useState<"matched" | "all">("matched");

  const stored = useMemo<StoredReport | null>(() => loadStoredReport(), []);
  const effective: { report: AnalyzeResponse; filename: string; createdAt: string } | null =
    report && createdAt
      ? { report, filename, createdAt }
      : stored
        ? { report: stored.report, filename: stored.filename, createdAt: stored.createdAt }
        : null;

  if (!effective) return <Navigate to="/" replace />;

  const analysis = effective.report.analysis || {};
  const jobMatches = analysis.job_matches ?? [];
  const missingSkills = (analysis.missing_skills ?? [])
    .slice()
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
  const projectImprovements = analysis.project_improvements ?? [];
  const quickRewriteCandidates = buildQuickRewriteCandidates(effective.report);
  const topActions = analysis.top_actions ?? [];

  const jobsSorted = useMemo<MatchedJob[]>(() => {
    const jobs = (effective.report.matched_jobs ?? []).slice();
    jobs.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return jobs;
  }, [effective.report.matched_jobs]);

  const allJobs = useMemo<MatchedJob[]>(
    () => (effective.report.all_jobs ?? []).slice(),
    [effective.report.all_jobs]
  );

  const jobsToShow = jobsView === "all" ? allJobs : jobsSorted;
  const evaluatedCount = allJobs.length || jobsSorted.length;

  const createdLabel = formatDateTime(effective.createdAt);
  const rawJson = JSON.stringify(effective.report, null, 2);
  const cvText = effective.report.cv_text || "";
  const resumeScore = effective.report.resume_score ?? null;

  const onStartOver = () => {
    startOver();
    navigate("/", { replace: true });
  };

  return (
    <div className="space-y-5">
      {/* ── Header card ── */}
      <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Your CV Report</CardTitle>
                <CardDescription className="mt-1">
                  {effective.filename}
                  {createdLabel ? ` · ${createdLabel}` : ""}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {resumeScore !== null && (
                  <div className="flex flex-col items-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">Resume Score</span>
                      <ScorePill score={resumeScore} />
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500 leading-tight max-w-[200px]">
                      Based on skill count, project mentions &amp; links detected in your CV
                    </div>
                  </div>
                )}
                <Button type="button" variant="outline" onClick={onStartOver}>
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </Button>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline">Raw JSON</Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {analysis.error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {analysis.error}
              </div>
            ) : null}
            <CollapsibleContent className="mt-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">Raw response</div>
                  <CopyButton value={rawJson} label="Copy" />
                </div>
                <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                  {rawJson}
                </pre>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* ── Hero: Top Actions Banner ── */}
      {topActions.length > 0 && (
        <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-purple-600" />
            <span className="font-bold text-purple-900 text-base">Top Actions — Do This Next</span>
          </div>
          <div className="space-y-2">
            {topActions.slice(0, 3).map((a, idx) => (
              <div key={`hero-${idx}`} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-700 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div>
                  <span className="font-semibold text-slate-800">{a.action}</span>
                  {!sectionEmpty(a.section) && (
                    <span className="ml-2 text-xs text-slate-500">· {a.section}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {topActions.length > 3 && (
            <button
              onClick={() => setActiveTab("overview")}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline"
            >
              See all {topActions.length} actions <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Links from CV (compact) ── */}
      {(effective.report.links?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Links detected in CV
          </div>
          <div className="flex flex-wrap gap-2">
            {effective.report.links!.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {safeUrlLabel(link)} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> Jobs
            <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-semibold text-purple-700">
              {jobsSorted.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" /> Skills Gap
            <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
              {missingSkills.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="improvements" className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" /> Improvements
            <span className="ml-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
              {quickRewriteCandidates.length + projectImprovements.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Left: Actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Concrete next steps beyond your CV.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("overview")}>
                    All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {topActions.length ? (
                  topActions.slice(0, 3).map((a, idx) => (
                    <ActionItem key={`ov-act-${idx}`} action={a} idx={idx} />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No actions returned.</div>
                )}
              </CardContent>
            </Card>

            {/* Right: Best Job Matches */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Best Matches</CardTitle>
                    <CardDescription>Top roles by match score.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("jobs")}>
                    See all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {jobsSorted.length ? (
                  jobsSorted.slice(0, 3).map((job) => (
                    <JobCard key={job.id} job={job} showScore />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No matches returned.</div>
                )}
              </CardContent>
            </Card>

            {/* Bottom left: Top missing skills */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Skills Gap</CardTitle>
                    <CardDescription>Highest-impact gaps to close next.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("skills")}>
                    See all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {missingSkills.length ? (
                  missingSkills.slice(0, 2).map((s, idx) => (
                    <SkillCard key={`ov-sk-${idx}`} skill={s} idx={idx} />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No missing skills returned.</div>
                )}
              </CardContent>
            </Card>

            {/* Bottom right: Quick rewrites */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quick Rewrites</CardTitle>
                    <CardDescription>Instant CV-only fixes ready to paste.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("improvements")}>
                    Open
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickRewriteCandidates.length ? (
                  quickRewriteCandidates.slice(0, 2).map((c, idx) => (
                    <div
                      key={`ov-rw-${idx}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">{c.section}</div>
                        <Badge variant="indigo" className="shrink-0">Rewrite-ready</Badge>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-600">{c.fix}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No rewrites returned.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Jobs Tab ── */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Matches</CardTitle>
              <CardDescription>
                {jobsSorted.length} matched · {evaluatedCount} total evaluated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button" size="sm"
                  variant={jobsView === "matched" ? "default" : "outline"}
                  onClick={() => setJobsView("matched")}
                >
                  Matched ({jobsSorted.length})
                </Button>
                <Button
                  type="button" size="sm"
                  variant={jobsView === "all" ? "default" : "outline"}
                  onClick={() => setJobsView("all")}
                >
                  All ({allJobs.length})
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {jobsToShow.length ? (
                  jobsToShow.map((job) => (
                    <JobCard key={job.id} job={job} showScore={jobsView === "matched"} />
                  ))
                ) : (
                  <div className="col-span-2 text-sm text-slate-500">No jobs returned.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Skills Gap Tab ── */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Gap</CardTitle>
              <CardDescription>
                <span className="mr-4 inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />
                  Add to existing project
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-violet-500" />
                  Build new project
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {missingSkills.length ? (
                missingSkills.map((s, idx) => (
                  <SkillCard key={`sk-${idx}`} skill={s} idx={idx} />
                ))
              ) : (
                <div className="text-sm text-slate-500">No missing skills returned.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Improvements Tab (rewrites + project improvements) ── */}
        <TabsContent value="improvements">
          <div className="space-y-5">
            {/* CV Quick Rewrites */}
            <Card>
              <CardHeader>
                <CardTitle>CV Quick Rewrites</CardTitle>
                <CardDescription>Generate and paste directly into your resume.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickRewriteCandidates.length ? (
                  !cvText ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      This report was created before CV text was stored. Re-analyze to generate rewrites.
                    </div>
                  ) : (
                    quickRewriteCandidates.map((candidate, index) => (
                      <QuickRewriteCard
                        key={`${candidate.section}-${candidate.source}-${index}`}
                        candidate={candidate}
                        cvText={cvText}
                      />
                    ))
                  )
                ) : (
                  <div className="text-sm text-slate-500">No CV improvements returned.</div>
                )}
              </CardContent>
            </Card>

            {/* Project Improvements */}
            {projectImprovements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Improvements</CardTitle>
                  <CardDescription>Concrete upgrades for existing projects.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projectImprovements.map((p, idx) => (
                    <div
                      key={`pi-${idx}`}
                      className="rounded-xl border-l-4 border-l-green-500 border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="font-semibold text-slate-900">{p.project}</div>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        {p.current_issue && (
                          <div><span className="font-semibold text-slate-800">Issue:</span> {p.current_issue}</div>
                        )}
                        {p.improvement && (
                          <div><span className="font-semibold text-slate-800">Fix:</span> {p.improvement}</div>
                        )}
                        {p.impact && (
                          <div><span className="font-semibold text-slate-800">Impact:</span> {p.impact}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {!report && stored ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loaded report from this session.
          <Button
            type="button" variant="link"
            className="ml-2 h-auto p-0 text-indigo-700"
            onClick={() => setReport(stored.report, stored.filename, stored.createdAt)}
          >
            Keep in app state
          </Button>
        </div>
      ) : null}
    </div>
  );
}
