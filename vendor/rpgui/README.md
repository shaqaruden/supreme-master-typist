# RPGUI components

Source: https://github.com/RonenNess/RPGUI
Pinned upstream revision: `048859e6e1a73bd8f5615555609db098beba4e9c`
License: zlib (see LICENSE.txt).

This local component build concatenates the upstream container/frame and button styles and includes their referenced graphics. The original component declarations and sprites are unchanged. Scope/layout/accessibility overrides are maintained separately in `styles/game-mode.css`; our toggle adds and removes RPGUI classes. We do not load RPGUI's global content reset or JavaScript widget enhancement, keeping native controls, selection, focus and typing behaviour.

Upstream credits: RPGUI by Ronen Ness. Default-theme graphics are public-domain artwork by Buch / Michele Bucelli, as credited by RPGUI.
