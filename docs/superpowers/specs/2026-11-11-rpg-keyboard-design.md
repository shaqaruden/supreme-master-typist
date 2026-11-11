# RPGUI keyboard design

Give the Game Mode keyboard a medieval appearance that matches the existing RPGUI controls, while keeping letters and learning feedback clear.

## Approaches

- Grey stone keys inside a gold frame: quieter styling that keeps the next-key highlight prominent. Recommended approach; interpreted from the user's approval of the recommendation.
- Wooden button sprites for every key: more raised and decorative, but visually busier across a full keyboard.

## Proposed design

Use RPGUI's `framed-golden-2` for the keyboard case and `framed-grey` for individual keys. Highlight the next required key in gold. Give pressed keys a brief downward movement and mistakes a brief red accent. Keep existing keyboard geometry, labels, finger guidance and typing behavior. Ensure the next-key and mistake states remain distinguishable from ordinary keys.

Apply this appearance only in Game Mode. Preserve all supported layouts and keyboard shapes, responsive sizing, and normal-mode styling. Respect reduced-motion preferences. Use locally vendored RPGUI assets, with custom state styling where the kit has no matching state.

## Validation

Check the supported keyboard shapes and representative layouts, key feedback, Game Mode toggling, narrow screens, and reduced motion. Confirm typing measurements and input handling remain unaffected.

## Status

Approved by the user ("go ahead"). Implementation details such as exact spacing and animation duration remain with the implementer.

Implementation detail: a small keyboard caption also identifies the next action. Ortholinear templates leave special keys unassigned, so Space/Backspace guidance appears in this caption rather than assigning an arbitrary key position.
