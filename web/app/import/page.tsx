"use client";

import { useState } from "react";

export default function ImportPage() {
  const [csvText, setCsvText] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function runImport() {
    setMsg("업로드 중...");
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvText }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(`오류: ${json.error ?? "unknown"}`);
    else setMsg(`완료: ${json.upserted}개 처리`);
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>CSV Import</h1>
      <p style={{ color: "#666" }}>
        헤더는 <code>word,meaning</code> 이어야 합니다. 뜻은 <code>;</code>로 구분됩니다.
      </p>

      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={"word,meaning\nresonate,울려 퍼지다; 공명이 잘 되다"}
        style={{ width: "100%", height: 240, marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button onClick={runImport} style={btn}>Import</button>
        <a href="/" style={{ ...btn, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>Home</a>
      </div>

      <div style={{ marginTop: 12, color: "#333" }}>{msg}</div>
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