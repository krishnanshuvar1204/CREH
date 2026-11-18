# Manual test checklists

Testing in CREH is manual (SPEC section 7a). One file per phase: `phase-N.md`.

**Rules**
- The dev who builds a task runs its checklist before ticking the task in `SPEC.md`.
- A second dev (or the owner) re-runs the whole phase checklist at the end of the phase.
- Record date, tester and result in the SPEC changelog.
- Test accounts after `npm run seed`: `admin@creh.com` / `admin`, `test@creh.com` / `test`. Register a third user for two-party and stranger checks.

**Item template**
```
### X-01 Short title
Steps: ...
Expected: ...
Result: [ ] Pass  [ ] Fail   Tester/date: ...
```
