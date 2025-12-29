export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0 }}>My Vocab (FSRS)</h1>
      <p style={{ color: "#666", marginTop: 6 }}>
        단어장 관리(목록/수정)와 복습(FSRS)을 할 수 있습니다.
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <a
          href="/review"
          style={{
            display: "block",
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          <div style={{ fontWeight: 700 }}>복습하기 (/review)</div>
          <div style={{ color: "#666", marginTop: 4 }}>Again/Hard/Good/Easy로 평가</div>
        </a>

        <a
          href="/import"
          style={{
            display: "block",
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          <div style={{ fontWeight: 700 }}>CSV 가져오기 (/import)</div>
          <div style={{ color: "#666", marginTop: 4 }}>word,meaning 형식</div>
        </a>

        <a
          href="/words"
          style={{
            display: "block",
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          <div style={{ fontWeight: 700 }}>단어 목록 보기/검색/수정 (/words)</div>
          <div style={{ color: "#666", marginTop: 4 }}>전체 단어를 보고 수정</div>
        </a>

        <a
  href="/dashboard"
  style={{
    display: "block",
    padding: 12,
    border: "1px solid #eee",
    borderRadius: 10,
    textDecoration: "none",
  }}
>
  <div style={{ fontWeight: 700 }}>학습 대시보드 (/dashboard)</div>
  <div style={{ color: "#666", marginTop: 4 }}>상태별 개수, due 분포 히스토그램</div>
</a>

      </div>
    </main>
  );
}