# Shared ChatGPT Account — Project Setup

Create four separate ChatGPT Projects and enable project-only memory:

1. [A] Briah — UI-UX QA — Seb
2. [B] Briah — Functional & Business QA — Arron
3. [C] Briah — Reliability & Adversarial QA — Shane
4. [D] Briah — Manuscript & Traceability — Mica

Use each matching file under:
engineering/validation/project-instructions/

Shared-account hygiene:
- never work inside another member's Project;
- never save passwords/API keys/session tokens/private customer data in Project memory;
- use one onboarding chat, then separate chats per validation round or meaningful investigation;
- use a fresh focused chat for each confirmed implementation Issue;
- GitHub is shared team memory;
- repository context overrides ChatGPT memory.

## Shared ChatGPT Skills

Install these Skills on the shared contributor ChatGPT account before Round 001:
- frontend-design
- domain-modeling
- grilling
- grill-with-docs
- find-skills
- skill-creator

Skills may be invoked automatically by ChatGPT when relevant or explicitly by a contributor. They are assistive only: Project Instructions, lane ownership, GitHub governance, security restrictions, repository authority, and Lead Developer decisions always take precedence. A Skill must never be used to cross a Project scope guardrail.

`skill-creator` is administrative/meta tooling and is not part of normal contributor QA. New or modified Skills require Lead approval before they become part of the team workflow. `find-skills` may discover candidates, but discovery is not approval to install or use them.

After creating each Project, paste the matching Project Instructions file and run a cross-scope guardrail test before beginning Round 001.

