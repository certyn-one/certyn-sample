# Certyn project Wiki — Northwind Commerce

This is the project context Certyn's agent reads on every run. Paste it into the project Wiki
(`update_wiki`) or your Rules field. The **CI commit conventions** section is what powers the
automatic retest-on-fix loop; the rest is normal project context.

## CI commit conventions

CI runs are triggered from GitHub Actions on each deploy, and the triggering **commit message is
included in the run instruction**. Apply these conventions to that message:

### Retest-on-fix

When the commit message contains a **`fix(<issue>)`** marker, retest that specific issue:

- Look up the ticket for `<issue>` and re-run its recorded reproduction steps against the
  environment's Base URL.
- If the problem no longer reproduces, **mark the ticket resolved** and note the fixing commit SHA.
- If it still reproduces, **keep the ticket open** and add what you observed — the exact step that
  failed, status codes, console errors, page state.
- The scope must look like an issue id. Recognized forms: `NW-482`, `ZD-1234`, `T-99`, `#482`, `482`.
  Ordinary scoped commits like `fix(customers):` or `fix(styles):` are **not** retest markers — ignore them.
- Multiple markers in one message (`fix(NW-482) fix(T-99)`) → retest each one.

A retest is **targeted**: do not run broader exploration or author new test cases unless the
instruction separately asks for it.

### Everything else

If there is no `fix(<issue>)` marker, follow the rest of the run instruction as written (e.g. bump the
version and confirm the app loads). Do not retest tickets that the commit does not reference.

## Product context

Northwind Commerce is a merchant-admin web app: Dashboard, Orders, Customers, Products, Settings, and
an Account area behind a login wall. Sign-in uses the seeded `LOGIN_USERNAME` / `LOGIN_PASSWORD`
environment variables. The Customers, Orders, and Products pages load their rows from `api/*.json`.
