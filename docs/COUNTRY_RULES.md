# Country rule packs

Country rule packs are product configuration boundaries, not legal opinions.

Production-active code paths:
- EE -> rules/EE.json
- FI -> rules/FI.json
- PL -> rules/PL.json

Africa preparation:
- ZA -> disabled
- KE -> disabled

A country may be enabled only after these are reviewed for that jurisdiction:
1. identity and company identifiers,
2. mandatory application fields,
3. consent/privacy wording and retention,
4. KYC/AML requirements,
5. creditworthiness and affordability logic,
6. required evidence/documents,
7. adverse-action / explanation requirements where applicable,
8. local currency and numerical conventions,
9. permitted storage region and processors,
10. human-review requirements.

Rule versions are written into the case record so an old decision can be traced to the exact rule pack that was active.
