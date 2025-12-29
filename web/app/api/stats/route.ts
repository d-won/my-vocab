import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function startOfDayISO(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function addDaysISO(days: number, base = new Date()) {
  const x = new Date(base);
  x.setDate(x.getDate() + days);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export async function GET() {
  // 1) 전체 단어 수
  const { count: totalCards, error: e1 } = await supabaseAdmin
    .from("cards")
    .select("id", { count: "exact", head: true });

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  // 2) SRS 상태들(가능한 최소 컬럼만)
  // ✅ 가정: srs_state에 card_id, due_at, state 가 있음
  const { data: states, error: e2 } = await supabaseAdmin
    .from("srs_state")
    .select("card_id, due_at, reps, lapses, last_reviewed_at");

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const now = new Date();
  const today0 = new Date(startOfDayISO(now));
  const next7 = new Date(addDaysISO(7, now));

  // 상태별 카운트
  const byState: Record<string, number> = {};
  let dueToday = 0;
  let overdue = 0;
  let dueNext7 = 0;

  // 히스토그램: 오늘 기준 “due까지 남은 일수” 버킷
  const buckets = [
    { key: "overdue", label: "지남", count: 0 },
    { key: "today", label: "오늘", count: 0 },
    { key: "1-3", label: "1-3일", count: 0 },
    { key: "4-7", label: "4-7일", count: 0 },
    { key: "8-14", label: "8-14일", count: 0 },
    { key: "15-30", label: "15-30일", count: 0 },
    { key: "31+", label: "31일+", count: 0 },
  ];

  function incBucket(diffDays: number) {
    if (diffDays < 0) buckets[0].count++;
    else if (diffDays === 0) buckets[1].count++;
    else if (diffDays <= 3) buckets[2].count++;
    else if (diffDays <= 7) buckets[3].count++;
    else if (diffDays <= 14) buckets[4].count++;
    else if (diffDays <= 30) buckets[5].count++;
    else buckets[6].count++;
  }

  for (const s of states ?? []) {
  const reps = Number((s as any).reps ?? 0);
  const dueStr = (s as any).due_at as string | null;

  // --- 상태 계산 (state 컬럼 대신 계산)
  let computedState = "unknown";

  if (reps === 0) {
    computedState = "NEW";
  } else if (!dueStr) {
    computedState = "LEARNING";
  } else {
    const due = new Date(dueStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (due < today) computedState = "OVERDUE";
    else if (due.getTime() === today.getTime()) computedState = "DUE";
    else computedState = "REVIEW";
  }

  byState[computedState] = (byState[computedState] ?? 0) + 1;

  // --- 히스토그램/카운트 (dueStr 재사용)
  if (!dueStr) continue;

  const due = new Date(dueStr);
  const due0 = new Date(due);
  due0.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((due0.getTime() - today0.getTime()) / 86400000);

  incBucket(diffDays);

  if (due0.getTime() < today0.getTime()) overdue++;
  if (due0.getTime() === today0.getTime()) dueToday++;
  if (due0.getTime() >= today0.getTime() && due0.getTime() < next7.getTime()) dueNext7++;
}

  // NEW(미학습) 추정: cards 전체 - srs_state 존재 카드 수
  // (가정: srs_state는 학습 시작한 카드에만 생김)
  const learnedCount = (states ?? []).length;
  const newCount = Math.max(0, (totalCards ?? 0) - learnedCount);

  return NextResponse.json({
    total: totalCards ?? 0,
    learned: learnedCount,
    new: newCount,
    dueToday,
    overdue,
    dueNext7,
    byState,
    dueHistogram: buckets,
  });
}