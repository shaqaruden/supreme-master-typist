# Supreme Master Typist: practice and progress

## Intent and agreed scope
Make completed tests actionable: show weak letters, let the user practise them, and track improvement. The user approved all eight ideas: mistake summaries, targeted drills, speed over time, local progress, keyboard heatmap, personal bests, compact results, and distinctive branding with skill-based ranks. They selected tabbed analysis and a separate Progress view. Ranks measure speed and accuracy, not accumulated practice.

## Approach
Selected: keep the existing static JavaScript site, add focused analytics/storage/UI modules, and integrate them with input, test completion and prompt generation. Store data in this browser, without an account or server. A single long results page was considered and rejected in favour of compact tabs. Rebuilding in a framework or adding a backend offers no benefit for this scope.

## Layout and identity
Retain layout/keyboard controls and existing learning levels. Introduce a typography-led Supreme Master Typist wordmark, a small SMT/crown-style mark and restrained accent styling consistent with current light/dark theme tokens. Refresh app icons and share imagery to match. Preserve upstream credit and license.

Finished results lead with WPM, accuracy, completed words, elapsed time, personal best and rank. Keep Try again (existing Reset action) and Practice my mistakes in the visible header. Analysis tabs are Timeline, Mistakes and Heatmap. Content fits its natural height; scrolling is confined to analysis when screen height is limited. Avoid blank filler, hidden stats and inaccessible controls. On narrow screens use wrapping summary/action rows and scrollable tabs; keep keyboard/touch focus states.

Progress is a separate dialog/view opened from a persistent Progress button and from results. Opening it during an active test requires finishing/resetting that test first: disable Progress while a test is running and explain why. Escape and Close return focus to the opener. Progress never resets a completed test.

## One measurement source
Extend the current-test recorder to count actual inserted characters, correct attempts, per-expected-letter attempts/errors, confusions, and timestamped speed samples. Ignore modifiers, backspaces, clearing fields and MutationObserver redraws. Keep every genuine mistake after correction. Desktop and mobile paths record the displayed character after mapping. Normalize spaces and handle insertion/replacement without recounting unchanged suffixes.

Use elapsed monotonic time from first character to completion, not the display clock. WPM = correctly entered characters / 5 / elapsed minutes; accuracy = correct character attempts / all character attempts × 100. A correctly retyped character counts as a correct attempt; deletion does not. Empty results are zero, and all displayed/persisted metrics are finite. Use these same figures in results, speed chart, records and ranks. The timeline keeps completed-word markers and red error crosses, including the final automatically completed word exactly once and errors in timed unfinished words.

Speed chart: trailing five-second correct-character WPM, using available elapsed time at the beginning, with zero-speed idle periods. Include the end of the test; cap rendering at 600 sampled points. Show above the event lanes, with a labelled WPM scale and time axis. Provide accessible numeric summaries.

## Mistakes, heatmap and drills
Mistakes tab: list expected letters by error count, attempts and error rate; list frequent expected/typed pairs with counts. Explain Space and end-of-word errors. No mistakes gets a useful success/empty state and disables the drill button.

Heatmap: show expected-letter error rate and counts on the currently selected keyboard/layout; legends and text details supplement colour. No attempts is visually distinct from perfect accuracy. Respect remapping and custom layouts. A companion list exposes all characters, including symbols absent from the drawn keyboard.

Practice my mistakes starts a 20-word targeted drill using the current test's most troublesome expected letters. Select matching words from the current level's allowed dictionary, respecting case and punctuation preferences; repeat suitable words if necessary. If no dictionary words match, use short letter combinations from the allowed set and explain the fallback. Early/extra-space errors target the associated failed words instead. Full-sentence tests drill individual words from the failed sentence, rather than inventing sentences. The drill is clearly labelled and can be exited with Back to regular practice. Do not overwrite the user's stored time/word limits. Try again within a drill repeats a new targeted set; changing layout, level or incompatible preferences exits the drill. Drills appear in progress but have a separate record category and cannot award ranks.

## Local history, comparisons and ranks
Persist at most 500 completed sessions in versioned localStorage. Each summary contains date, duration, words, attempts, correct attempts, WPM, accuracy, mistakes, layout, keyboard, level, mode, configured limit, relevant preferences, remapping state and drill status. Include a stable custom-layout/level fingerprint in comparison keys. Do not persist raw typed text, full keystroke logs or event arrays. Corrupt/unsupported data or blocked/full storage must never break typing; show a nonblocking explanation when saving is unavailable. Abandoned/reset tests are not saved, and finishing twice cannot duplicate a record.

Personal bests compare identical layout, keyboard, level, mode, limit and relevant preferences; include the custom fingerprint and separate drills. Show previous best, new best and first-result states. Accuracy best is separate from speed best. Progress defaults to the current comparison group, with layout/group controls, WPM and accuracy trends, date-labelled recent results and explicit empty states. Keep the two trend scales labelled. Provide a clearly labelled Clear history action with confirmation; do not remove keyboard/theme preferences.

Suggested rank rules (implementation proposal, not an additional user decision): standard tests lasting at least 30 seconds and completing at least 10 words qualify. For each layout/fingerprint retain the highest earned tier among saved eligible tests; explain the qualification rule and next target. Tiers require both thresholds: Apprentice (any eligible test), Typist (30 WPM/90%), Adept (50/93%), Expert (70/95%), Master (90/97%), Supreme Master (120/98%). Ineligible sessions still show stats, progress and personal bests but do not award a rank. New users are Unranked. Changing level cannot incorrectly compare personal bests; rank can recognise skill across levels within the same layout.

## Boundaries and builder decisions
No accounts, cloud sync, leaderboards, subscriptions, backend, new layouts or custom-domain/repository rename. The repository has been renamed to shaqaruden/supreme-master-typist; update canonical, share, source and README links to that repository and https://shaqaruden.github.io/supreme-master-typist/. No publish/merge to main; prepare the feature branch for review as before. The builder chooses exact module boundaries, tab mechanics, visual spacing, chart primitives and test tooling. Use existing vanilla JS and deployable minified assets; avoid a new runtime framework.

## Acceptance and verification
Test analytics with deterministic time; corrections, substitutions, mobile input, remapping, end conditions, empty tests, finite metrics, storage corruption/failure, record grouping, rank boundaries, drill selection/fallback and session deduplication. Browser-test all tabs, Progress focus/close, saved reload, disabled mid-test access, targeted drills/exit, history clearing, both themes, desktop/mobile/short landscape and dense analysis. Verify stats/actions stay visible, charts remain compact, markers remain individually selectable and existing typing modes still work.
