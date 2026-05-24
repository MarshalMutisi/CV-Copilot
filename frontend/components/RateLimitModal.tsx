"use client";

import { useState } from "react";

interface Props {
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function RateLimitModal({ onSave, onClose }: Props) {
  const [key, setKey] = useState("");

  const handleSave = () => {
    if (!key.trim()) return;
    localStorage.setItem("groq_api_key", key.trim());
    onSave(key.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl border border-zinc-200 p-6 w-full max-w-md space-y-4 shadow-xl">
        <h2 className="text-lg font-semibold">Rate limit reached</h2>
        <p className="text-sm text-zinc-600">
          The free usage limit has been reached. Add your own{" "}
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
            className="text-zinc-900 font-medium underline">Groq API key</a>{" "}
          to continue — it stays in your browser only.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="gsk_..."
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={!key.trim()}
            className="flex-1 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors">
            Save & continue
          </button>
          <button onClick={onClose}
            className="px-4 py-2 border border-zinc-200 text-sm rounded-lg hover:bg-zinc-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
