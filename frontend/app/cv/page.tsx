"use client";

import { useRef, useState, useEffect } from "react";
import { api, AskResponse } from "@/lib/api";
import RateLimitModal from "@/components/RateLimitModal";
import {
  UploadCloud, MessageSquare, Sparkles, Send, Loader2,
  AlertCircle, FileText, X, CheckCircle2, Trash2, RefreshCw,
} from "lucide-react";

type CVStatus = { has_cv: boolean; filename: string | null; chunks: number };

export default function CVPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cvStatus, setCvStatus] = useState<CVStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRateLimit, setShowRateLimit] = useState(false);

  useEffect(() => {
    api.cv.status()
      .then(setCvStatus)
      .catch(() => setCvStatus({ has_cv: false, filename: null, chunks: 0 }))
      .finally(() => setStatusLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
    setUploadResult(null);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    setError(null);
    try {
      await api.cv.upload(file);
      setUploadResult("CV uploaded successfully!");
      setCvStatus({ has_cv: true, filename: file.name, chunks: 0 });
      setReplacing(false);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await api.cv.remove();
      setCvStatus({ has_cv: false, filename: null, chunks: 0 });
      setUploadResult(null);
      setAnswer(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setRemoving(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAnswer(null);
    setError(null);
    try {
      const res = await api.cv.ask(question);
      setAnswer(res);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "rate_limited") {
        setShowRateLimit(true);
      } else {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      setAsking(false);
    }
  };

  const showUploadForm = !cvStatus?.has_cv || replacing;

  return (
    <>
      {showRateLimit && (
        <RateLimitModal onSave={() => setShowRateLimit(false)} onClose={() => setShowRateLimit(false)} />
      )}
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            My CV Knowledge Base
          </h1>
          <p className="text-slate-400 text-sm mt-1">Upload and chat with your resume using AI</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Upload / Status Section */}
          <section className="glass-card rounded-xl p-6 border border-slate-800/80 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500" />
            <h2 className="font-semibold text-lg text-white flex items-center gap-2 mb-4">
              <UploadCloud className="w-5 h-5 text-violet-400" />
              CV Knowledge Base
            </h2>

            {statusLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking CV status…
              </div>
            ) : cvStatus?.has_cv && !replacing ? (
              /* ── Active CV banner ── */
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-5 py-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-300">CV active</p>
                    {cvStatus.filename && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{cvStatus.filename}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setReplacing(true); setUploadResult(null); setError(null); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Replace
                    </button>
                    <button
                      onClick={handleRemove}
                      disabled={removing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Remove
                    </button>
                  </div>
                </div>
                {uploadResult && (
                  <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    {uploadResult}
                  </p>
                )}
              </div>
            ) : (
              /* ── Upload form ── */
              <div className="space-y-4">
                {replacing && (
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-400">Upload a new CV to replace the existing one.</p>
                    <button onClick={() => { setReplacing(false); clearFile(); setError(null); }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                      Cancel
                    </button>
                  </div>
                )}
                {!replacing && (
                  <p className="text-sm text-slate-400 -mt-1">Upload your PDF resume to parse and index it into the CV Copilot knowledge base.</p>
                )}
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className={`border border-dashed rounded-lg p-6 transition-all text-center relative ${selectedFile ? "border-violet-500/50 bg-violet-500/5" : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/45"}`}>
                    <input ref={fileRef} type="file" accept=".pdf" required
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-7 h-7 text-violet-400 shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-sm text-slate-100 font-medium truncate max-w-[260px]">{selectedFile.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB · PDF ready to upload</p>
                        </div>
                        <button type="button" onClick={clearFile}
                          className="ml-2 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0 relative z-10">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <span className="text-sm text-slate-300 block font-medium">Choose a PDF file</span>
                        <span className="text-xs text-slate-500 block mt-1">Only PDF files are supported</span>
                      </>
                    )}
                  </div>
                  <button type="submit" disabled={uploading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-violet-500/10 active:scale-95 cursor-pointer">
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : replacing ? "Replace CV" : "Upload CV"}
                  </button>
                </form>
              </div>
            )}

            {error && (
              <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 mt-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}
          </section>

          {/* Ask Section */}
          <section className="glass-card rounded-xl p-6 border border-slate-800/80 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500" />
            <h2 className="font-semibold text-lg text-white flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Ask About Your CV
            </h2>
            <p className="text-sm text-slate-400 mb-4">Ask any question and the AI will analyze your resume to provide a detailed answer.</p>

            <form onSubmit={handleAsk} className="space-y-4">
              <textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What are my key technical skills? Summarize my work experience at my last job."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none" />
              <button type="submit" disabled={asking || !question.trim() || !cvStatus?.has_cv}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-violet-500/10 active:scale-95 cursor-pointer">
                {asking ? <><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</> : <><Send className="w-4 h-4" /> Ask Question</>}
              </button>
              {!cvStatus?.has_cv && !statusLoading && (
                <p className="text-xs text-slate-500">Upload a CV above before asking questions.</p>
              )}
            </form>

            {error && !uploading && (
              <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 mt-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}

            {answer && (
              <div className="space-y-3 mt-6 border-t border-slate-800/60 pt-6">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-0.5">Question:</span>
                  <p className="text-sm text-slate-300 font-medium">{answer.question}</p>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl px-5 py-4 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {answer.answer}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
