# Test Event Timeline Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Retain current-test words and mistakes and show an interactive timeline after completion.
**Architecture:** An isolated recorder and SVG renderer, called from existing input and lifecycle functions. Static assets keep the existing minified deployment convention.
**Tech Stack:** Vanilla JS, CSS, SVG, Node test runner, Playwright.
**Spec:** docs/superpowers/specs/2026-11-10-test-event-timeline-design.md

## Global Constraints
Current test only; red error × markers; preserve errors after correction; reset clears events; no runtime dependencies.

## Review Focus
- Final auto-completed word is recorded exactly once.
- Backspace and observer updates never create error events.
- Mapping and mobile input record displayed characters.
- Timed endings retain errors in unfinished words.
- Dense events and narrow screens remain selectable with keyboard and touch.

### Task 1: Recorder and integration
Files: scripts/test-timeline.js, scripts/new-key.js, scripts/app.js, tests/test-timeline.test.cjs.
Interface: testTimeline.reset(), input(before, after, word), complete(word), finish(); recorder accepts injectable monotonic clock for tests.
- [x] Write Node tests for timestamps, replacement/deletion, preserved errors, completion, finish freeze and reset; run and observe missing-feature failure.
- [x] Implement recorder and connect input boundaries, word completion, reset and endGame.
- [x] Run node --test tests/*.test.cjs; expect all passing.

### Task 2: Timeline display and deployed assets
Files: scripts/test-timeline.js, styles/test-timeline.css, index.html and changed minified JS assets.
- [x] Write browser checks for red error marker, word markers, details via selection/focus, final word, reset, timed partial words, mobile and mapping.
- [x] Implement accessible two-lane timeline with seconds axis, focusable buttons and selected-event detail; scope CSS to timeline.
- [x] Regenerate changed JS minified assets; run Node suite and browser tests against index.html and inspect narrow and desktop screenshots.

## Verification
Four recorder tests passed. Chromium browser checks passed against the deployed minified scripts. Independent review found overlapping dense markers; a failing browser assertion reproduced it, and distinct tracks fixed it. All checks passed afterward.
