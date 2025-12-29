"use client";

import { useEffect, useState } from "react";

type Bucket = { key: string; label: string; count: number };

type Stats = {
  total: number;
  learned: number;
  new: number;
  dueToday: number;
  overdue: number;
  dueNext7: number;
  byState: Record<string, number>;
  dueHistogram: Bucket[];
};

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 60px", gap: 10, alignItems: "center" }}>
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ background: "#f2f2f2", borderRadius: 999, overflow: "hidden", height: 12 }}>
        <div style={{ width: `${pct}%`, height: 12, background: "#111" }} />
      </div>
      <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setStats(json);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const maxBucket = Math.max(...(stats?.dueHistogram?.map((b) => b.count) ?? [0]));
  const stateEntries = Object.entries(stats?.byState ?? {}).sort((a, b) => b[1] - a[1]);
  const maxState = Math.max(...stateEntries.map(([, v]) => v), 0);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/" style={{ textDecoration: "none" }}>홈</a>
          <a href="/review" style={{ textDecoration: "none" }}>복습</a>
          <a href="/words" style={{ textDecoration: "none" }}>단어목록</a>
          <button onClick={load} style={{ padding: "6px 10px" }}>새로고침</button>
        </div>
      </header>

      {err && <div style={{ marginTop: 12, color: "crimson" }}>오류: {err}</div>}
      {!stats && !err && <div style={{ marginTop: 12, color: "#666" }}>불러오는 중...</div>}

      {stats && (
        <>
          <section style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {[
              ["총 단어", stats.total],
              ["NEW(미학습)", stats.new],
              ["학습 시작", stats.learned],
              ["지남(Overdue)", stats.overdue],
              ["오늘 Due", stats.dueToday],
              ["7일 내 Due", stats.dueNext7],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                <div style={{ color: "#666", fontSize: 13 }}>{k}</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{v as any}</div>
              </div>
            ))}
          </section>

          <section style={{ marginTop: 18 }}>
            <h2 style={{ margin: "0 0 10px" }}>복습 예정 분포 (due 기준)</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {stats.dueHistogram.map((b) => (
                <Bar key={b.key} label={b.label} value={b.count} max={maxBucket} />
              ))}
            </div>
          </section>

          <section style={{ marginTop: 18 }}>
            <h2 style={{ margin: "0 0 10px" }}>상태별 카드 수 (FSRS state)</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {stateEntries.length === 0 && <div style={{ color: "#666" }}>상태 데이터가 아직 없습니다.</div>}
              {stateEntries.map(([k, v]) => (
                <Bar key={k} label={k} value={v} max={maxState} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}