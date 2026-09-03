# Final System Validation & Stabilization

Feature development through VS030 is frozen.

Team:
- Aldrich — Lead Developer / Architecture / Integration
- Seb — UI/UX & Accessibility QA
- Arron — Functional & Business Rules QA
- Shane — Reliability, Security & Adversarial QA
- Mica — Project Manager, Manuscript & Traceability QA

Each QA lane covers the entire system.

Workflow:
Discovery → ChatGPT Project → GitHub Finding → Lead triage → Confirmed Issue → Codex-managed branch/implementation → PR → CI/Preview → Lead review → Merge.

Rules:
- Findings are not permission to fix.
- Contributors may notice cross-scope issues but must route them rather than silently solve them.
- Ordinary questions stay in the contributor's own ChatGPT Project first.
- Unresolved contradictions, reproducible defects, and team-visible problems go to GitHub Issues.
- Architecture/domain/schema/production decisions go to the Lead.
- Production is evidence, not a casual sandbox.
- Initially, one active implementation Issue per contributor.

ChatGPT Skills are optional assistive workflows within each contributor Project. They never override lane ownership, canonical repository/context, GitHub Finding/Issue workflow, security restrictions, or Lead authority. See `CHATGPT-PROJECT-SETUP.md` and each file under `project-instructions/` for the approved shared Skill set and lane-specific usage.

