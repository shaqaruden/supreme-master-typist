# Practice and Progress Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent modules, with integration and browser validation in this session.

**Goal:** Deliver all eight approved practice, analytics and identity improvements.
**Architecture:** Keep the static app. The recorder produces one immutable finished result; pure training functions select drills, comparisons and ranks; a storage adapter persists summaries; the UI composes tabs and Progress without duplicating measurements.
**Tech Stack:** Vanilla JS/CSS/SVG, native dialog, Node test runner, Playwright, minified deployment assets.
**Spec:** docs/superpowers/specs/2026-11-11-training-upgrade-design.md

## Global Constraints
Use approved formulas and thresholds. 500 local session summaries maximum, no raw text or event logs persisted. Keep stats/actions visible, content compact, and errors red. Drills are 20 words, preserve saved normal settings and never award ranks. No backend or runtime framework. Work stays on the feature branch.

## Review Focus
1. Desktop/mobile editing and remapping count only new input; final word exactly once.
2. Storage failure/corruption and duplicate finish cannot break typing or records.
3. Custom layout identity, test limits and drill category prevent invalid comparisons.
4. Drill resets and preference changes restore normal mode without saving temporary limits.
5. Both themes and short/narrow viewports keep header actions and analysis reachable.

### Task 1: Measurement recorder and speed chart
Files: scripts/test-timeline.js, tests/test-timeline.test.cjs.
Produces: createTestTimeline(now).reset/input/complete/finish existing API. finish returns existing events,duration plus id,attempts,correctAttempts,wpm,accuracy,words,letters [{character,attempts,errors}],confusions [{expected,typed,count}],speed [{time,wpm}]. Correct attempts count matching newly inserted characters. Repeated finish returns same id, freezes and never duplicates. Speed samples capped at600 and include end/idle periods.
- [x] Add deterministic tests for attempts/replacements/deletion, finite zero results, exact metric formulas, speed window/end and idempotence; run to failure.
- [x] Extend recorder and render speed line above existing event lanes, preserving event buttons/classes and old API.
- [x] Run node --test tests/*.test.cjs, confirm all pass.

### Task 2: Training rules and local store
Files: scripts/training-core.js, tests/training-core.test.cjs.
Produces global TrainingCore: comparisonKey(settings), layoutKey(settings), rankFor(session), earnedRank(sessions,settings), personalBests(sessions,session), selectDrill({events,dictionary,allowed,onlyLower,punctuation,fullSentence}) -> {words,reason}, createStore(storage) -> {load,save,clear,status}. session has settings object and recorder fields; summary excludes all raw event/text content. store key smt.history.v1; version1 envelope; trim500; dedupeid; blocked/corrupt gracefully. Rank object {name,index,wpm,accuracy,next}; ranked>=30s,>=10words,notdrill. selectDrill always20 words when suitable allowed characters exist; use failed words for sentence/space errors.
- [x] Write failing tests for group identity, thresholds, drills/fallback, corruption/quota, summaries/dedup/limit and clearing only history.
- [x] Implement pure module and storage adapter with no DOM and no runtime dependency.
- [x] Run Node suite and confirm all pass.

### Task 3: Results and practice integration
Files: scripts/training-ui.js, scripts/app.js, scripts/new-key.js, styles/training.css, index.html, tests/training-browser.cjs.
Consumes Task1 result and Task2 TrainingCore. Integration globals: trainingSettings(), trainingReset(), trainingComplete(result), trainingStarted(), trainingLine(maxWords) -> string|null. Reset calls trainingReset before prompt generation; input calls trainingStarted after first actual insertion; endGame calls recorder.finish once and trainingComplete after base results are visible; generateLine first asks trainingLine. Normal settings stay authoritative; drill mode overrides effective scoreMax/timeLimitMode in memory, restoring before preferences/layout/level changes.
- [x] Write failing browser journeys: perfect/error results tabs, drill start/retry/exit, Progress reload/groups/clear/focus and active-test blocking.
- [x] Implement wrapping results header, tabs, mistakes, current-layout heatmap, chart summaries, progress dialog with filtered trends/recent list, record/rank badges and storage notices.
- [x] Replace legacy result calculations with recorder metrics. Correct timer/last-word finalization ordering only as needed for coherent results.
- [x] Run all Node/browser suites, including existing dense/mobile layout tests; add regressions for any failures.

### Task 4: Identity, deployment and final review
Files: styles/brand.css, app icon/share assets, index.html, README.md, regenerated minified JS.
- [x] Introduce restrained SMT/crown identity and matching app/social icons; update renamed repository/public URLs.
- [x] Regenerate deployable minified scripts. Verify desktop/mobile/light/dark/landscape, screenshots, chart compactness and all keyboard controls.
- [x] Independent whole-change review; fix important findings with failing regression tests then green suite.
- [x] Commit and update existing feature branch with expected-head check; no main merge or hosting settings change.

## Completion evidence
- Recorder and core reviews passed; 28 deterministic Node tests cover measurement/storage/drill/rank rules.
- End-to-end suites cover tabs, full-test completion, settings-preserving drills, saved reload/clear, dialog focus, blocking mid-test access, timed deadlines, unavailable storage, themes, dense markers and compact/short/mobile layouts.
- Independent integration review identified four Important issues: historical custom rank identity, time-limit reset, remapping reset and timed-drill word counter. Each was reproduced by a failing browser assertion and fixed, then verified with the green suite.
- Additional layout-switch regression ensures drills exit even when existing change functions are called directly.
- Visual inspection covered desktop/phone/landscape, both themes, analysis tabs and Progress.
- Superdesign authentication was unavailable; the approved typography/crown identity was hand-authored as SVG/CSS and rendered to raster assets without a framework or runtime dependency.
