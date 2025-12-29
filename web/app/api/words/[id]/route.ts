import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  word?: string;
  meanings?: string[];
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Body;

  const nextWord = (body.word ?? "").trim();
  const nextMeanings = Array.isArray(body.meanings)
    ? body.meanings.map((s) => String(s).trim()).filter((s) => s.length > 0)
    : null;

  // 1) word 업데이트(옵션)
  if (nextWord) {
    const { error: upErr } = await supabaseAdmin
      .from("cards")
      .update({ front: nextWord })
      .eq("id", id);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  // 2) meanings 업데이트(옵션): 기존 전부 삭제 후 재삽입(가장 단순/안전)
  if (nextMeanings) {
    const { error: delErr } = await supabaseAdmin
      .from("card_meanings")
      .delete()
      .eq("card_id", id);

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    if (nextMeanings.length > 0) {
      const rows = nextMeanings.map((meaning) => ({
        card_id: id,
        meaning,
      }));

      const { error: insErr } = await supabaseAdmin
        .from("card_meanings")
        .insert(rows);

      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
