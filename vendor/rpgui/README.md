# RPGUI components

Source: https://github.com/RonenNess/RPGUI
Pinned upstream revision: `048859e6e1a73bd8f5615555609db098beba4e9c`
License: zlib (see LICENSE.txt).

This local component build concatenates the upstream container/frame and button styles and includes their referenced graphics. The original component declarations and sprites are unchanged. Scope/layout/accessibility overrides are maintained separately in `styles/game-mode.css`; our toggle adds and removes RPGUI classes. We do not load RPGUI's global content reset or JavaScript widget enhancement, keeping native controls, selection, focus and typing behaviour.

Upstream credits: RPGUI by Ronen Ness. Default-theme graphics are public-domain artwork by Buch / Michele Bucelli, as credited by RPGUI.

The unchanged `img/cursor/{default,point,select}.png` graphics are also vendored from the same pinned revision. Game Mode scopes their use in `styles/game-mode.css`, retaining upstream's `10 0` hotspot for pointing and text selection and restoring system cursors when disabled.

The upstream `_dropdown.scss` CSS and its two `select-*.png` sprites are included unchanged. `scripts/game-dropdowns.js` adapts the kit's header/list structure with keyboard navigation, focus management, outside dismissal and viewport positioning. Native selects remain the source of values and the normal-mode controls.
