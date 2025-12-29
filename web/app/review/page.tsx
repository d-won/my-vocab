"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; front: string; meanings: string[] };

export default function ReviewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [msg, setMsg] = useState("");

  const cur = useMemo(() => items[idx], [items, idx]);

  async function loadQueue() {
    setMsg("불러오는 중...");
    const res = await fetch("/api/review/queue?due=30&new=10");
    const json = await res.json();
    if (!res.ok) setMsg(`오류: ${json.error ?? "unknown"}`);
    else {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ fontSize: 20 }}>Review</h1>
        <div style={{ color: "#666" }}>{items.length ? `${idx + 1}/${items.length}` : ""}</div>
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
            <button onClick={() => answer(1)} style={btn}>Again</button>
            <button onClick={() => answer(2)} style={btn}>Hard</button>
            <button onClick={() => answer(3)} style={btn}>Good</button>
            <button onClick={() => answer(4)} style={btn}>Easy</button>
            <button onClick={loadQueue} style={{ ...btn, marginLeft: "auto" }}>Reload</button>
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