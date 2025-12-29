"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; front: string; meanings: string[] };

export default function ReviewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [msg, setMsg] = useState("");

  // 내가 새로 추가 251229 2213
  const [mode, setMode] = useState<"all" | "trouble">("all");
  
  // 내가 새로 추가 251229 2107 

  const [nextDue, setNextDue] = useState<{
    again: string | null;
    hard: string | null;
    good: string | null;
    easy: string | null;
  } | null>(null);

  function pretty(iso: string | null) {
  if (!iso) return "-";
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffMin = Math.round((t - now) / 60000);

  if (diffMin < 0) return "지남";
  if (diffMin <= 60) return `${diffMin}분 후`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr <= 48) return `${diffHr}시간 후`;

  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}일 후`;
}

const cur = useMemo(() => items[idx], [items, idx]);

  useEffect(() => {
  async function loadPreview() {
    if (!cur?.id) {
      setNextDue(null);
      return;
    }

    const res = await fetch("/api/review/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: cur.id }),
    });

    const json = await res.json();
    if (res.ok) setNextDue(json.next);
    else setNextDue(null);
  }

  loadPreview();
}, [cur?.id]);

const baseBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};

const againBtn: React.CSSProperties = {
  ...baseBtn,
  background: "#555",      // 진한 회색
  color: "#fff",           // 흰색 글자
};

const hardBtn: React.CSSProperties = {
  ...baseBtn,
  background: "#d9534f",   // 빨간색
  color: "#fff",
};

const goodBtn: React.CSSProperties = {
  ...baseBtn,
  background: "#f0ad4e",   // 노란색
  color: "#000",           // 검정 글자
};

const easyBtn: React.CSSProperties = {
  ...baseBtn,
  background: "#b8e6b8",   // 연한 초록색
  color: "#000",
};

const reloadBtn: React.CSSProperties = {
  ...baseBtn,
  background: "#eee",
  color: "#333",
};

async function loadQueue(nextMode: "all" | "trouble" = mode) {
  setMsg("불러오는 중...");

  const baseUrl = "/api/review/queue?due=30&new=10";
  const url =
    nextMode === "trouble"
      ? `${baseUrl}&mode=trouble`
      : baseUrl;

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    setMsg(`오류: ${json.error ?? "unknown"}`);
  } else {
    setItems(json.items ?? []);
    setIdx(0);
    setShowBack(false);
    setMsg(json.items?.length ? "" : "오늘 학습할 카드가 없습니다.");
  }
}
  useEffect(() => { loadQueue(); }, []);

 async function answer(rating: 1 | 2 | 3 | 4) {
  if (!cur) return;

  // 1) 먼저 UI를 다음 카드로 넘김
  const nextIdx = idx + 1;
  if (nextIdx >= items.length) {
    setMsg("세션 종료! (큐를 다시 불러오세요)");
  } else {
    setIdx(nextIdx);
    setShowBack(false);
    setMsg("");
  }

  // 2) 그 다음 서버에 기록 (실패 시 메시지만 표시)
  try {
    const res = await fetch("/api/review/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: cur.id, rating }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(`오류: ${json.error ?? "unknown"}`);
    }
  } catch (e: any) {
    setMsg(`오류: ${e?.message ?? "network error"}`);
  }
}
  return (

    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
  <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
    flexWrap: "wrap",
  }}
>
  <h1 style={{ fontSize: 20, margin: 0 }}>Review</h1>

  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
    {/* 진행도 */}
    <div style={{ color: "#666", minWidth: 48 }}>
      {items.length ? `${idx + 1}/${items.length}` : ""}
    </div>

    {/* 토글 */}
    <div
      style={{
        display: "flex",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => {
          setMode("all");
          loadQueue("all");
        }}
        style={{
          padding: "8px 12px",
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
          background: mode === "all" ? "#e5e7eb" : "#fff",
          color: "#111",
        }}
      >
        전체
      </button>

      <button
        onClick={() => {
          setMode("trouble");
          loadQueue("trouble");
        }}
        style={{
          padding: "8px 12px",
          border: "none",
          cursor: "pointer",
          fontWeight: 800,
          background: mode === "trouble" ? "#f59e0b" : "#fff",
          color: mode === "trouble" ? "#111" : "#555",
        }}
        title="Hard 또는 Again으로 평가된 카드만 봅니다"
      >
        Hard / Again만
      </button>
    </div>

    {/* 네비게이션 */}
    <nav style={{ display: "flex", gap: 10, fontSize: 14 }}>
      <a href="/" style={{ textDecoration: "none" }}>홈</a>
      <a href="/words" style={{ textDecoration: "none" }}>단어목록</a>
      <a href="/dashboard" style={{ textDecoration: "none" }}>대시보드</a>
    </nav>
  </div>
</div>

      {msg && <div style={{ marginBottom: 12, color: "#333" }}>{msg}</div>}

      {!cur ? (
        <div style={{ color: "#666" }}>
          <button onClick={loadQueue} style={btn}>큐 다시 불러오기</button>{" "}
          <a href="/" style={{ ...btn, textDecoration: "none" }}>Home</a>
        </div>
      ) : (
        <>
          <div
            onClick={() => setShowBack((v) => !v)}
            style={{
              border: "1px solid #ddd",
              borderRadius: 14,
              padding: 18,
              minHeight: 160,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 600, marginBottom: 10 }}>{cur.front}</div>
            {showBack ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {cur.meanings.map((m, i) => <li key={i} style={{ margin: "6px 0" }}>{m}</li>)}
              </ul>
            ) : (
              <div style={{ color: "#666" }}>클릭하면 뜻이 보입니다</div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={() => answer(1)} style={againBtn}>Again</button>
          <button onClick={() => answer(2)} style={hardBtn}>Hard</button>
          <button onClick={() => answer(3)} style={goodBtn}>Good</button>
          <button onClick={() => answer(4)} style={easyBtn}>Easy</button>
          <button onClick={loadQueue} style={{ ...reloadBtn, marginLeft: "auto" }}>
            Reload
          </button>
          </div>

                  <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 10,
            fontSize: 13,
            color: "#555",
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            이 선택은 다음 복습 시점에 이렇게 반영됩니다
          </div>

          <div><b>Again</b> : 오늘 안에 다시 봄 (기억 실패) · 예상 {pretty(nextDue?.again ?? null)}</div>
          <div><b>Hard</b> : 1일 내외로 재확인 (불안정) · 예상 {pretty(nextDue?.hard ?? null)}</div>
          <div><b>Good</b> : 기준 페이스 (표준 간격) · 예상 {pretty(nextDue?.good ?? null)}</div>
          <div><b>Easy</b> : 간격 크게 늘림 (확실) · 예상 {pretty(nextDue?.easy ?? null)}</div>
        </div>

          <div style={{ marginTop: 12, color: "#666" }}>
            팁: 먼저 뜻을 확인(show)한 뒤 평가하세요.
          </div>
        </>
      )}
    </main>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #ddd",
  borderRadius: 10,
  background: "white",
  cursor: "pointer",
};