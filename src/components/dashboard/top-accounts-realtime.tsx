"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TopAccountsTable } from "@/components/dashboard/top-accounts-table";
import { Account } from "@/types";

type AccountWithViews = Account & { views?: number };

interface TopAccountsRealtimeProps {
  initialAccounts: AccountWithViews[];
  limit?: number;
}

export function TopAccountsRealtime({ initialAccounts, limit = 5 }: TopAccountsRealtimeProps) {
  const [accounts, setAccounts] = useState<AccountWithViews[]>(initialAccounts);
  const [isLoading, setIsLoading] = useState(false);
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTopAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/top-accounts?limit=${encodeURIComponent(String(limit))}`);
      if (!res.ok) return;
      const body = (await res.json()) as { data?: AccountWithViews[] };
      if (body.data) setAccounts(body.data);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleRefresh = () => {
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    refreshTimeout.current = setTimeout(fetchTopAccounts, 450);
  };

  useEffect(() => {
    void fetchTopAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("dashboard-top-accounts")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_metrics" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return <TopAccountsTable accounts={accounts} isLoading={isLoading} />;
}
