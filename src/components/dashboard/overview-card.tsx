"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { supabase } from "@/lib/supabase";
import { CalendarDays, Loader2 } from "lucide-react";

type OverviewPoint = {
  name: string;
  views: number;
  likes: number;
  uploads: number;
};

const PERIOD_OPTIONS: { value: string; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "180d", label: "Últimos 6 meses" },
  { value: "365d", label: "Último ano" },
];

function getPeriodLabel(period: string) {
  return PERIOD_OPTIONS.find((p) => p.value === period)?.label || "Últimos 30 dias";
}

interface OverviewCardProps {
  initialData: OverviewPoint[];
  initialPeriod?: string;
}

export function OverviewCard({ initialData, initialPeriod = "30d" }: OverviewCardProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState<OverviewPoint[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirstRun = useRef(true);
  const periodRef = useRef(period);
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    periodRef.current = period;
  }, [period]);

  const fetchData = useCallback(async (nextPeriod: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/overview?period=${encodeURIComponent(nextPeriod)}`, {
        method: "GET",
        headers: { "content-type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Falha ao carregar (${res.status})`);
      }
      const body = (await res.json()) as { data: OverviewPoint[] };
      setData(body.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    refreshTimeout.current = setTimeout(() => fetchData(periodRef.current), 450);
  }, [fetchData]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    void fetchData(period);
  }, [fetchData, period]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("dashboard-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_metrics" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      client.removeChannel(channel);
    };
  }, [scheduleRefresh]);

  const summary = useMemo(() => {
    if (!data || data.length === 0) {
      return { endViews: 0, endLikes: 0, totalUploads: 0, deltaViews: 0, deltaLikes: 0 };
    }
    const first = data[0];
    const last = data[data.length - 1];
    const totalUploads = data.reduce((sum, d) => sum + (d.uploads || 0), 0);
    return {
      endViews: last.views || 0,
      endLikes: last.likes || 0,
      totalUploads,
      deltaViews: (last.views || 0) - (first.views || 0),
      deltaLikes: (last.likes || 0) - (first.likes || 0),
    };
  }, [data]);

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Visão Geral</CardTitle>
          <CardDescription>Performance — {getPeriodLabel(period)}</CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              Período
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={period} onValueChange={setPeriod}>
              {PERIOD_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="pl-2">
        <div className="grid grid-cols-3 gap-2 px-4 pb-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-[11px] text-muted-foreground">Views (fim do período)</div>
            <div className="text-base font-semibold">{summary.endViews.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground">
              Δ {summary.deltaViews.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-[11px] text-muted-foreground">Curtidas (fim do período)</div>
            <div className="text-base font-semibold">{summary.endLikes.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground">
              Δ {summary.deltaLikes.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-[11px] text-muted-foreground">Uploads (período)</div>
            <div className="text-base font-semibold">{summary.totalUploads.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground">Total de vídeos postados</div>
          </div>
        </div>

        {error ? (
          <div className="px-4 pb-4 text-sm text-red-600">{error}</div>
        ) : null}

        <OverviewChart data={data} />
      </CardContent>
    </Card>
  );
}
