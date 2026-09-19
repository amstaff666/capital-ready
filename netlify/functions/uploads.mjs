const MARKET_ENV = {
  EE: "BACKEND_API_EE",
  FI: "BACKEND_API_FI",
  PL: "BACKEND_API_PL",
  ZA: "BACKEND_API_ZA",
  KE: "BACKEND_API_KE"
};

function json(statusCode, body) {
  return {statusCode,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"},body:JSON.stringify(body)};
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405,{error:"method_not_allowed"});
  let payload;
  try { payload = JSON.parse(event.body || "{}"); }
  catch { return json(400,{error:"invalid_json"}); }

  const market = String(payload.market || "").toUpperCase();
  const envName = MARKET_ENV[market];
  const baseUrl = envName && process.env[envName];
  if (!baseUrl) return json(503,{error:"market_backend_not_configured",market});
  if (!payload.caseId || !payload.filename || !payload.contentType) return json(400,{error:"missing_upload_metadata"});

  const upstream = await fetch(new URL(`/v1/cases/${encodeURIComponent(payload.caseId)}/uploads`, baseUrl), {
    method:"POST",
    headers:{"content-type":"application/json","x-annator-market":market},
    body:JSON.stringify(payload)
  });

  const text = await upstream.text();
  return {statusCode:upstream.status,headers:{"content-type":upstream.headers.get("content-type") || "application/json","cache-control":"no-store"},body:text};
}
