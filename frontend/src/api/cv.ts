import type {
  AnalyzeResponse,
  GenerateFixRewriteRequest,
  GenerateFixRewriteResponse,
  UploadPreviewResponse,
} from "../types/cv";

async function parseErrorMessage(response: Response) {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;
    return `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function uploadCv(file: File, signal?: AbortSignal) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/api/cv/upload", {
    method: "POST",
    body: form,
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as UploadPreviewResponse;
}

export async function analyzeCv(file: File, signal?: AbortSignal) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/api/cv/analyze", {
    method: "POST",
    body: form,
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as AnalyzeResponse;
}

export async function generateFixRewrite(
  payload: GenerateFixRewriteRequest,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/cv/generate-fix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as GenerateFixRewriteResponse;
}
