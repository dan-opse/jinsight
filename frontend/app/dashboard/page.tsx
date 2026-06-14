"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMoodTrend, getInsights, searchEntries } from "@/lib/api";
import MoodChart from "@/components/MoodChart";
import Nav from "@/components/Nav";
import { useRequireAuth } from "@/lib/hooks";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import type { MoodPoint, SearchResult } from "@/lib/types";

const SKELETON_WIDTHS = [80, 65, 72];

function InsightSkeleton() {
  return (
    <div className="space-y-2">
      {SKELETON_WIDTHS.map((w, i) => (
        <div key={i} className="rounded-xl bg-white border border-violet-100 shadow-sm px-4 py-3 animate-pulse">
          <div className="h-4 bg-violet-50 rounded" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  useRequireAuth();
  const [moodData, setMoodData] = useState<MoodPoint[]>([]);
  const [moodLoading, setMoodLoading] = useState(true);
  const [moodError, setMoodError] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getMoodTrend()
      .then(setMoodData)
      .catch(() => setMoodError(true))
      .finally(() => setMoodLoading(false));

    const isStale = localStorage.getItem("jinsight_insights_stale") === "true";
    const cached = localStorage.getItem("jinsight_insights_cache");

    if (!isStale && cached) {
      setInsights(JSON.parse(cached));
      setInsightsLoading(false);
    } else {
      getInsights()
        .then((res) => {
          const items = res.insights ?? [];
          setInsights(items);
          localStorage.setItem("jinsight_insights_cache", JSON.stringify(items));
          localStorage.removeItem("jinsight_insights_stale");
        })
        .catch(() => setInsightsError(true))
        .finally(() => setInsightsLoading(false));
    }
  }, []);

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
    <div className="min-h-screen bg-violet-50">
      <Nav>
        <Link href="/journal" className="text-slate-500 hover:text-violet-700 transition-colors">
          Journal
        </Link>
      </Nav>

      <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
        {/* Mood trend */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mood — last 30 days
          </h2>
          <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
            {moodError ? (
              <p className="py-6 text-center text-sm text-red-400">
                Failed to load mood data.
              </p>
            ) : (
              <MoodChart data={moodData} loading={moodLoading} />
            )}
          </div>
        </section>

        {/* Insight cards */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Patterns
          </h2>
          {insightsLoading ? (
            <InsightSkeleton />
          ) : insightsError ? (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              Failed to load insights.
            </div>
          ) : insights.length === 0 ? (
            <div className="rounded-xl bg-white border border-violet-100 px-4 py-6 text-center shadow-sm">
              <p className="text-sm text-slate-400">
                No patterns yet — write a few more entries to unlock insights.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-white border border-violet-100 shadow-sm px-4 py-3 text-sm text-slate-700"
                >
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Search */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Search your entries
          </h2>
          <form onSubmit={handleSearch} className="flex items-start gap-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What have I been anxious about?"
              rows={1}
              className="resize-none flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch(e as unknown as React.FormEvent);
                }
              }}
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="rounded-lg bg-violet-600 p-2.5 text-white hover:bg-violet-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              {searching ? (
                <span className="block h-4 w-4 text-center text-xs leading-4">…</span>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400">
                Sorted by relevance — most relevant at the top
              </p>
              <ul className="space-y-2">
                {searchResults.map((r) => {
                  const pct = Math.round(r.similarity * 100);
                  const barColor =
                    pct >= 70
                      ? "bg-emerald-400"
                      : pct >= 40
                      ? "bg-amber-400"
                      : "bg-slate-300";
                  return (
                    <li
                      key={r.id}
                      className="flex rounded-xl border border-violet-100 bg-white shadow-sm overflow-hidden"
                    >
                      <div className="w-1.5 flex-shrink-0 bg-slate-100 relative">
                        <div
                          className={`absolute bottom-0 left-0 right-0 ${barColor}`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <div className="flex-1 px-4 py-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <time className="text-xs text-slate-400">
                            {formatDate(r.created_at)}
                          </time>
                          <span className="text-xs text-slate-400">{pct}% match</span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-3">{r.content}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
