import { Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeCv } from "../api/cv";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { saveStoredReport } from "../lib/storage";
import { useCv } from "../state/cv-context";

const STATUS = ["Extracting...", "Matching jobs...", "Generating recommendations..."] as const;

export default function AnalyzingPage() {
  const navigate = useNavigate();
  const { analysisRequestId, clearPendingAnalysis, file, filename, setReport } = useCv();
  const controllerRef = useRef<AbortController | null>(null);
  const startedRequestRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const status = STATUS[statusIndex % STATUS.length];

  useEffect(() => {
    if (!file || !analysisRequestId) {
      navigate("/", { replace: true });
      return;
    }

    if (startedRequestRef.current === analysisRequestId) {
      return;
    }
    startedRequestRef.current = analysisRequestId;

    const controller = new AbortController();
    controllerRef.current = controller;
    setError(null);

    const createdAt = new Date().toISOString();

    const tick = setInterval(() => setStatusIndex((i) => i + 1), 1400);

    analyzeCv(file, controller.signal)
      .then((report) => {
        setReport(report, filename || file.name, createdAt);
        saveStoredReport({
          filename: filename || file.name,
          createdAt,
          report,
        });
        navigate("/results", { replace: true });
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        clearPendingAnalysis();
        setError((e as Error).message || "Failed to analyze CV.");
      })
      .finally(() => {
        clearInterval(tick);
      });

    return () => {
      clearInterval(tick);
      if (startedRequestRef.current !== analysisRequestId) {
        controller.abort();
      }
    };
  }, [analysisRequestId, clearPendingAnalysis, file, filename, navigate, setReport]);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Analyzing your CV</CardTitle>
          <CardDescription>
            This usually takes a few seconds. You can cancel anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">{status}</div>
              <div className="mt-1 text-xs text-slate-500">
                Don’t close the tab — we’ll redirect to your report automatically.
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                controllerRef.current?.abort();
                clearPendingAnalysis();
                navigate("/", { replace: true });
              }}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="default" onClick={() => navigate("/", { replace: true })}>
                  Back to upload
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="text-sm font-semibold text-slate-900">
                  Preparing your results
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="mt-3 h-3 w-full" />
                    <Skeleton className="mt-2 h-3 w-5/6" />
                    <Skeleton className="mt-2 h-3 w-4/6" />
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-3 h-3 w-full" />
                    <Skeleton className="mt-2 h-3 w-5/6" />
                    <Skeleton className="mt-2 h-3 w-4/6" />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
