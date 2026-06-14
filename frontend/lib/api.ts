import { createClient } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function authHeaders() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function saveEntry(content: string) {
  const res = await fetch(`${API_URL}/entries/`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to save entry");
  return res.json();
}

export async function listEntries() {
  const res = await fetch(`${API_URL}/entries/`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}

export async function getMoodTrend() {
  const res = await fetch(`${API_URL}/dashboard/mood`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch mood trend");
  return res.json();
}

export async function getInsights() {
  const res = await fetch(`${API_URL}/dashboard/insights`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch insights");
  return res.json();
}

export async function analyzeEntry(id: string) {
  const res = await fetch(`${API_URL}/entries/${id}/analyze`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}

export async function searchEntries(q: string) {
  const params = new URLSearchParams({ q });
  const res = await fetch(`${API_URL}/dashboard/search?${params}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}
