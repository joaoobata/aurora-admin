import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { DataService } from "@/services/data-service";

const PERIOD_TO_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
};

function resolveDateRange(searchParams: URLSearchParams) {
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (fromParam || toParam) {
    return {
      from: fromParam || undefined,
      to: toParam || undefined,
      period: undefined,
    };
  }

  const period = searchParams.get("period") || "30d";
  const days = PERIOD_TO_DAYS[period] ?? 30;

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  return { from: from.toISOString(), to: to.toISOString(), period };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const { from, to, period } = resolveDateRange(searchParams);

  const data = await DataService.getMonthlyOverview({ from, to });
  return NextResponse.json({ data, from, to, period });
}

