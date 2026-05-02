import { ExternalLink, RotateCcw, WandSparkles } from "lucide-react";
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

  const matchByTitle = useMemo(() => {
    const map = new Map<string, (typeof jobMatches)[number]>();
    for (const m of jobMatches) {
      if (!m?.title) continue;
      map.set(m.title.trim().toLowerCase(), m);
    }
    return map;
  }, [jobMatches]);

  const evaluatedCount = effective.report.all_jobs?.length ?? jobsSorted.length ?? 0;

  const jobsSorted = useMemo<MatchedJob[]>(() => {
    const jobs = (effective.report.matched_jobs ?? []).slice();
    jobs.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return jobs;
  }, [effective.report.matched_jobs]);

  const allJobs = useMemo<MatchedJob[]>(() => {
    return (effective.report.all_jobs ?? []).slice();
  }, [effective.report.all_jobs]);

  const jobsToShow = useMemo<MatchedJob[]>(() => {
    return jobsView === "all" ? allJobs : jobsSorted;
  }, [jobsView, allJobs, jobsSorted]);

  const overviewActions: TopAction[] = topActions.slice(0, 3);
  const overviewJobs = jobsSorted.slice(0, 3);
  const overviewSkills: MissingSkill[] = missingSkills.slice(0, 2);
  const overviewRewrites = quickRewriteCandidates.slice(0, 2);

  const createdLabel = formatDateTime(effective.createdAt);
  const rawJson = JSON.stringify(effective.report, null, 2);
  const cvText = effective.report.cv_text || "";

  const onStartOver = () => {
    startOver();
    navigate("/", { replace: true });
  };

  return (
    <div className="space-y-6">
      <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Your CV Report</CardTitle>
                <CardDescription className="mt-1">
                  {effective.filename}
                  {createdLabel ? ` | ${createdLabel}` : ""}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={onStartOver}>
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </Button>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline">
                    Raw JSON
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {analysis.error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {analysis.error}
              </div>
            ) : (
              null
            )}

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Actions ({topActions.length})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({jobsSorted.length}/{evaluatedCount})</TabsTrigger>
          <TabsTrigger value="skills">Missing Skills ({missingSkills.length})</TabsTrigger>
          <TabsTrigger value="improve">Improve CV ({quickRewriteCandidates.length})</TabsTrigger>
          <TabsTrigger value="improvements">Project Improvements ({projectImprovements.length})</TabsTrigger>
          <TabsTrigger value="links">Links ({effective.report.links?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick rewrites</CardTitle>
                  <CardDescription>
                    Instant CV-only changes you can generate and paste directly into your resume.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overviewRewrites.length ? (
                    <>
                      {overviewRewrites.map((candidate, index) => (
                        <div
                          key={`${candidate.section}-${candidate.source}-${index}`}
                          className="rounded-lg border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900">
                                {candidate.section}
                              </div>
                              <p className="mt-2 text-sm text-slate-700">{candidate.fix}</p>
                            </div>
                            <Badge variant="indigo" className="shrink-0">
                              Rewrite-ready
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("improve")}
                      >
                        <WandSparkles className="h-4 w-4" />
                        Open improve tab
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-slate-600">No instant rewrites returned.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top actions</CardTitle>
                  <CardDescription>
                    The highest-value next steps that require more than a quick resume edit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overviewActions.length ? (
                    overviewActions.map((a, idx) => (
                      <div key={`${a.action}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">
                              {idx + 1}. {a.action}
                            </div>
                            {!sectionEmpty(a.section) ? (
                              <div className="mt-1 text-xs text-slate-500">{a.section}</div>
                            ) : null}
                          </div>
                          <Badge variant="indigo" className="shrink-0">
                            This week
                          </Badge>
                        </div>
                        {!sectionEmpty(a.why) ? (
                          <p className="mt-3 text-sm text-slate-700">{a.why}</p>
                        ) : null}
                        {!sectionEmpty(a.how) ? (
                          <p className="mt-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-900">How:</span>{" "}
                            {a.how}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600">
                      No slower workflow actions returned after promoting CV-only edits to quick rewrites.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Best matches</CardTitle>
                  <CardDescription>
                    Top roles based on your CV and job data. Match score is a fit signal
                    inside this app, not a hiring probability.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overviewJobs.length ? (
                    overviewJobs.map((job) => {
                      const jm = matchByTitle.get(job.title.trim().toLowerCase());
                      return (
                        <div key={job.id} className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900">{job.title}</div>
                              {job.matched_skills?.length ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {job.matched_skills.slice(0, 6).map((s) => (
                                    <Badge key={s} variant="slate">
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <div className="shrink-0">
                              <ScorePill score={job.score ?? 0} />
                            </div>
                          </div>
                          {jm?.reason ? (
                            <p className="mt-3 text-sm text-slate-700">{jm.reason}</p>
                          ) : null}
                          {jm?.gap ? (
                            <p className="mt-2 text-sm text-slate-600">
                              <span className="font-semibold text-slate-900">Gap:</span>{" "}
                              {jm.gap}
                            </p>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-600">No matches returned.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top missing skills</CardTitle>
                  <CardDescription>Highest-impact gaps to close next.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overviewSkills.length ? (
                    overviewSkills.map((s, idx) => (
                      <div key={`${s.skill}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">{s.skill}</div>
                          <Badge
                            variant={
                              String(s.priority).toUpperCase() === "HIGH"
                                ? "red"
                                : String(s.priority).toUpperCase() === "MEDIUM"
                                  ? "amber"
                                  : "slate"
                            }
                          >
                            {String(s.priority).toUpperCase()}
                          </Badge>
                        </div>
                        {s.project ? (
                          <div className="mt-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">Suggested:</span>{" "}
                            {s.project}
                          </div>
                        ) : null}
                        {s.project_idea ? (
                          <div className="mt-2 text-sm text-slate-600">{s.project_idea}</div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600">No missing skills returned.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Top actions</CardTitle>
              <CardDescription>
                Clear deliverables you can complete this week, excluding instant CV-only edits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topActions.length ? (
                topActions.map((a, idx) => (
                  <div key={`${a.action}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      {idx + 1}. {a.action}
                    </div>
                    {a.section ? (
                      <div className="mt-1 text-xs text-slate-500">{a.section}</div>
                    ) : null}
                    {a.why ? <p className="mt-3 text-sm text-slate-700">{a.why}</p> : null}
                    {a.how ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">How:</span>{" "}
                        {a.how}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-600">No non-CV workflow actions returned.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>
                Compare matched jobs against the full pool the pipeline evaluated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={jobsView === "matched" ? "default" : "outline"}
                  onClick={() => setJobsView("matched")}
                >
                  Matched jobs ({jobsSorted.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={jobsView === "all" ? "default" : "outline"}
                  onClick={() => setJobsView("all")}
                >
                  All jobs ({allJobs.length})
                </Button>
              </div>

              {jobsToShow.length ? (
                jobsToShow.map((job) => {
                  const jm = matchByTitle.get(job.title.trim().toLowerCase());
                  return (
                    <div key={job.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{job.title}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {jobsView === "matched" ? "Match score" : "Evaluated job pool"}
                          </div>
                          {job.matched_skills?.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {job.matched_skills.map((s) => (
                                <Badge key={s} variant="slate">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        {jobsView === "matched" ? <ScorePill score={job.score ?? 0} /> : null}
                      </div>

                      {jm?.reason ? (
                        <p className="mt-4 text-sm text-slate-700">{jm.reason}</p>
                      ) : null}
                      {jm?.evidence ? (
                        <p className="mt-2 text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">Evidence:</span>{" "}
                          {jm.evidence}
                        </p>
                      ) : null}
                      {jm?.gap ? (
                        <p className="mt-2 text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">Gap:</span>{" "}
                          {jm.gap}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {job.url ? (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                          >
                            Open job page
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        ) : null}
                        {job.company_name ? (
                          <div className="text-xs text-slate-500">{job.company_name}</div>
                        ) : null}
                      </div>

                      {job.description ? (
                        <>
                          <Separator className="my-4" />
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-indigo-700 underline-offset-4 group-open:underline">
                              Job description
                            </summary>
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                              {stripHtml(job.description)}
                            </p>
                          </details>
                        </>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-600">No jobs returned.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Missing skills</CardTitle>
              <CardDescription>High-impact gaps with practical projects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {missingSkills.length ? (
                missingSkills.map((s, idx) => (
                  <div key={`${s.skill}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{s.skill}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge
                            variant={
                              String(s.priority).toUpperCase() === "HIGH"
                                ? "red"
                                : String(s.priority).toUpperCase() === "MEDIUM"
                                  ? "amber"
                                  : "slate"
                            }
                          >
                            {String(s.priority).toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {String(s.project_type || "existing").toLowerCase() === "new"
                              ? "New project"
                              : "Existing project"}
                          </Badge>
                        </div>
                      </div>
                      {s.project ? <Badge variant="indigo">{s.project}</Badge> : null}
                    </div>

                    {s.why ? <p className="mt-3 text-sm text-slate-700">{s.why}</p> : null}
                    {s.project_idea ? (
                      <p className="mt-2 text-sm text-slate-600">{s.project_idea}</p>
                    ) : null}
                    {s.implementation ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Implementation:</span>{" "}
                        {s.implementation}
                      </p>
                    ) : null}
                    {s.evidence ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Evidence:</span>{" "}
                        {s.evidence}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-600">No missing skills returned.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements">
          <Card>
            <CardHeader>
              <CardTitle>Project improvements</CardTitle>
              <CardDescription>Concrete upgrades for existing projects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectImprovements.length ? (
                projectImprovements.map((p, idx) => (
                  <div key={`${p.project}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">{p.project}</div>
                    {p.current_issue ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Current issue:</span>{" "}
                        {p.current_issue}
                      </p>
                    ) : null}
                    {p.improvement ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Improvement:</span>{" "}
                        {p.improvement}
                      </p>
                    ) : null}
                    {p.impact ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Impact:</span>{" "}
                        {p.impact}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-600">No project improvements returned.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improve">
          <Card>
            <CardHeader>
              <CardTitle>Improve CV</CardTitle>
              <CardDescription>
                Quick rewrites and CV fixes are merged here so one tab handles both guidance and paste-ready replacements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {quickRewriteCandidates.length ? (
                <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <WandSparkles className="h-4 w-4 text-indigo-600" />
                        Quick rewrites available
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        These can be turned into copy-ready text or LaTeX snippets instantly.
                      </p>
                    </div>
                  </div>
                  {!cvText ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      This report was created before CV text was stored with the analysis. Run the analysis again to generate rewrites.
                    </div>
                  ) : (
                    quickRewriteCandidates.map((candidate, index) => (
                      <QuickRewriteCard
                        key={`${candidate.section}-${candidate.source}-${index}`}
                        candidate={candidate}
                        cvText={cvText}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-600">No CV improvements returned.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>Detected from your CV.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {effective.report.links?.length ? (
                (() => {
                  const mailto = effective.report.links.filter((l) => l.startsWith("mailto:"));
                  const rest = effective.report.links.filter((l) => !l.startsWith("mailto:"));
                  const ordered = [...mailto, ...rest];
                  return ordered.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span className="truncate">{safeUrlLabel(link)}</span>
                      <ExternalLink className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </a>
                  ));
                })()
              ) : (
                <div className="text-sm text-slate-600">No links returned.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {!report && stored ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loaded report from this session.
          <Button
            type="button"
            variant="link"
            className="ml-2 h-auto p-0 text-indigo-700"
            onClick={() => {
              setReport(stored.report, stored.filename, stored.createdAt);
            }}
          >
            Keep in app state
          </Button>
        </div>
      ) : null}
    </div>
  );
}
