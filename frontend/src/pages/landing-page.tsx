import {
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadCv } from "../api/cv";
import { FileDropzone } from "../components/file-dropzone";
import { SectionHeader } from "../components/section-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { useCv } from "../state/cv-context";

export default function LandingPage() {
  const navigate = useNavigate();
  const { file, filename, preview, setFile, setPreview, queueAnalysis } = useCv();
  const [uploading, setUploading] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const onFileSelected = async (nextFile: File) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setError(null);
    setUploading(true);
    setPreviewExpanded(false);
    setFile(nextFile);

    try {
      const res = await uploadCv(nextFile, controller.signal);
      setPreview(res.preview, res.filename);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message || "Failed to preview CV.");
      setPreview("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/85 p-6 shadow-soft sm:p-8">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-sky-100 via-emerald-50 to-amber-50 opacity-90" />
          <div className="relative space-y-5">
            <Badge variant="indigo" className="w-fit">
              CV Analyzer
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Turn a CV into a practical job-fit report
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-600">
                Upload your CV and get match scores, missing skills, and a focused set
                of next steps grounded in the roles your profile is closest to.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                <Target className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  Job-fit snapshot
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  See which roles your CV already supports best.
                </div>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  Clear next actions
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Focus on concrete improvements, not generic advice.
                </div>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                <ShieldCheck className="h-5 w-5 text-sky-600" aria-hidden="true" />
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  Readable output
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Keep results organized around what matters most first.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-soft">
          <SectionHeader
            title="How it works"
            description="A simple 3-step flow focused on clarity."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium text-slate-500">Step 1</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">Upload</div>
              <div className="mt-1 text-sm text-slate-600">PDF or DOCX CV.</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium text-slate-500">Step 2</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">Preview</div>
              <div className="mt-1 text-sm text-slate-600">
                Confirm the extracted text before running analysis.
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium text-slate-500">Step 3</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">Analyze</div>
              <div className="mt-1 text-sm text-slate-600">
                View match scores, gaps, and next actions.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-soft">
            <SectionHeader
              title="What you'll get"
              description="A report built for action, not just description."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Match score</div>
                <div className="mt-1 text-sm text-slate-600">
                  A quick signal for how closely your CV overlaps with a role in this tool.
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Skill gaps</div>
                <div className="mt-1 text-sm text-slate-600">
                  Missing areas tied to roles and translated into project ideas.
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">CV fixes</div>
                <div className="mt-1 text-sm text-slate-600">
                  Specific edits for sections that are underselling your fit.
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Top actions</div>
                <div className="mt-1 text-sm text-slate-600">
                  The best short-term changes to improve your profile fastest.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-soft">
            <SectionHeader
              title="How to read scores"
              description="These are match signals inside this app, not hiring probabilities."
            />
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-sm font-semibold text-emerald-900">Above 50</div>
                <div className="mt-1 text-sm text-emerald-800">
                  Stronger overlap with the role based on the current CV and job text.
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-semibold text-amber-900">40 to 50</div>
                <div className="mt-1 text-sm text-amber-800">
                  Partial fit. Good direction, but likely missing important proof or skills.
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="text-sm font-semibold text-rose-900">Below 40</div>
                <div className="mt-1 text-sm text-rose-800">
                  Lower overlap. Useful for exploration, but not a strong current fit.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Upload your CV</CardTitle>
            <CardDescription>
              We'll show the full extracted text first, then you can run the full analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FileDropzone disabled={uploading} onFileSelected={onFileSelected} />

            {filename ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {filename}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Full extracted text preview.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Change file
                  </Button>
                </div>

                <Separator className="my-4" />

                {uploading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : preview ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Scroll to review the extracted text before analysis.
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewExpanded((current) => !current)}
                      >
                        {previewExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Expand
                          </>
                        )}
                      </Button>
                    </div>
                    <pre
                      className={`overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 ${
                        previewExpanded ? "max-h-[32rem]" : "max-h-64"
                      }`}
                    >
                      {preview}
                    </pre>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">
                    No preview yet. Re-upload if needed.
                  </div>
                )}

                {error ? (
                  <div className="mt-3 text-sm text-rose-700">{error}</div>
                ) : null}
              </div>
            ) : null}

            <Button
              type="button"
              className="w-full"
              disabled={!file || uploading}
              onClick={() => {
                if (!queueAnalysis()) return;
                navigate("/analyzing");
              }}
            >
              Analyze CV
            </Button>

            <div className="text-xs leading-relaxed text-slate-500">
              Your file is sent to the backend for analysis. If you want to avoid
              uploading sensitive information, consider using a redacted CV.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
