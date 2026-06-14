"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { saveEntry, listEntries, analyzeEntry } from "@/lib/api";

interface Entry {
  id: string;
  content: string;
  created_at: string;
  entry_metadata?: { mood_score: number | null; processing_status: string }[];
}

export default function JournalPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/");
    });
    loadEntries();
  }, [router]);

  async function loadEntries() {
    try {
      const data = await listEntries();
      setEntries(data);
    } catch {
      /* silently fail on load */
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
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-stone-900">Jinsight</span>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-stone-500 hover:text-stone-900">
            Dashboard
          </Link>
          <button onClick={handleSignOut} className="text-stone-400 hover:text-stone-700">
            Sign out
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
        <div className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today?"
            rows={10}
            className="w-full resize-none rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400">{content.length} characters</span>
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="rounded-md bg-stone-900 px-5 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-40"
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save entry"}
            </button>
          </div>
        </div>

        {entries.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Past entries
            </h2>
            <ul className="space-y-2">
              {entries.map((entry) => {
                const meta = entry.entry_metadata?.[0];
                return (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-stone-200 bg-white px-4 py-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <time className="text-xs text-stone-400">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </time>
                      <div className="flex items-center gap-2">
                        {meta?.mood_score != null && (
                          <span className="text-xs text-stone-500">
                            mood {meta.mood_score}/10
                          </span>
                        )}
                        {meta?.processing_status !== "done" && (
                          <button
                            onClick={() => handleAnalyze(entry.id)}
                            disabled={analyzing.has(entry.id)}
                            className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-40"
                          >
                            {analyzing.has(entry.id) ? "Analyzing…" : "Analyze"}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-stone-600 line-clamp-2">{entry.content}</p>
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
