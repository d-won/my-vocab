import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dueN = Number(searchParams.get("due") ?? 30);
  const newN = Number(searchParams.get("new") ?? 10);

  // due 카드
  const { data: dueCards, error: dueErr } = await supabaseAdmin
    .from("srs_state")
    .select("card_id, due_at")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(dueN);

  if (dueErr) return NextResponse.json({ error: dueErr.message }, { status: 500 });

  const dueIds = (dueCards ?? []).map((d) => d.card_id);

  // 신규 카드: srs_state가 없는 cards

let newQuery = supabaseAdmin
  .from("cards")
  .select("id, created_at")
  .order("created_at", { ascending: true })
  .limit(newN);

if (dueIds.length > 0) {
  const inList = `(${dueIds.map((x) => `"${x}"`).join(",")})`;
  newQuery = newQuery.not("id", "in", inList);
}

const { data: newCards, error: newErr } = await newQuery;

if (newErr) return NextResponse.json({ error: newErr.message }, { status: 500 });



  const ids = [...dueIds, ...(newCards ?? []).map((c) => c.id)];

  if (ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const { data: cards, error: cardsErr } = await supabaseAdmin
    .from("cards")
    .select("id, front")
    .in("id", ids);

  if (cardsErr) return NextResponse.json({ error: cardsErr.message }, { status: 500 });

  const { data: meanings, error: meanErr } = await supabaseAdmin
    .from("card_meanings")
    .select("card_id, ord, meaning")
    .in("card_id", ids)
    .order("ord", { ascending: true });

  if (meanErr) return NextResponse.json({ error: meanErr.message }, { status: 500 });

  const meaningMap = new Map<string, string[]>();
  for (const m of meanings ?? []) {
    const arr = meaningMap.get(m.card_id) ?? [];
    arr.push(m.meaning);
    meaningMap.set(m.card_id, arr);
  }

  const cardMap = new Map<string, { id: string; front: string }>();
  for (const c of cards ?? []) cardMap.set(c.id, c as any);

  const items = ids
    .map((id) => ({
      id,
      front: cardMap.get(id)?.front ?? "",
      meanings: meaningMap.get(id) ?? [],
    }))
    .filter((x) => x.front);

  shuffle(items);

  return NextResponse.json({ items });
}



function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}