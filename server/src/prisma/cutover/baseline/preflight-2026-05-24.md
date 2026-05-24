# Production preflight baseline — captured 2026-05-24
# Branch: production (br-muddy-dream-ad3r49m9)
# PITR reference: note timestamp before cutover in README

## A. Row counts
| tbl | cnt |
|---|---:|
| User | 5 |
| users_workers | 2 |
| employee_forms | 2 |
| form_fields | 28 |
| form_inputs | 28 |
| HistoryFormData | 20 |

## B. Referential integrity (all zero)
| check_name | cnt |
|---|---:|
| orphan_inputs | 0 |
| orphan_field_refs | 0 |
| orphan_history | 0 |
| orphan_actors | 0 |
| orphan_forms | 0 |

## C. Template split
Onboarding: 15 fields (IDs 93-106, 109)
Offboarding: 13 fields (all others)

## D. Engagement snapshot (expected post-migration)
| Worker | Engagement | tasks | done | in_progress | open | status |
|---|---|---:|---:|---:|---:|---|
| Bekir Yatci | Onboarding | 15 | 2 | 3 | 10 | in_progress |
| Florim Fejzulli | Offboarding | 13 | 12 | 0 | 1 | in_progress |

## E. Confirmed settings
- org slug: bsb-gruppe
- admin / responsible: Timo Janik (cmmoxksr7000i2vnsd3enikpz)

## F. Backup branch
- prod-backup-2026-05-24: br-long-pine-adzmuoak

## G. Rehearsal branch
- migration-rehearsal: br-rapid-bonus-adox0tpv
