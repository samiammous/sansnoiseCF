// Cloudflare Pages Function — handles POST /api/contact
// Receives the contact form, validates it, and emails the details to you
// via Resend (free tier). No visitor mail client involved.
//
// SETUP (one time):
//   1. Create a free account at resend.com
//   2. Add + verify the domain "sansnoise.com" (Resend shows DNS records;
//      add them in Cloudflare DNS — takes a few minutes to verify).
//   3. Create an API key in Resend.
//   4. In Cloudflare Pages → your project → Settings → Environment variables,
//      add a variable named  RESEND_API_KEY  with that key as the value
//      (mark it encrypted / "secret"). Redeploy.
//
// LOCAL BACKUP (optional but enabled here):
//   Every submission is also saved to a Cloudflare KV namespace so you keep a
//   copy even if email ever fails. To turn it on:
//     a. Cloudflare dashboard → Storage & Databases → KV → Create namespace
//        (e.g. "sansnoise-contacts").
//     b. Your Pages project → Settings → Bindings (or Functions → KV namespace
//        bindings) → Add → Variable name MUST be  CONTACT_KV  → pick the
//        namespace → Save → redeploy.
//   Browse saved entries any time in that KV namespace (keys start "submission:").
//   If the binding is absent the function still works; it just skips the backup.
//
// To change where mail lands, edit TO_ADDRESS / FROM_ADDRESS below.

const TO_ADDRESS = "hello@sansnoise.com";
const FROM_ADDRESS = "Sans Noise <hello@sansnoise.com>"; // must be on the verified domain

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Bad request." }, 400);
  }

  const name = (data.name || "").toString().trim();
  const organization = (data.organization || "").toString().trim();
  const email = (data.email || "").toString().trim();
  const message = (data.message || "").toString().trim();
  const honeypot = (data.company || "").toString().trim(); // spam trap

  // A bot filled the hidden field — pretend success, send nothing.
  if (honeypot) return json({ ok: true });

  if (!name || !email || !message) {
    return json({ ok: false, error: "Please add your name, email, and a message." }, 400);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: "That email address looks off." }, 400);
  }
  if (!env.RESEND_API_KEY) {
    return json({ ok: false, error: "Email is not configured yet." }, 500);
  }

  const subject =
    "New enquiry — " + name + (organization ? " (" + organization + ")" : "");
  const text =
    "Name: " + name +
    "\nOrganization: " + (organization || "—") +
    "\nEmail: " + email +
    "\n\n" + message;

  // --- Local backup: best-effort write to KV (never blocks the email) ---
  if (env.CONTACT_KV) {
    try {
      const now = new Date().toISOString();
      const id = now + "-" + Math.random().toString(36).slice(2, 8);
      await env.CONTACT_KV.put(
        "submission:" + id,
        JSON.stringify({
          name: name,
          organization: organization,
          email: email,
          message: message,
          receivedAt: now,
          ip: request.headers.get("cf-connecting-ip") || "",
        })
      );
    } catch (e) {
      // swallow — backup is non-critical
    }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TO_ADDRESS],
        reply_to: email, // replying goes straight to the visitor
        subject: subject,
        text: text,
      }),
    });

    if (!res.ok) {
      return json({ ok: false, error: "Could not send right now." }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: "Could not send right now." }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
