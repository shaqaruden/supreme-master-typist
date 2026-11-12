# Dvorak Movement Implementation Plan

Goal: deliver the approved Dvorak level 2–6 return-reach drill.
Spec: ../specs/2026-11-12-dvorak-movement-design.md

- [x] Add a pure movement generator deriving new and familiar letters from existing level definitions and hands from physical key codes; test every level, hand, return and exclusion.
- [x] Add an optional movement action and hand selector; integrate with existing drill start/reset/exit and restore normal settings.
- [x] Identify movement drill summaries separately and retain rank exclusion.
- [x] Verify end-to-end completion, settings restoration, level/layout changes, both display modes and responsive fit; run existing regressions and unit tests.
- [x] Commit and publish to the authorized feature branch.

Use inline execution in the current isolated feature checkout. No changes to ordinary word generation or input measurement. Main risks: level 5's single-hand additions, state restoration after timed/sentence settings, accidental rank eligibility and mixing movement results into regular comparisons.


Verification: all 32 unit tests passed, including every eligible level/hand combination, exclusions, comparison isolation and rank exclusion. End-to-end movement completion/history/settings restore and Game Mode/mobile checks passed. Existing training, training regression, RPG keyboard and dropdown browser checks passed. Independent review found no important bugs; its suggestion to distinguish hand selections in comparisons was implemented and tested. Familiar anchors shuffle on each run while new-key blocks remain grouped.
