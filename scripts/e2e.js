#!/usr/bin/env node
/**
 * End-to-end browser test: drives the real UI against a running stack.
 *
 *   terminal 1:  npm run dev                      (API + web)
 *   terminal 2:  npm i -D puppeteer && npm run e2e
 *
 * Options (env):  WEB_URL (default http://localhost:3000)  API_URL (default http://localhost:5000/api)
 *                 SCREENSHOTS=docs/screenshots   save README screenshots
 *                 CHROME_PATH=/path/to/chrome    use an existing browser with puppeteer-core
 */
const fs = require("fs");
const path = require("path");

const WEB = process.env.WEB_URL || "http://localhost:3000";
const API = process.env.API_URL || "http://localhost:5000/api";
const SHOTS = process.env.SCREENSHOTS;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (cond, msg) => { console.log(`${cond ? "  ✔" : "  ✘"} ${msg}`); if (!cond) failed++; };

async function launch() {
  const args = (process.env.CHROME_ARGS || "--no-sandbox --disable-setuid-sandbox").split(" ");
  try { const pp = require("puppeteer"); return pp.launch({ headless: "shell", args, defaultViewport: { width: 1366, height: 900 } }); }
  catch { const pp = require("puppeteer-core"); return pp.launch({ executablePath: process.env.CHROME_PATH, headless: "shell", args, defaultViewport: { width: 1366, height: 900 } }); }
}

