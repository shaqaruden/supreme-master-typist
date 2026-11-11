# RPG Keyboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the approved stone keyboard appearance and learning feedback in Game Mode.
**Architecture:** Extend the existing GameMode visual layer. Observe keyboard rebuilding and prompt/input changes, derive hints from the current answer and mapping, and decorate only the displayed keyboard.
**Tech Stack:** Vanilla JavaScript, CSS, vendored RPGUI, Playwright.
**Spec:** docs/superpowers/specs/2026-11-11-rpg-keyboard-design.md

## Global Constraints

Game Mode only. Preserve keyboard geometry, layouts, labels, finger guidance, input behavior and measurements. Use local assets. Respect reduced motion.

## Review Focus

Keyboard rebuilding must retain skins; ISO Enter must retain its shape; corrections must point to Backspace; remapping must reflect the selected layout; mobile and reduced motion must remain usable.

### Task 1: Keyboard appearance and feedback

**Files:** scripts/game-mode.js and .min.js; styles/game-mode.css; tests/game-keyboard-browser.cjs.
**Interfaces:** Consume existing correctAnswer, fakeInput, keyboardMap, settingsStorage and keyboard templates. Produce visual-only classes on keyboard keys; no input or score mutation.

- [x] Write browser checks for next-key progression, red mistake feedback, correction hints, remapped keys, keyboard rebuilding, responsive geometry, reduced motion and normal-mode restoration.
- [x] Run `node tests/game-keyboard-browser.cjs`; expect failure for missing gold case/next-key behavior.
- [x] Add case/key styles and lifecycle observers plus input-scoped feedback. Regenerate the minified script.
- [x] Run the keyboard browser test, existing Game Mode/header tests, training regressions and all unit tests; expect PASS.
- [x] Review changes, document validation, commit and publish to the authorized feature branch.

## Execution record

User approved the design and requested execution. Continue inline in the existing feature checkout. Plan and design reviewed together; no shared task interfaces. Prior independent reviewer hit the session usage limit; self-review will supplement browser verification if that remains unavailable.


## Verification and review

The initial browser check failed on the missing gold case, then passed after implementation. Additional checks reproduced premature Space feedback failure before the correction pass. Final keyboard browser checks pass for hint progression, correction and word-advance hints across all four shapes, letter/Space/ISO Enter/mobile error feedback, remapped input, learning colors, responsive sizing, reduced motion and normal-mode restoration. All 29 unit tests, Game Mode, header controls, training browser and training regression checks passed.

A fresh reviewer identified guidance color specificity, unassigned ortholinear special keys/ISO Enter aliases, and incomplete special/mobile mistake feedback. These were addressed and covered in browser checks. Ortholinear special keys have no assigned positions in the existing templates; a small Next/Correct caption provides guidance without inventing positions. The case uses a dark stone interior inside its gold frame. No typing or measurement code changed.
