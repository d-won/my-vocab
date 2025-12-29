import { FSRS, Rating } from "ts-fsrs";

// ts-fsrs는 Card 타입/필드가 버전에 따라 조금씩 다를 수 있어
// 런타임에서 필요한 필드만 확실히 채워서 repeat()가 터지지 않게 만든다.
const fsrs = new FSRS();

type DbState = {
  due_at: string | null;
  stability: number | null;
  difficulty: number | null;
  reps: number | null;
  lapses: number | null;
  last_reviewed_at: string | null;
};

function num(x: unknown, fallback = 0) {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function dateOrNow(s: string | null) {
  const d = s ? new Date(s) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * ts-fsrs의 Card 구조(버전별 상이)를 런타임에서 안전하게 구성
 * 핵심은 repeat()가 요구하는 state가 undefined가 되지 않도록 하는 것.
 */
export function toFsrsCard(state: DbState) {
  // 안전 기본값
  const due = dateOrNow(state.due_at);
  const lastReview = state.last_reviewed_at ? dateOrNow(state.last_reviewed_at) : undefined;

  // some versions expect 'state' field (New/Learning/Review/Relearning)
  // when it's missing, repeat()가 Invalid state를 던지는 케이스가 있음.
  // 가장 보수적으로 New(0)로 둔다. (라이브러리 내부 enum/number 처리)
  const card: any = {
    due,
    stability: num(state.stability, 0),
    difficulty: num(state.difficulty, 0),
    reps: num(state.reps, 0),
    lapses: num(state.lapses, 0),
    last_review: lastReview,
    // 중요: undefined 방지
    state: 0,
  };

  return card;
}

export function scheduleNext(card: any, rating1to4: number) {
  const now = new Date();

  const rating =
    rating1to4 === 1 ? Rating.Again :
    rating1to4 === 2 ? Rating.Hard :
    rating1to4 === 3 ? Rating.Good :
    Rating.Easy;

  const result: any = fsrs.repeat(card, now);
  const next: any = result[rating];

  const nextCard: any = next.card;

  return {
    due_at: (nextCard.due as Date).toISOString(),
    stability: num(nextCard.stability, 0),
    difficulty: num(nextCard.difficulty, 0),
    reps: num(nextCard.reps, 0),
    lapses: num(nextCard.lapses, 0),
    last_reviewed_at: now.toISOString(),
  };
}