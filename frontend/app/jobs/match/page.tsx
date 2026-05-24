"use client";

import { useState } from "react";
import { api, JobMatchResponse } from "@/lib/api";
import RateLimitModal from "@/components/RateLimitModal";
import { Briefcase, Building2, Loader2, Sparkles, CheckCircle2, AlertCircle, FileText, Activity } from "lucide-react";

export default function JobMatchPage() {
  const [form, setForm] = useState({ job_description: "", company: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobMatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"fit" | "gaps" | "cover">("fit");
  const [showRateLimit, setShowRateLimit] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.jobs.match(form);
      setResult(res);
      setTab("fit");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "rate_limited") {
        setShowRateLimit(true);
      } else {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showRateLimit && (
        <RateLimitModal onSave={() => setShowRateLimit(false)} onClose={() => setShowRateLimit(false)} />
      )}
      <div className="space-y-8 max-w-5xl">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AI Job Match Analyzer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Compare job description with your CV to get instant match insights and a customized cover letter.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Card */}
          <section className="glass-card rounded-xl p-6 border border-slate-800/80 relative overflow-hidden shadow-xl lg:col-span-5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500" />
            <h2 className="font-semibold text-lg text-white flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-violet-400" />
              Analyze Match
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Google"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Job Description *</label>
                <textarea required rows={10} value={form.job_description}
                  onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                  placeholder="Paste the full job description here..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none" />
              </div>
              <button type="submit" disabled={loading || !form.job_description.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-violet-500/10 active:scale-95 cursor-pointer">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : "Analyze Match"}
              </button>
            </form>
            {error && (
              <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 mt-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                {error}
              </p>
            )}
          </section>

          {/* Results Card */}
          <div className="lg:col-span-7 h-full">
            {loading ? (
              <div className="glass-card rounded-xl p-16 border border-slate-800/80 flex flex-col items-center justify-center gap-3 min-h-[400px]">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                <p className="text-slate-300 font-medium">Running deep match analysis...</p>
                <p className="text-xs text-slate-500">Checking skills alignment and drafting cover letter</p>
              </div>
            ) : result ? (
              <section className="glass-card rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
                <div className="flex border-b border-slate-800 bg-slate-900/40">
                  {(["fit", "gaps", "cover"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 px-5 py-3.5 text-sm font-semibold transition-all relative cursor-pointer ${
                        tab === t ? "text-white bg-slate-900/60" : "text-slate-400 hover:text-slate-200"
                      }`}>
                      {t === "fit" ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${tab === t ? "text-emerald-400" : "text-slate-500"}`} />
                          Fit Analysis
                        </span>
                      ) : t === "gaps" ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Sparkles className={`w-4 h-4 ${tab === t ? "text-amber-400" : "text-slate-500"}`} />
                          Skill Gaps
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <FileText className={`w-4 h-4 ${tab === t ? "text-violet-400" : "text-slate-500"}`} />
                          Cover Letter
                        </span>
                      )}
                      {tab === t && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-6 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900/20 max-h-[500px] overflow-y-auto font-sans flex-1">
                  {(tab === "fit" ? result.fit_analysis : tab === "gaps" ? result.gaps : result.cover_letter).replace(/\*\*/g, "")}
                </div>
              </section>
            ) : (
              <div className="glass-card rounded-xl p-16 border border-slate-800/80 flex flex-col items-center justify-center text-center min-h-[400px]">
                <Sparkles className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-slate-400 font-medium">Ready for Analysis</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Submit a job description on the left to see compatibility matches and dynamic AI generation here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
