"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase";

export function useRequireAuth() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/");
    });
  }, [router]);
}
