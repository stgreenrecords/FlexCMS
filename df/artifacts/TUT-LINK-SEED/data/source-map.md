# TUT-LINK-SEED source map and data boundary

## Source-backed inputs

| Input | Use |
|---|---|
| `df/artifacts/TUT-LINK-INTEGRITY/solution-design.md` | Route, scheme, fragment, validation-order, and task-boundary rules. |
| `flexcms/flexcms-app/src/main/resources/db/migration/V18__correct_tut_usa_link_contracts.sql` | Canonical navigation/footer/featured-content link object shapes. |
| Existing `scripts/seed_tut_usa_website.py` `PAGES`, model/topic/article inventories | Authoritative seeded page paths and deterministic content topology. |
| FlexCMS Author API | Live persistence/status evidence for all generated nodes. |
| `Design/tut-usa/` captured/imported assets | Existing TUT fallback asset path used by generated components. |

## Synthetic data

All TUT model names/specifications, editorial copy, contacts, addresses, offers, legal copy, social URLs, and newly added search/legal page content are deterministic demo data for the local sample site. They are not sourced from a real manufacturer, customer, employee, contract, or legal policy and must not be treated as production claims.

## Private-data boundary

No personal, customer, credential, token, or other private data was introduced. Contact identities, addresses, phone numbers, email addresses, and social destinations are synthetic demonstration values. Evidence records only local service URLs, aggregate counts, deterministic content paths, and non-secret test/build output.

## Generated-to-live mapping

- `PAGES` entry `tut-usa/...` → Author page `content.tut-usa....`.
- Nested component `name` → deterministic dot-appended child path under its page/component parent.
- Navigation properties → `content.experience-fragments.tut-usa.global.navigation.master.navigation`.
- Footer properties → `content.experience-fragments.tut-usa.global.footer.master.footer`.
- Internal URL `/tut-usa/...` → exact `PAGES` route authority after query/fragment normalization.
- External URL → syntax/security validation only; third-party hosts are not followed.

