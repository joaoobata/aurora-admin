import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { DataService } from "@/services/data-service";

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
  const limitParam = searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : 5;
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(20, parsedLimit)) : 5;

  const data = await DataService.getTopAccounts(limit);
  return NextResponse.json({ data });
}
