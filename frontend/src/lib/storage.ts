import type { StoredReport } from "../types/cv";

const KEY = "cv_report_v1";

export function loadStoredReport(): StoredReport | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReport;
    if (!parsed?.filename || !parsed?.createdAt || !parsed?.report) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredReport(value: StoredReport) {
  sessionStorage.setItem(KEY, JSON.stringify(value));
}

export function clearStoredReport() {
  sessionStorage.removeItem(KEY);
}

