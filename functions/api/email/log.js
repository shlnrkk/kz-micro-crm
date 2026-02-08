const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const nowIso = () => new Date().toISOString();

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));

  const lead_id = body.lead_id;
  const result = (body.result || "").trim(); // "sent" | "failed"
  const note = (body.note || "").trim() || null;

  if (!lead_id) return json({ error: "lead_id required" }, 400);

  const id = crypto.randomUUID();
  const ts = nowIso();

  await env.DB.prepare(`
    INSERT INTO activities (id, lead_id, channel, direction, result, note, created_at)
    VALUES (?, ?, 'email', 'outbound', ?, ?, ?)
  `).bind(id, lead_id, result, note, ts).run();

  // если письмо ушло — двигаем статус
  if (result === "sent") {
    await env.DB.prepare(`
      UPDATE leads SET status='Contacted', updated_at=? WHERE id=?
    `).bind(ts, lead_id).run();
  }

  return json({ ok: true });
}