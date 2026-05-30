# Data Sources

## Clinical Knowledge Nodes (50 nodes)

All 50 knowledge nodes used in this assessment were provided directly in the
Setup Guide supplied by BRAHMO as part of Assessment 01. No external clinical
data was independently sourced or fabricated.

The seed data covers the following domains:

| Domain | Nodes | Source |
|--------|:-----:|--------|
| Global drug safety constraints | 10 | Provided in Setup Guide (Zone 2 seed data) |
| Orthopaedics protocols | 15 | Provided in Setup Guide |
| General Medicine protocols | 8 | Provided in Setup Guide |
| Cardiology protocols | 5 | Provided in Setup Guide |
| Paediatrics protocols | 3 | Provided in Setup Guide |
| Hospital admin nodes | 4 | Provided in Setup Guide |
| High-derivability generic nodes | 5 | Provided in Setup Guide |

## Clinical Accuracy Notes

The drug safety rules in the seed data (e.g. Warfarin-NSAID interaction,
Penicillin cross-reactivity, DVT prophylaxis with Enoxaparin) are consistent
with standard clinical guidelines. However, for the purposes of this assessment
they are treated as organizational knowledge nodes — not independently verified
against external clinical databases.

In a production BRAHMO deployment, clinical nodes would be sourced and validated
from:
- Hospital formulary and pharmacy systems
- Departmental clinical protocols (HOD-approved)
- National guidelines (NABH, WHO, ICMR)
- Incident and audit reports

## User Profiles (7 users)

All user profiles (Nurse Priya, Dr. Vikram, Admin Suresh, etc.) were provided
in the Setup Guide. No real patient or staff data was used.

## DAG Hierarchy (15 levels)

The 15-level hierarchy structure (Hospital → Division → Department → Ward →
Patient) was provided in the Setup Guide seed SQL.