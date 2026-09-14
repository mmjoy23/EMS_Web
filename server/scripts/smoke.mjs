// Throwaway API smoke test. Run while the server is up: node scripts/smoke.mjs
const BASE = "http://localhost:4000/api";

function cookieFrom(res) {
  const raw = res.headers.get("set-cookie") || "";
  const m = raw.match(/uev_token=[^;]+/);
  return m ? m[0] : "";
}
async function j(res) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
async function login(email) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  return { cookie: cookieFrom(res), body: await j(res), status: res.status };
}
const get = (path, cookie = "") => fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {} }).then(j);
const post = (path, body, cookie = "") =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  }).then(j);

const line = (...a) => console.log(...a);

const health = await get("/health");
line("health:", health.ok ? "OK" : health);

const events = await get("/events");
line(`events: ${events.events.length} listed`);
const sample = events.events.find((e) => e.slug === "cyber-workshop");
line(`  cyber-workshop → ${sample.registeredCount}/${sample.seatLimit} (remaining ${sample.remaining}, soldOut=${sample.soldOut})`);

const featured = await get("/events/featured");
line(`featured: ${featured.events.length} (${featured.events.map((e) => e.slug).join(", ")})`);

const student = await login("student@uni.edu");
line(`login student: ${student.status} → ${student.body.user?.name} (${student.body.user?.role})`);

const me = await get("/auth/me", student.cookie);
line(`me: ${me.user?.email}`);

const myRegs = await get("/registrations/me", student.cookie);
line(`my registrations: ${myRegs.registrations.length}`);
const cyberReg = myRegs.registrations.find((r) => r.event.slug === "cyber-workshop");
const ticket = await get(`/registrations/${cyberReg.event.id}/ticket`, student.cookie);
line(`  ticket code: ${ticket.ticket.ticketCode}, seat ${ticket.ticket.seatNumber}`);

const outbox = await get("/outbox", student.cookie);
line(`student outbox: ${outbox.messages.length} messages (${[...new Set(outbox.messages.map((m) => m.type))].join(", ")})`);

const pending = await get("/feedback/pending", student.cookie);
line(`pending feedback: ${pending.events.length} (${pending.events.map((e) => e.slug).join(", ")})`);

const sstats = await get("/stats", student.cookie);
line(`student stats:`, JSON.stringify(sstats.stats));

// ---- Organizer: manage + check-in flow ----
const org = await login("organizer@uni.edu");
line(`\nlogin organizer: ${org.status} → ${org.body.user?.name}`);
const mine = await get("/events?mine=true", org.cookie);
line(`organizer manages: ${mine.events.length} events`);
const target = mine.events.find((e) => e.slug === "ai-summit");
const parts = await get(`/events/${target.id}/participants`, org.cookie);
line(`ai-summit participants: ${parts.participants.length}`);
const someone = parts.participants.find((p) => p.status === "registered");

const scan1 = await post("/checkin", { code: someone.ticketCode, eventId: target.id }, org.cookie);
line(`check-in #1: ${scan1.result} (${scan1.attendee?.name}) → ${scan1.counts?.checkedIn}/${scan1.counts?.registered}`);
const scan2 = await post("/checkin", { code: someone.ticketCode, eventId: target.id }, org.cookie);
line(`check-in #2 (re-scan): ${scan2.result}`);
const scan3 = await post("/checkin", { code: "UEV-NOTREAL", eventId: target.id }, org.cookie);
line(`check-in #3 (bogus): ${scan3.result}`);

const report = await get(`/events/${events.events.find((e) => e.slug === "yoga").id}/report`, org.cookie);
line(`yoga report: ${report.report.attendedCount}/${report.report.registeredCount} attended (${report.report.attendanceRate}%)`);

const ostats = await get("/stats", org.cookie);
line(`organizer stats: ${ostats.stats.managedEvents} managed, ${ostats.stats.attendanceRate}% attendance`);

// ---- Admin stats ----
const admin = await login("admin@uni.edu");
const astats = await get("/stats", admin.cookie);
line(`\nadmin stats: ${astats.stats.totalUsers} users, ${astats.stats.totalRegistrations} regs, ${astats.stats.attendanceRate}% attendance, ${astats.stats.categoryBreakdown.length} categories, trend ${astats.stats.monthlyTrend.length} months`);
line("done.");
