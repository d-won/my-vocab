import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { scheduleNext, toFsrsCard } from "@/lib/fsrsScheduler";

export async function POST(req: Request) {
  const body = await req.json();
  const cardId: string = body.cardId;
  const nowIso = new Date().toISOString();
  
  const rating: number = Number(body.rating);
  const elapsedMs: number | undefined = body.elapsedMs ? Number(body.elapsedMs) : undefined;

  if (!cardId || ![1, 2, 3, 4].includes(rating)) {
    return NextResponse.json({ error: "cardId and rating(1..4) required" }, { status: 400 });
  }

  // 상태 로드
  const { data: state, error: stErr } = await supabaseAdmin
    .from("srs_state")
    .select("*")
    .eq("card_id", cardId)
    .single();

  if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });

  const card = toFsrsCard(state as any);
  const next = scheduleNext(card, rating);

  // 상태 업데이트
  const { error: upErr } = await supabaseAdmin
    .from("srs_state")
    .update({
      due_at: next.due_at,
      stability: next.stability,
      difficulty: next.difficulty,
      reps: next.reps,
      lapses: next.lapses,
      last_reviewed_at: next.last_reviewed_at,
      last_rating: rating,
      last_rating_at: nowIso,
    })
    .eq("card_id", cardId);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // 로그 저장
  const { error: logErr } = await supabaseAdmin.from("reviews").insert({
    card_id: cardId,
    rating,
    elapsed_ms: elapsedMs ?? null,
  });

  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, nextDueAt: next.due_at });
}