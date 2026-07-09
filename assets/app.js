// Northwind Commerce — client interactions.
// Runs after layout.js. Several client-side defects live here, gated on
// window.DEMO.bugsEnabled (append ?clean to disable them).
(function () {
  var BUGS = (window.DEMO && window.DEMO.bugsEnabled) !== false;
  var NW = window.NW || {};
  var $ = function (id) { return document.getElementById(id); };

  function apiBase() { return location.pathname.replace(/[^/]*$/, ""); }
  function api(path) { return apiBase() + path.replace(/^\//, ""); }
  function money(n) {
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function badge(status) {
    var map = { paid: "green", fulfilled: "blue", pending: "amber", refunded: "red" };
    var cls = map[(status || "").toLowerCase()] || "gray";
    var label = (status || "—").charAt(0).toUpperCase() + (status || "").slice(1);
    return '<span class="badge ' + cls + '">' + label + "</span>";
  }
  function avatar(name) {
    return '<span class="avatar sm" style="background:' + (NW.avatarColor ? NW.avatarColor(name) : "#888") + '">' +
      (NW.initials ? NW.initials(name) : "?") + "</span>";
  }

  // ── Global search → search page ─────────────────────────────────────────────
  var dashSearch = $("dash-search-form");
  if (dashSearch) {
    dashSearch.addEventListener("submit", function (e) {
      e.preventDefault();
      location.href = "search.html?q=" + encodeURIComponent(($("dash-search") || {}).value || "");
    });
  }

  // ── Orders: revenue summary chip ────────────────────────────────────────────
  var summaryEl = $("revenue-summary");
  if (summaryEl) {
    fetch(api("/api/orders/summary.json"))
      .then(function (r) { return r.json(); })
      .then(function (d) { summaryEl.textContent = d.totalRevenueDisplay; })
      .catch(function () { summaryEl.textContent = "—"; });
  }

  // ── Orders: table from the API + status filter tabs ─────────────────────────
  var ordersBody = $("orders-body");
  if (ordersBody) {
    fetch(api("/api/orders.json"))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        ordersBody.innerHTML = "";
        (d.orders || []).forEach(function (o) {
          var tr = document.createElement("tr");
          tr.setAttribute("data-status", (o.status || "").toLowerCase());
          // total may be a number or (per the contract-drift defect) a string.
          var total = o.currency ? esc(o.total) + " " + esc(o.currency) : esc(o.total);
          tr.innerHTML =
            '<td><a href="order.html?id=' + encodeURIComponent(o.id) + '">' + esc(o.id) + "</a></td>" +
            '<td><span class="who">' + avatar(o.customer) + "<span>" + esc(o.customer) + "</span></span></td>" +
            "<td>" + badge(o.status) + "</td>" +
            '<td class="mono">' + total + "</td>" +
            '<td class="muted">' + new Date(o.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + "</td>";
          ordersBody.appendChild(tr);
        });
      })
      .catch(function () {
        ordersBody.innerHTML = '<tr><td colspan="5" class="note">Could not load orders.</td></tr>';
      });

    var tabs = document.querySelectorAll("#order-tabs button");
    Array.prototype.forEach.call(tabs, function (btn) {
      btn.addEventListener("click", function () {
        Array.prototype.forEach.call(tabs, function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var f = btn.getAttribute("data-filter");
        Array.prototype.forEach.call(ordersBody.querySelectorAll("tr"), function (tr) {
          tr.style.display = (f === "all" || tr.getAttribute("data-status") === f) ? "" : "none";
        });
      });
    });
  }

  // ── Orders: "Recalculate totals" ────────────────────────────────────────────
  var recalc = $("recalc");
  if (recalc) {
    recalc.addEventListener("click", function () {
      var note = $("recalc-note");
      if (BUGS) {
        // Defect #2 (performance): synchronous long task blocks the main thread.
        var start = performance.now(); var acc = 0;
        for (var i = 0; i < 60000; i++) for (var j = 0; j < 20; j++) acc += Math.sqrt((i * j) % 97);
        note.textContent = "Recalculated in " + Math.round(performance.now() - start) + "ms.";
      } else {
        note.textContent = "Recalculated instantly.";
      }
    });
  }

  // ── Order detail (?id=) ─────────────────────────────────────────────────────
  var orderDetail = $("order-detail");
  if (orderDetail) {
    var id = new URLSearchParams(location.search).get("id") || "";
    if ($("order-id-label")) $("order-id-label").textContent = id || "(none)";
    fetch(api("/api/orders/" + encodeURIComponent(id) + ".json"))
      .then(function (r) { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(function (o) {
        var rows = [
          ["Order", esc(o.id)],
          ["Customer", esc(o.customer)],
          ["Total", o.currency ? money(o.total) + " " + esc(o.currency) : esc(o.total)]
        ];
        if (o.privateNotes) rows.push(["Private notes", esc(o.privateNotes)]);
        orderDetail.innerHTML = rows.map(function (r) {
          return '<div class="kv"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + "</span></div>";
        }).join("");
      })
      .catch(function () { orderDetail.innerHTML = '<p class="note">Order not found.</p>'; });
  }

  // ── Settings save ───────────────────────────────────────────────────────────
  var settingsForm = $("settings-form");
  if (settingsForm) {
    settingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var toast = $("save-toast");
      // There is no writable settings endpoint on a static host, so this request fails.
      fetch(api("/api/settings"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: ($("display-name") || {}).value })
      }).then(function (res) {
        // Defect #4 (diagnostics): optimistic UI claims success regardless of the response.
        if (BUGS || res.ok) { toast.className = "toast ok show"; toast.textContent = "Saved ✓"; }
        else { toast.className = "toast bad show"; toast.textContent = "Could not save your changes."; }
      }).catch(function () {
        if (BUGS) { toast.className = "toast ok show"; toast.textContent = "Saved ✓"; }
        else { toast.className = "toast bad show"; toast.textContent = "Could not save your changes (network error)."; }
      });
    });
  }

  // ── Account: login + private area ───────────────────────────────────────────
  var loginForm = $("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var u = ($("login-username") || {}).value, p = ($("login-password") || {}).value;
      var creds = (window.DEMO && window.DEMO.auth) || {};
      var valid = u === creds.username && p === creds.password;
      // Defect #13 (broken auth): when defects are on, ANY credentials are accepted.
      if (BUGS || valid) {
        $("login-view").style.display = "none";
        $("account-view").style.display = "";
        if (!BUGS) { var ts = $("txn-search"); if (ts) ts.setAttribute("aria-label", "Find a transaction"); }
      } else {
        var t = $("login-toast"); t.className = "toast bad show"; t.textContent = "Sign in failed. Check your credentials.";
      }
    });
  }

  // ── Search results (?q=) ────────────────────────────────────────────────────
  var results = $("search-results");
  if (results) {
    var q = new URLSearchParams(location.search).get("q") || "";
    if ($("search-echo")) $("search-echo").value = q;
    if ($("search-term")) $("search-term").textContent = q ? '“' + q + '”' : "your query";
    if (BUGS) {
      // Defect #11 (XSS): query text reflected into the DOM without encoding.
      results.innerHTML = "No results for " + q;
    } else {
      results.textContent = "No results for " + q;
    }
  }

  // ── Redirect helper (?to=) ──────────────────────────────────────────────────
  var redirectHost = $("redirect-status");
  if (redirectHost) {
    var to = new URLSearchParams(location.search).get("to") || "";
    if (!to) { redirectHost.textContent = "No destination provided."; }
    else if (BUGS) {
      // Defect #12 (open redirect): follows any user-supplied URL with no allowlist.
      redirectHost.textContent = "Redirecting to " + to + " …"; location.href = to;
    } else if (to.charAt(0) === "/" && to.charAt(1) !== "/") { location.href = to; }
    else { redirectHost.textContent = "Blocked: only same-site redirects are allowed."; }
  }
})();
