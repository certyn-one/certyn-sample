// Northwind Commerce — demo target configuration.
// This is a deliberately-flawed demo app used to show Certyn finding real bugs.
// Defects are ON by default. Append ?clean to any URL to disable the client-side
// defects (for a before/after demo). The static /api/*.json defects are always on.
(function () {
  var params = new URLSearchParams(location.search);
  var clean = params.has("clean");

  window.DEMO = {
    productName: "Northwind Commerce",
    productTagline: "Merchant Admin",

    // Hardcoded demo accounts for testing the login flow. The Owner account is also seeded
    // into Certyn as the environment variables LOGIN_USERNAME / LOGIN_PASSWORD so the agent
    // can sign in. Cover the common scenarios: valid, valid (admin), and a locked account.
    accounts: [
      { email: "qa.tester@acme.example", password: "Acme-QA-2026!", name: "Alex Rivera", role: "Owner", status: "active" },
      { email: "demo@northwind.shop", password: "Demo1234!", name: "Demo Staff", role: "Staff", status: "active" },
      { email: "locked@northwind.shop", password: "Locked1234!", name: "Jordan Kim", role: "Staff", status: "locked" }
    ],

    bugsEnabled: !clean
  };
  // Primary account (kept for convenience / the seeded Certyn credentials).
  window.DEMO.auth = window.DEMO.accounts[0];

  // Client-side "session" (static site — no server). Stored in localStorage.
  window.DEMO.getSession = function () {
    try { return JSON.parse(localStorage.getItem("nw_session") || "null"); } catch (e) { return null; }
  };
  window.DEMO.setSession = function (s) { localStorage.setItem("nw_session", JSON.stringify(s)); };
  window.DEMO.clearSession = function () { localStorage.removeItem("nw_session"); };

  // Apply the clean flag as early as possible so CSS-driven defects can be overridden.
  if (clean) document.documentElement.classList.add("clean");

  // Rollback switch for the JPY currency defect (#14): append ?JPY to any URL to reveal
  // the Japanese Yen option in the currency picker; ?JPY=off puts it back. Unlike ?clean
  // this is sticky for the tab, because the nav links drop the query string — without
  // that, landing on ?JPY and clicking through to Settings would silently lose the flag.
  var jpy = null;
  params.forEach(function (value, key) {
    if (key.toLowerCase() !== "jpy") return;
    jpy = !/^(0|off|false|no)$/i.test(value);
  });
  try {
    if (jpy === null) jpy = sessionStorage.getItem("nw_jpy") === "1";
    else if (jpy) sessionStorage.setItem("nw_jpy", "1");
    else sessionStorage.removeItem("nw_jpy");
  } catch (e) { jpy = jpy === true; }

  window.DEMO.jpyEnabled = jpy;
  if (jpy) document.documentElement.classList.add("jpy");
})();
