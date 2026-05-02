import { Braces, FilePenLine, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateFixRewrite } from "../api/cv";
import type {
  GenerateFixRewriteResponse,
  QuickRewriteCandidate,
} from "../types/cv";
import { CopyButton } from "./copy-button";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

type RewriteState = {
  plain?: GenerateFixRewriteResponse;
  latex?: GenerateFixRewriteResponse;
};

function extractSectionBlock(cvText: string, section: string, maxLines = 20) {
  const lines = cvText.split(/\r?\n/);
  const target = section.trim().toLowerCase();
  let startIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index].trim().toLowerCase();
    if (!current) continue;
    if (current === target || current.startsWith(`${target} `) || current.startsWith(`${target}:`)) {
      startIndex = index;
      break;
    }
  }

  if (startIndex === -1) {
    return cvText.trim().slice(0, 800);
  }

  const block: string[] = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (block.length > 0 && trimmed && trimmed === trimmed.toUpperCase() && trimmed.length <= 80) {
      break;
    }
    if (block.length > 0 && trimmed.endsWith(":") && trimmed.length <= 40) {
      break;
    }
    block.push(line);
    if (block.length >= maxLines) break;
  }

  return block.join("\n").trim();
}

export function QuickRewriteCard({
  candidate,
  cvText,
}: {
  candidate: QuickRewriteCandidate;
  cvText: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<"plain" | "latex">("plain");
  const [results, setResults] = useState<RewriteState>({});
  const [loadingFormat, setLoadingFormat] = useState<"plain" | "latex" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const current = useMemo(() => results[activeFormat], [activeFormat, results]);
  const sourceSection = useMemo(
    () => extractSectionBlock(cvText, candidate.section),
    [candidate.section, cvText],
  );

  const requestFormat = async (format: "plain" | "latex") => {
    if (results[format]?.rewritten_text) {
      setActiveFormat(format);
      setOpen(true);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setError(null);
    setLoadingFormat(format);
    setActiveFormat(format);
    setOpen(true);

    try {
      const response = await generateFixRewrite(
        {
          cv_text: cvText,
          fix: {
            section: candidate.section,
            fix: candidate.fix,
            why: candidate.why,
            how: candidate.how,
          },
          output_format: format,
        },
        controller.signal,
      );

      setResults((currentResults) => ({
        ...currentResults,
        [format]: response,
      }));
    } catch (requestError) {
      if ((requestError as Error).name === "AbortError") return;
      setError((requestError as Error).message || "Failed to generate rewrite.");
    } finally {
      setLoadingFormat((currentLoading) => (currentLoading === format ? null : currentLoading));
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">{candidate.section}</div>
              <Badge variant={candidate.source === "cv_fix" ? "indigo" : "slate"}>
                {candidate.source === "cv_fix" ? "From CV fix" : "Promoted from action"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-700">{candidate.fix}</p>
          </div>
          <Button type="button" onClick={() => requestFormat("plain")}>
            {loadingFormat === "plain" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FilePenLine className="h-4 w-4" />
            )}
            Generate rewrite
          </Button>
        </div>

        {candidate.why ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Why:</span> {candidate.why}
          </p>
        ) : null}
        {candidate.how ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Guidance:</span> {candidate.how}
          </p>
        ) : null}

        {sourceSection ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Source section
            </div>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
              {sourceSection}
            </pre>
          </div>
        ) : null}

        {open ? (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={activeFormat === "plain" ? "default" : "outline"}
                  onClick={() => requestFormat("plain")}
                >
                  Plain text
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activeFormat === "latex" ? "default" : "outline"}
                  onClick={() => requestFormat("latex")}
                >
                  <Braces className="h-4 w-4" />
                  LaTeX version
                </Button>
              </div>
              {current?.rewritten_text ? <CopyButton value={current.rewritten_text} /> : null}
            </div>

            {loadingFormat === activeFormat ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Drafting your {activeFormat === "latex" ? "LaTeX" : "plain text"} rewrite...
              </div>
            ) : null}

            {error ? <div className="text-sm text-rose-700">{error}</div> : null}

            {current?.rewritten_text ? (
              <>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-4 text-sm leading-relaxed text-slate-700">
                  {current.rewritten_text}
                </pre>
                {current.notes ? (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Paste note:</span>{" "}
                    {current.notes}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
