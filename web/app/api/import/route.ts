import { NextResponse } from "next/server";
import Papa from "papaparse";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseMeanings } from "@/lib/parseMeanings";

type Row = { word?: string; meaning?: string };

export async function POST(req: Request) {
  const body = await req.json();
  const csvText: string = body.csvText;

  if (!csvText || typeof csvText !== "string") {
    return NextResponse.json({ error: "csvText is required" }, { status: 400 });
  }

  const parsed = Papa.parse<Row>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors?.length) {
    return NextResponse.json({ error: parsed.errors[0].message }, { status: 400 });
  }

  const rows = (parsed.data || [])
    .map((r) => ({
      front: (r.word ?? "").trim(),
      meanings: parseMeanings((r.meaning ?? "").trim()),
    }))
    .filter((r) => r.front.length > 0 && r.meanings.length > 0);

  let upserted = 0;

  for (const r of rows) {
    // 1) card upsert by front
    const { data: card, error: upsertErr } = await supabaseAdmin
      .from("cards")
      .upsert({ front: r.front, updated_at: new Date().toISOString() }, { onConflict: "front" })
      .select("id")
      .single();

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    // 2) meanings: 기존 삭제 후 재삽입(학습 이력은 유지)
    const cardId = card.id as string;

    const { error: delErr } = await supabaseAdmin
      .from("card_meanings")
      .delete()
      .eq("card_id", cardId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    const meaningRows = r.meanings.map((m, i) => ({
      card_id: cardId,
      ord: i + 1,
      meaning: m,
    }));

    const { error: insErr } = await supabaseAdmin
      .from("card_meanings")
      .insert(meaningRows);

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    // 3) 신규 카드면 srs_state 생성(없을 때만)
    const { data: state } = await supabaseAdmin
      .from("srs_state")
      .select("card_id")
      .eq("card_id", cardId)
      .maybeSingle();

    if (!state) {
      await supabaseAdmin.from("srs_state").insert({
        card_id: cardId,
        due_at: new Date().toISOString(),
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
      });
    }

    upserted++;
  }

  return NextResponse.json({ upserted });
}