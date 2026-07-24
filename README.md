# Stewardlane

Stewardlane is a compliance-first household CRM and AI drafting workflow for independent wealth advisory firms. It keeps AI output in a mandatory review state, preserves original and reviewed text, blocks common recommendation-like phrasing, and can anchor approved content hashes to Solana devnet.

## Core workflow

- Create a household from real entered members, holdings, policy notes, activity, and meeting context.
- Generate meeting preparation through a real Groq model call; no canned fallback commentary is shipped.
- Review and edit the draft as an Advisor. Associates cannot view full holdings, and Compliance users receive an audit-oriented view.
- Approve or discard with an append-only local audit event containing actor, time, action, and SHA-256 content hash.
- Optionally publish the approved hash through the Solana Memo program on devnet.

## Run

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `/` for the public site and `/app` for the MVP workspace.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Scope boundary

This build is an MVP demonstration, not a production RIA recordkeeping system. Browser persistence is used for the local vertical slice; production deployment requires a tenant-aware database, standard identity provider, encrypted storage, immutable database controls, custodian-approved ingestion, legal review, and independent security testing. It does not generate investment recommendations, execute trades, sync custodians, or calculate benchmark performance.
