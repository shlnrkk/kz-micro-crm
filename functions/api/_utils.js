const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function clampInt(v, def, min, max) {
  const n = Number.parseInt(v ?? "", 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export { json, clampInt };