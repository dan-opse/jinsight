"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { getMoodTrend, getInsights, searchEntries } from "@/lib/api";
import MoodChart from "@/components/MoodChart";

interface MoodPoint {
  date: string;
  mood_score: number;
}

interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  similarity: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [moodData, setMoodData] = useState<MoodPoint[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/");
    });

    getMoodTrend().then(setMoodData).catch(() => {});

    getInsights()
      .then((res) => setInsights(res.insights ?? []))
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  }, [router]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchEntries(query);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-stone-900">Jinsight</span>
        <Link href="/journal" className="text-sm text-stone-500 hover:text-stone-900">
          Journal
        </Link>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-10 space-y-10">
        {/* Mood trend */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">Mood — last 30 days</h2>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <MoodChart data={moodData} />
          </div>
        </section>

        {/* Insight cards */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">Patterns</h2>
          {insightsLoading ? (
            <p className="text-sm text-stone-400">Generating insights…</p>
          ) : insights.length === 0 ? (
            <p className="text-sm text-stone-400">
              No patterns yet — write a few more entries to unlock insights.
            </p>
          ) : (
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
                >
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Search */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">Search your entries</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What have I been anxious about?"
              className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-40"
            >
              {searching ? "…" : "Search"}
            </button>
          </form>

          {searchResults.length > 0 && (
            <ul className="space-y-2">
              {searchResults.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3 space-y-1"
                >
                  <time className="text-xs text-stone-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </time>
                  <p className="text-sm text-stone-600 line-clamp-3">{r.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
