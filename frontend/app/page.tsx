"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { api, Application, ApplicationCreate, ApplicationStatus } from "@/lib/api";
import { Plus, Trash2, ExternalLink, Calendar, Building2, Briefcase, Loader2, Sparkles } from "lucide-react";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  interview: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  offer: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

const STATUSES: ApplicationStatus[] = ["applied", "interview", "offer", "rejected"];

function Badge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}

const empty: ApplicationCreate = {
  company: "",
  role: "",
  job_url: "",
  status: "applied",
  notes: "",
  applied_date: new Date().toISOString().split("T")[0],
};

function DashboardContent() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ApplicationCreate>(empty);
  const [saving, setSaving] = useState(false);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filterStatus = searchParams.get("status") || "";

  useEffect(() => {
    let ignore = false;
    const fetchApps = async () => {
      try {
        const data = await api.applications.list(filterStatus ? { status: filterStatus } : undefined);
        if (!ignore) {
          setApps(data);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    fetchApps();
    return () => {
      ignore = true;
    };
  }, [filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.applications.create(form);
      setApps((prev) => [created, ...prev]);
      setForm(empty);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, status: ApplicationStatus) => {
    const updated = await api.applications.update(id, { status });
    setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const handleDelete = async (id: string) => {
    await api.applications.delete(id);
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const handleFilterStatusChange = (status: string) => {
    if (filterStatus !== status) {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      if (status) {
        params.set("status", status);
      } else {
        params.delete("status");
      }
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Job Applications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and manage your ongoing job hunt</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/25 active:scale-95 border border-violet-500/30 cursor-pointer self-start sm:self-auto"
        >
          {showForm ? "Cancel" : <><Plus className="w-4.5 h-4.5" /> Add Application</>}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4.5 rounded-xl border border-slate-800/80 flex flex-col justify-between shadow-lg">
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Total Applications</span>
          <span className="text-3xl font-extrabold text-white mt-2">{apps.length}</span>
        </div>
        <div className="glass-card p-4.5 rounded-xl border border-slate-800/80 flex flex-col justify-between shadow-lg">
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Interviews</span>
          <span className="text-3xl font-extrabold text-amber-400 mt-2">
            {apps.filter(a => a.status === "interview").length}
          </span>
        </div>
        <div className="glass-card p-4.5 rounded-xl border border-slate-800/80 flex flex-col justify-between shadow-lg">
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Offers Received</span>
          <span className="text-3xl font-extrabold text-emerald-400 mt-2">
            {apps.filter(a => a.status === "offer").length}
          </span>
        </div>
        <div className="glass-card p-4.5 rounded-xl border border-slate-800/80 flex flex-col justify-between shadow-lg">
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Success Rate</span>
          <span className="text-3xl font-extrabold text-violet-400 mt-2">
            {apps.length > 0 
              ? `${Math.round((apps.filter(a => a.status !== "applied" && a.status !== "rejected").length / apps.length) * 100)}%` 
              : "0%"}
          </span>
        </div>
      </div>

      {/* New Application Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card rounded-xl p-6 space-y-5 border border-slate-800/85 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500" />
          <h2 className="font-semibold text-lg text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            New Application
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Company *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Google"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Role *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Job URL</label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={form.job_url} onChange={(e) => setForm({ ...form, job_url: e.target.value })}
                  placeholder="e.g. https://careers.google.com/..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Applied Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="date" value={form.applied_date} onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Details about the job role, technologies, interview process..."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-violet-500/10 active:scale-95 cursor-pointer">
              {saving ? "Saving..." : "Save Application"}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Content List */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-slate-800/40 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleFilterStatusChange("")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 capitalize whitespace-nowrap cursor-pointer ${
              filterStatus === ""
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-lg shadow-violet-500/15"
                : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
            }`}
          >
            All Applications
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleFilterStatusChange(s)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 capitalize whitespace-nowrap cursor-pointer ${
                filterStatus === s
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-lg shadow-violet-500/15"
                  : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading applications...</p>
          </div>
        ) : apps.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center border border-slate-800/80 shadow-md">
            <Briefcase className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No applications found.</p>
            <p className="text-xs text-slate-500 mt-1">Add a new job application or try changing the status filter.</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl border border-slate-800/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50 border-b border-slate-800/85 text-slate-400">
                  <tr>
                    {["Company", "Role", "Status", "Applied", "Notes", ""].map((h) => (
                      <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-4 font-semibold text-white">{app.company}</td>
                      <td className="px-5 py-4 text-slate-300">{app.role}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <select value={app.status} onChange={(e) => handleStatus(app.id, e.target.value as ApplicationStatus)}
                            className="text-xs bg-slate-900/80 text-slate-300 border border-slate-800 rounded-md px-2 py-1 focus:outline-none focus:border-violet-500 cursor-pointer transition-all hover:bg-slate-800">
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <Badge status={app.status} />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400">{app.applied_date}</td>
                      <td className="px-5 py-4 text-slate-400 max-w-xs truncate" title={app.notes ?? ""}>{app.notes ?? "—"}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => handleDelete(app.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Delete Application">
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
