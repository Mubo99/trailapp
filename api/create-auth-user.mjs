const SUPABASE_URL = process.env.SUPABASE_URL || "https://rxaqaiploxbtbpeicots.supabase.co";
const ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_eRAVodiGglqMSGgZ8T7WGg_fNUvhreH";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabase(path, key, init = {}) {
  const res = await fetch(SUPABASE_URL + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || data?.msg || data?.error_description || res.statusText;
    throw new Error(msg);
  }
  return data;
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function authedUser(token) {
  const res = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function isAppAdmin(email) {
  const rows = await supabase("/rest/v1/app_state?id=eq.main&select=data", SERVICE_KEY);
  const users = rows?.[0]?.data?.users || [];
  return users.some((u) => u.email === email && u.role === "admin" && u.active !== false);
}

async function findAuthUser(email) {
  for (let page = 1; page <= 10; page += 1) {
    const data = await supabase(`/auth/v1/admin/users?page=${page}&per_page=100`, SERVICE_KEY);
    const found = (data?.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (!data?.users?.length || data.users.length < 100) return null;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!SERVICE_KEY) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" });

  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const caller = token ? await authedUser(token) : null;
    if (!caller?.email || !(await isAppAdmin(caller.email))) {
      return res.status(403).json({ error: "Admin эрх шаардлагатай" });
    }

    const { password, name, role } = req.body || {};
    const email = cleanEmail(req.body?.email);
    if (!email || !password) return res.status(400).json({ error: "Имэйл болон passcode шаардлагатай" });
    if (!validEmail(email)) return res.status(400).json({ error: "Зөв email оруулна уу. Жишээ: name@gmail.com" });

    const existing = await findAuthUser(email);
    if (existing) {
      await supabase(`/auth/v1/admin/users/${existing.id}`, SERVICE_KEY, {
        method: "PUT",
        body: JSON.stringify({
          password,
          email_confirm: true,
          user_metadata: { name, role },
        }),
      });
      return res.status(200).json({ ok: true, updated: true });
    }

    await supabase("/auth/v1/admin/users", SERVICE_KEY, {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      }),
    });
    return res.status(200).json({ ok: true, created: true });
  } catch (error) {
    const message = error.message || "Auth user үүсгэхэд алдаа гарлаа";
    if (/validate email|invalid email|email address/i.test(message)) {
      return res.status(400).json({ error: "Email хаяг буруу байна. Gmail/company email шиг бодит email ашиглана уу." });
    }
    return res.status(500).json({ error: message });
  }
}