(async () => {
  const stamp = Date.now();
  const email = `e2e${stamp}@example.test`, pw = "Passw0rd123";
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 160)));
  const shot = async (name, opts = {}) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + ".png"), ...opts }); };
  const go = async (p) => { await page.goto(WEB + p, { waitUntil: "networkidle0" }); await sleep(700); };
  const click = async (text) => {
    const h = await page.evaluateHandle((t) => [...document.querySelectorAll("button,a,[role=menuitem]")].find((b) => b.innerText.trim().toLowerCase().startsWith(t.toLowerCase())), text);
    const el = h.asElement(); if (!el) throw new Error(`Could not find "${text}"`); await el.click(); await sleep(450);
  };
  const fill = async (sel, v) => { await page.focus(sel); await page.keyboard.down("Control"); await page.keyboard.press("KeyA"); await page.keyboard.up("Control"); await page.keyboard.press("Backspace"); await page.type(sel, v); };
  const pickSeats = async (tier, n) => {
    const labels = await page.$$eval('button[aria-label^="Row "]', (bs) => bs.filter((b) => !b.disabled).map((b) => b.getAttribute("aria-label")));
    const want = labels.filter((l) => l.includes(tier) && l.endsWith("available")).slice(0, n);
    for (const l of want) { await page.evaluate((l) => document.querySelector(`button[aria-label="${l}"]`).click(), l); await sleep(120); }
    return want.map((l) => { const m = /Row ([A-Z]), seat (\d+)/.exec(l); return m[1] + m[2]; });
  };

  console.log("\nVyaaspeeth E2E\n");
  const health = await fetch(API + "/health").then((r) => r.json()).catch(() => null);
  check(health?.status === "ok", `API reachable at ${API}`);
  if (!health) { console.log("\nStart the stack first: npm run dev\n"); process.exit(1); }

  await go("/"); await shot("01-home");
  await go("/events"); check((await page.$$("article")).length >= 8, "schedule lists all shows"); await shot("02-schedule");

  await go("/signup"); await page.type("#name", "Asha Rao"); await page.type("#email", email); await page.type("#password", pw);
  await Promise.all([page.waitForFunction(() => location.pathname === "/", { timeout: 15000 }), page.click("button[type=submit]")]);
  check(true, "sign up through the form");

  await go("/events/2"); await shot("03-event");
  await click("Select seats"); await page.waitForFunction(() => location.pathname === "/booking/2");
  await page.waitForSelector('button[aria-label^="Row "]'); await sleep(900);
  const seats = [...(await pickSeats("Premium", 2)), ...(await pickSeats("Standard", 1))];
  check(seats.length === 3 && (await page.$$('button[aria-pressed="true"][aria-label^="Row "]')).length === 3, `choose seats on the map (${seats.join(", ")})`);
  await shot("04-seat-map");
  await click("Next"); await page.type("#phone", "+91 98765 43210"); await sleep(300); await shot("05-payment");
  await click("Pay ₹"); await page.waitForFunction(() => document.body.innerText.includes("You're going"), { timeout: 15000 }); await sleep(3600);
  check(true, "payment confirmed and ticket issued");
  await page.evaluate(() => window.scrollTo(0, 0)); await shot("06-ticket");
  const ref = await page.evaluate(() => document.body.innerText.match(/VYS-[A-Z0-9]{10}/)?.[0]);

  // a second user must not be able to take the same seats
  const rival = await (await fetch(API + "/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Rival User", email: `rival${stamp}@example.test`, password: pw }) })).json();
  const clash = await fetch(API + "/bookings", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + rival.token }, body: JSON.stringify({ eventId: "2", seats: [seats[0]], attendee: { fullName: "Rival" } }) });
  check(clash.status === 409, `double booking of ${seats[0]} is rejected (HTTP ${clash.status})`);
  const tamper = await fetch(API + "/bookings", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + rival.token }, body: JSON.stringify({ eventId: "2", seats: ["J1"], total: 1, attendee: { fullName: "Rival" } }) });
  check(tamper.status === 400, "price tampering is rejected (HTTP 400)");
  const idor = await fetch(`${API}/bookings/${ref}`, { headers: { Authorization: "Bearer " + rival.token } });
  check(idor.status === 404, "another user cannot read this booking (HTTP 404)");

  await go("/my-bookings"); await sleep(800); check((await page.evaluate(() => document.body.innerText)).includes(ref), "booking appears in My bookings"); await shot("07-my-bookings");

  await page.click('button[aria-label="Account menu"]'); await sleep(300); await click("Sign out"); await sleep(900);
  check(await page.evaluate(() => !document.querySelector('button[aria-label="Account menu"]')), "sign out");
  await go("/my-bookings"); check(page.url().includes("/login"), "protected page redirects to sign in");
  await page.type("#email", email); await page.type("#password", "WrongPass999"); await page.click("button[type=submit]"); await sleep(1000);
  check((await page.evaluate(() => document.body.innerText)).includes("Invalid email or password"), "wrong password shows an error");
  await fill("#password", pw);
  await Promise.all([page.waitForFunction(() => location.pathname === "/my-bookings", { timeout: 15000 }), page.click("button[type=submit]")]);
  check(true, "sign in sends you back to the page you wanted");

  // mobile: a fresh page with a phone viewport and the same session
  const token = await page.evaluate(() => localStorage.getItem("vy_token") || sessionStorage.getItem("vy_token"));
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  await mobile.evaluateOnNewDocument((t) => localStorage.setItem("vy_token", t), token);
  await mobile.goto(WEB + "/booking/1", { waitUntil: "networkidle0" });
  await mobile.waitForSelector('button[aria-label^="Row "]'); await sleep(700);
  const fits = await mobile.evaluate(() => { const map = document.querySelector('[aria-label="Seat map"]'), panel = map.parentElement.parentElement.getBoundingClientRect(), r = map.getBoundingClientRect(); return r.left >= panel.left && r.right <= panel.right; });
  check(fits, "seat map fits a phone screen");
  if (SHOTS) await mobile.screenshot({ path: path.join(SHOTS, "08-mobile-seats.png") });

  check(pageErrors.length === 0, pageErrors.length ? `browser errors: ${pageErrors.join(" | ")}` : "no browser errors");
  await browser.close();
  console.log(failed ? `\n${failed} check(s) failed\n` : "\nAll checks passed\n");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("\nE2E crashed:", e.message); process.exit(1); });
