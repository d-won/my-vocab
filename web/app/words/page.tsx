"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  word: string;
  created_at: string;
  meanings: string[];
};

type Resp = {
  items: Item[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function WordsPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"created_at" | "word">("created_at");
  const [dir, setDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [editing, setEditing] = useState<Item | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editMeanings, setEditMeanings] = useState(""); // 줄바꿈으로 편집

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    sp.set("sort", sort);
    sp.set("dir", dir);
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    return sp.toString();
  }, [q, sort, dir, page, pageSize]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/words?${queryString}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  function openEdit(item: Item) {
    setEditing(item);
    setEditWord(item.word);
    setEditMeanings((item.meanings ?? []).join("\n"));
  }

  async function saveEdit() {
    if (!editing) return;
    const nextWord = editWord.trim();
    const nextMeanings = editMeanings
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const res = await fetch(`/api/words/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: nextWord, meanings: nextMeanings }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Update failed");
    }
  }

  const items = data?.items ?? [];

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Words</h1>

        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="검색: 단어 또는 뜻"
          style={{ padding: 8, minWidth: 240, flex: "1 1 240px" }}
        />

        <select value={sort} onChange={(e) => { setSort(e.target.value as any); setPage(1); }} style={{ padding: 8 }}>
          <option value="created_at">정렬: 최근 추가</option>
          <option value="word">정렬: 단어</option>
        </select>

        <select value={dir} onChange={(e) => { setDir(e.target.value as any); setPage(1); }} style={{ padding: 8 }}>
          <option value="desc">내림차순</option>
          <option value="asc">오름차순</option>
        </select>

        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ padding: 8 }}>
          <option value={10}>10개</option>
          <option value={25}>25개</option>
          <option value={50}>50개</option>
          <option value={100}>100개</option>
        </select>

        <button onClick={load} style={{ padding: "8px 12px" }}>새로고침</button>
      </header>

      <div style={{ marginTop: 10, color: "#666" }}>
        {loading ? "불러오는 중..." : err ? `오류: ${err}` : `총 ${data?.total ?? 0}개`}
      </div>

      <section style={{ marginTop: 12, borderTop: "1px solid #eee" }}>
        {items.map((it) => (
          <div key={it.id} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{it.word}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#999", fontSize: 12 }}>{fmtDate(it.created_at)}</span>
                <button onClick={() => openEdit(it)} style={{ padding: "6px 10px" }}>수정</button>
              </div>
            </div>

            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {(it.meanings ?? []).map((m, idx) => (
                <li key={idx} style={{ lineHeight: 1.6 }}>{m}</li>
              ))}
              {(it.meanings ?? []).length === 0 && (
                <li style={{ color: "#999" }}>뜻 없음</li>
              )}
            </ul>
          </div>
        ))}
      </section>

      <footer style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          style={{ padding: "8px 12px" }}
        >
          이전
        </button>

        <div style={{ color: "#666" }}>
          {data ? `${data.page} / ${data.totalPages || 1}` : "—"}
        </div>

        <button
          disabled={!data || page >= (data.totalPages || 1)}
          onClick={() => setPage((p) => p + 1)}
          style={{ padding: "8px 12px" }}
        >
          다음
        </button>
      </footer>

      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              background: "#fff",
              borderRadius: 10,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ margin: "0 0 12px" }}>단어 수정</h2>

            <label style={{ display: "block", marginBottom: 6, color: "#666" }}>단어</label>
            <input
              value={editWord}
              onChange={(e) => setEditWord(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 12 }}
            />

            <label style={{ display: "block", marginBottom: 6, color: "#666" }}>뜻 (한 줄 = 한 항목)</label>
            <textarea
              value={editMeanings}
              onChange={(e) => setEditMeanings(e.target.value)}
              rows={8}
              style={{ width: "100%", padding: 10, marginBottom: 12, fontFamily: "inherit" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setEditing(null)} style={{ padding: "8px 12px" }}>
                취소
              </button>
              <button onClick={saveEdit} style={{ padding: "8px 12px" }}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
