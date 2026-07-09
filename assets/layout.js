// Northwind Commerce — shared chrome (sidebar + topbar), injected into every page.
// Reads data-page / data-title on <body>. The topbar global search is intentionally
// missing an accessible name (defect #1).
(function () {
  var page = document.body.dataset.page || "";
  var title = document.body.dataset.title || "";

  var I = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    orders: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    customers: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    products: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    account: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.2 18.5a6 6 0 0 1 11.6 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + I[name] + "</svg>";
  }
  window.NW = window.NW || {};
  window.NW.svg = svg;
  window.NW.initials = function (name) {
    return (name || "?").split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase();
  };
  window.NW.avatarColor = function (name) {
    var h = 0; name = name || "";
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return "hsl(" + h + " 52% 48%)";
  };

  function navItem(id, label, href, count) {
    var active = page === id ? " active" : "";
    var c = count != null ? '<span class="count">' + count + "</span>" : "";
    return '<a href="' + href + '" class="' + active.trim() + '">' + svg(id) + "<span>" + label + "</span>" + c + "</a>";
  }

  var session = (window.DEMO && window.DEMO.getSession && window.DEMO.getSession()) || null;
  var who = session || { name: "Guest", email: "Not signed in" };

  var sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.innerHTML =
      '<div class="workspace">' +
        '<img class="mark" src="assets/logo.svg" alt="" />' +
        '<div class="meta"><div class="name">Northwind <span class="plan">Pro</span></div></div>' +
      "</div>" +
      '<div class="nav-group"><div class="heading">General</div><div class="nav">' +
        navItem("dashboard", "Dashboard", "index.html") +
        navItem("orders", "Orders", "orders.html", 8) +
        navItem("customers", "Customers", "customers.html") +
        navItem("products", "Products", "products.html") +
      "</div></div>" +
      '<div class="nav-group"><div class="heading">Workspace</div><div class="nav">' +
        navItem("settings", "Settings", "settings.html") +
        navItem("account", "Account", "account.html") +
      "</div></div>" +
      '<div class="grow"></div>' +
      '<div class="usercard">' +
        '<div class="avatar sm" style="background:' + window.NW.avatarColor(who.name) + '">' + window.NW.initials(who.name) + "</div>" +
        '<div class="who"><div class="n">' + who.name + '</div><div class="e">' + who.email + "</div></div>" +
      "</div>";
  }

  var topbar = document.getElementById("topbar");
  if (topbar) {
    // Defect #1 (accessibility): the global search input has no <label>, no aria-label,
    // and no placeholder — assistive tech announces an unnamed textbox.
    topbar.innerHTML =
      '<div class="crumb">' + title + "</div>" +
      '<form id="dash-search-form" class="search" role="search">' +
        svg("search") + '<input type="search" id="dash-search" />' +
      "</form>" +
      '<div class="spacer"></div>' +
      '<div class="iconbtn" role="img" aria-label="Notifications">' + svg("bell") + '<span class="dot"></span></div>' +
      (session
        ? '<div class="avatar sm" title="' + who.email + '" style="background:' + window.NW.avatarColor(who.name) + '">' + window.NW.initials(who.name) + "</div>" +
          '<button class="btn ghost" data-signout style="padding:6px 12px">Sign out</button>'
        : '<a class="btn ghost" href="login.html" style="padding:6px 14px">Sign in</a>');
  }
})();
