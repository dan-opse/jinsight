"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { saveEntry, listEntries, analyzeEntry } from "@/lib/api";
import Nav from "@/components/Nav";
import { useRequireAuth } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import type { Entry } from "@/lib/types";

function MoodBadge({ score }: { score: number }) {
  const style =
    score >= 7
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 4
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}>
      Mood {score}/10
    </span>
  );
}

export default function JournalPage() {
  const router = useRouter();
  useRequireAuth();
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoadError(false);
    try {
      const data = await listEntries();
      setEntries(data);
    } catch {
      setLoadError(true);
    }
  }

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await saveEntry(content);
      setContent("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      localStorage.setItem("jinsight_insights_stale", "true");
      loadEntries();
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze(id: string) {
    setAnalyzing((prev) => new Set(prev).add(id));
    try {
      await analyzeEntry(id);
      await loadEntries();
    } finally {
      setAnalyzing((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-violet-50">
      <Nav>
        <Link href="/dashboard" className="text-slate-500 hover:text-violet-700 transition-colors">
          Dashboard
        </Link>
        <button
          onClick={handleSignOut}
          className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </Nav>

      <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
        {/* Write area */}
        <div className="rounded-2xl bg-white border border-violet-100 shadow-sm overflow-hidden">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today?"
            rows={10}
            className="resize-none rounded-none border-0 border-b border-violet-50 shadow-none px-6 py-5 font-serif text-[15px] text-slate-800 leading-relaxed placeholder:text-slate-300 focus-visible:ring-0 focus-visible:border-violet-200"
          />
          <div className="flex items-center justify-between px-6 py-3 border-t border-violet-50 bg-violet-50/50">
            <span className="text-xs text-slate-400">{content.length} characters</span>
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              {saving ? "Saving…" : saved ? "Saved" : "Save entry"}
            </button>
          </div>
        </div>

        {/* Past entries */}
        {loadError ? (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            Failed to load entries.{" "}
            <button onClick={loadEntries} className="underline cursor-pointer">
              Retry
            </button>
          </div>
        ) : entries.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Past entries
            </h2>
            <ul className="space-y-2">
              {entries.map((entry) => {
                const meta = entry.entry_metadata?.[0];
                const failed = meta?.processing_status === "failed";
                return (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-violet-100 bg-white px-4 py-3.5 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <time className="text-xs text-slate-400">
                        {formatDate(entry.created_at)}
                      </time>
                      <div className="flex items-center gap-2">
                        {meta?.mood_score != null && (
                          <MoodBadge score={meta.mood_score} />
                        )}
                        {meta?.processing_status !== "done" && (
                          <button
                            onClick={() => handleAnalyze(entry.id)}
                            disabled={analyzing.has(entry.id)}
                            className={`text-xs transition-colors cursor-pointer disabled:opacity-40 ${
                              failed
                                ? "text-red-400 hover:text-red-600"
                                : "text-violet-400 hover:text-violet-700"
                            }`}
                          >
                            {analyzing.has(entry.id)
                              ? "Analyzing…"
                              : failed
                              ? "Retry"
                              : "Analyze"}
                          </button>
                        )}
                      </div>
                    </div>
                    <Textarea
                      value={entry.content}
                      readOnly
                      rows={3}
                      className="resize-none border-violet-50 bg-violet-50/40 text-slate-600 leading-relaxed shadow-none focus-visible:ring-0 focus-visible:border-violet-100 cursor-default"
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
