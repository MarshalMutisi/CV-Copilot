const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const groqKey = typeof window !== "undefined" ? localStorage.getItem("groq_api_key") : null;

  const headers: Record<string, string> = {
    ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(groqKey ? { "X-Groq-API-Key": groqKey } : {}),
    ...(init?.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 429) throw new Error("rate_limited");

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export type ApplicationStatus = "applied" | "interview" | "offer" | "rejected";

export interface Application {
  id: string;
  company: string;
  role: string;
  job_url: string | null;
  status: ApplicationStatus;
  match_score: number | null;
  applied_date: string;
  notes: string | null;
  created_at: string;
}

export interface ApplicationCreate {
  company: string;
  role: string;
  job_url?: string;
  status?: ApplicationStatus;
  match_score?: number;
  applied_date?: string;
  notes?: string;
}

export interface ApplicationUpdate {
  company?: string;
  role?: string;
  job_url?: string;
  status?: ApplicationStatus;
  match_score?: number;
  applied_date?: string;
  notes?: string;
}

export interface AskResponse {
  question: string;
  answer: string;
}

export interface JobMatchResponse {
  company: string;
  role: string;
  fit_analysis: string;
  gaps: string;
  cover_letter: string;
}

// ── Applications ─────────────────────────────────────────────────────────────

export const api = {
  applications: {
    list(params?: { status?: string; company?: string }): Promise<Application[]> {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.company) qs.set("company", params.company);
      const query = qs.toString() ? `?${qs}` : "";
      return request(`/api/applications/${query}`);
    },

    create(data: ApplicationCreate): Promise<Application> {
      return request("/api/applications/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    update(id: string, data: ApplicationUpdate): Promise<Application> {
      return request(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    delete(id: string): Promise<void> {
      return request(`/api/applications/${id}`, { method: "DELETE" });
    },
  },

  // ── CV ──────────────────────────────────────────────────────────────────────

  cv: {
    status(): Promise<{ has_cv: boolean; filename: string | null; chunks: number }> {
      return request("/api/cv/status");
    },

    upload(file: File): Promise<{ message: string; chunks: number }> {
      const form = new FormData();
      form.append("file", file);
      return request("/api/cv/upload", { method: "POST", body: form });
    },

    remove(): Promise<{ message: string }> {
      return request("/api/cv/", { method: "DELETE" });
    },

    ask(question: string, k = 4): Promise<AskResponse> {
      return request("/api/cv/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, k }),
      });
    },
  },

  // ── Jobs ─────────────────────────────────────────────────────────────────────

  jobs: {
    match(data: {
      job_description: string;
      company?: string;
      role?: string;
    }): Promise<JobMatchResponse> {
      return request("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  },
};
