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
    // Valid demo credentials. These are also seeded into Certyn as the environment
    // variables LOGIN_USERNAME / LOGIN_PASSWORD so the agent can sign in.
    auth: {
      username: "qa.tester@acme.example",
      password: "Acme-QA-2026!"
    },
    bugsEnabled: !clean
  };

  // Apply the clean flag as early as possible so CSS-driven defects can be overridden.
  if (clean) document.documentElement.classList.add("clean");
})();
