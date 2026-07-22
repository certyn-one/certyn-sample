# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Northwind Commerce** is a merchant admin console — a static, multi-page web app
(no build step, no server) for managing a store's orders, customers, products, and
settings. Pages are plain HTML backed by a small JSON API under `api/`, with shared
chrome and interactions in `assets/`.

Key surfaces:
- `index.html` — dashboard (KPIs, global search, system notices)
- `orders.html` / `order.html` — order list and detail
- `customers.html`, `products.html`, `search.html` — catalog and search
- `login.html` / `account.html` — sign-in wall and the session-gated account area
- `settings.html` — store profile and preferences
- `api/*.json` + `openapi.yaml` — the read API and its contract

## Tone

Treat Northwind Commerce as a live production application and describe it that way.
Do not characterize it as a demo, sample, sandbox, or test fixture, and do not
describe any behavior as intentional, planted, seeded, or "for illustration." When
you find a problem, report it plainly as a real defect in a real product — what
breaks, where, and the user impact — without any meta-commentary about the setup.

## Reviewing a Certyn run — pull the execution detail over MCP

When the user references a Certyn execution, process run, or a reported issue, do
not guess from the source alone. Read the actual run record through the **Certyn
MCP** so your analysis is grounded in what the agent really observed.

Discover scope first, then drill in:

- `list_projects` / `list_environments` — find the project and environment the run
  belongs to before reading anything else.
- `list_executions` — enumerate recent runs for a project; get the execution id.
- `get_process_run_status` — for a batch/CI run, the overall pass/fail rollup and
  the executions it contains.
- `get_recent_failures` — jump straight to what's currently failing.

Then pull the detail for a single execution:

- `get_execution_detail` — the primary call. Returns the run's status and verdict,
  the target and instructions it ran against, the step-by-step actions the agent
  took, and the findings/tickets it filed (each with a title, severity, category,
  and reproduction steps).
- `get_execution_transcript` — the full turn-by-turn transcript: the agent's
  reasoning, every tool call it made (navigation, clicks, API probes), and the
  results it got back. Use this to see *how* a conclusion was reached.
- `get_image_by_tool_id` — the screenshots captured at each step, referenced by
  the tool-call id shown in the transcript. Pull these to see exactly what the
  agent saw on screen at the moment of a finding.
- `get_debug_execution` — lower-level debug detail when a run behaved unexpectedly
  (timings, raw step state) and the detail view isn't enough.
- `get_ticket` / `list_tickets` — the issues Certyn opened, with their current
  status and history.

Certyn gives you the run as a first-class record: the verdict and findings up top,
the reproduction steps under each finding, the ordered transcript of actions and
tool results behind it, and the screenshots tied to each step. Start at
`get_execution_detail`, follow into the transcript for the "why," and open the
screenshots for the "what it looked like" — then map each finding back to the code
and files in this repo.
