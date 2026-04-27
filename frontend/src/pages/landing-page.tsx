import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadCv } from "../api/cv";
import { FileDropzone } from "../components/file-dropzone";
import { SectionHeader } from "../components/section-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { useCv } from "../state/cv-context";

export default function LandingPage() {
  const navigate = useNavigate();
  const { file, filename, preview, setFile, setPreview, queueAnalysis } = useCv();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const onFileSelected = async (nextFile: File) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setError(null);
    setUploading(true);
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
        <div className="space-y-4">
          <Badge variant="indigo" className="w-fit">
            CV Analyzer
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            A modern CV report with clear next steps
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600">
            Upload your CV and get job matches, missing skills, and practical actions
            you can complete this week — grounded in evidence from your CV and the
            matched roles.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white/70 p-5 shadow-soft">
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
                Confirm extracted text.
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium text-slate-500">Step 3</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">Analyze</div>
              <div className="mt-1 text-sm text-slate-600">
                View actions and results.
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
              We’ll show a quick preview first, then you can run the full analysis.
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
                      Preview shows the first 500 characters.
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
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                    {preview}
                  </pre>
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
