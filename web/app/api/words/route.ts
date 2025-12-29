import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function asInt(v: string | null, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const sort = (url.searchParams.get("sort") ?? "created_at").trim(); // word | created_at
  const dir = (url.searchParams.get("dir") ?? "desc").trim(); // asc | desc
  const page = asInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(100, Math.max(5, asInt(url.searchParams.get("pageSize"), 25)));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 검색은 cards.word + card_meanings.meaning 둘 다 대상으로
  let query = supabaseAdmin
    .from("cards")
    .select("id, front, created_at, card_meanings(meaning)", { count: "exact" });

  if (q) {
    // 관계 테이블 검색 OR: word ilike OR meanings ilike
    // Supabase/PostgREST OR 문법
    query = query.or(`front.ilike.%${q}%,card_meanings.meaning.ilike.%${q}%`);
  }

  const sortCol = sort === "word" ? "front" : "created_at";
  const ascending = dir === "asc";

  const { data, error, count } = await query
    .order(sortCol, { ascending })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((r: any) => ({
    id: r.id,
    word: r.front,
    created_at: r.created_at,
    meanings: (r.card_meanings ?? []).map((m: any) => m.meaning).filter(Boolean),
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    total: count ?? 0,
    totalPages: count ? Math.ceil(count / pageSize) : 0,
  });
}
