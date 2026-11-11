# Supreme Master Typist

A keyboard practice app that turns mistakes into your next practice session. Train with Dvorak, Colemak, QWERTY and other layouts, see where your accuracy slips, and track your improvement in this browser.

**[Start practising](https://shaqaruden.github.io/supreme-master-typist/)** · [Source on GitHub](https://github.com/shaqaruden/supreme-master-typist)

## Practice, understand, improve

- **Compact results:** WPM, accuracy, completed words and elapsed time stay beside Try again and Practice my mistakes.
- **Speed and event timeline:** follow your speed over time and select individual completed words or red mistake markers to inspect timestamps and expected versus typed characters.
- **Mistake analysis:** find troublesome letters, their error rates and frequent character confusions, including space and end-of-word mistakes.
- **Keyboard heatmap:** see errors on the selected keyboard and layout, with a text breakdown and a legend that distinguishes untried keys from accurate ones.
- **Targeted drills:** practise 20 words focused on your mistakes, using your current level and preferences. Drill results have their own record category; return to regular practice without losing your test limits.
- **Local Progress view:** compare WPM and accuracy trends, browse dated results and switch comparison groups. Progress is available between tests so opening it cannot interrupt an active test.
- **Personal bests:** track speed and accuracy records for matching layout, keyboard, level, mode, limit and preferences, with custom layouts and drills compared separately.
- **Skill-based ranks:** rise from Apprentice through Typist, Adept, Expert and Master to Supreme Master by meeting learning-level, speed and accuracy targets in the same test. Minimums are Level 1 for Apprentice, Level 2 for Typist, Level 3 for Adept, Level 4 for Expert, Level 5 for Master, and All Words or Full Sentences for Supreme Master. Ranks remain unified within each keyboard layout. Standard tests must last at least 30 seconds and complete at least 10 words to qualify; drills do not award ranks.
- **Distinctive identity:** a typography-led Supreme Master Typist wordmark and crown/SMT mark, with matching app icons and share imagery.

Existing practice tools include progressive learning levels, timed and word-count tests, full-sentence practice, configurable case and punctuation, remapping, multiple keyboard shapes and a persistent custom layout. The interface supports desktop, mobile and tablet screens, theme customisation, and light and dark modes.

## Your data

Progress is saved locally in this browser, without an account or server. The app retains up to 500 completed sessions and stores summary metrics and practice settings, rather than raw typed text or keystroke logs. Reset or abandoned tests are not saved. Clear history removes session records while keeping keyboard and theme preferences. Browser storage restrictions or a full store may prevent saving; typing remains available.

WPM uses correctly entered characters divided by five and actual elapsed time. Accuracy counts correct character attempts out of all character attempts, retaining mistakes even after correction. The same measurements power results, charts, records and ranks.

## Run and contribute

This is a static HTML, CSS and vanilla JavaScript site. There is no runtime framework or backend. Serve the repository with a local web server, for example:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Source JavaScript lives in `scripts/`; the page loads the matching `.min.js` deployment files. Main styles are authored in `styles/main.scss` and compiled/minified to CSS; feature styles may be loaded directly. Keep generated deployment assets in sync with their sources when making changes. Node's built-in test runner can run the deterministic tests:

```sh
node --test tests/*.test.cjs
```

The existing VS Code workflow uses [Live Sass Compiler](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass), [Nu-Minify](https://marketplace.visualstudio.com/items?itemName=emapco.nu-minify) and [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer). Any reproducible equivalent toolchain is welcome.

Please open an issue before submitting a pull request.

## Game Mode

Use the **Game Mode** button beside the theme controls to switch to a medieval RPG-inspired interface. It uses [RPGUI](https://github.com/RonenNess/RPGUI)'s actual frame and button sprites over the courtyard pixel-art background, with a local pixel font and brief typing/completion feedback. The toggle is remembered; turning it off restores your normal theme without resetting a test. Reduced-motion preferences are respected.

The initial release includes the courtyard background. Additional scenes can be added to the small registry in `scripts/game-mode.js` later; no empty background picker is shown.

## Upstream credit

Supreme Master Typist is a fork of [Colemak Camp](https://github.com/ColemakCamp/colemakcamp.github.io), which is a fork of [Colemak Club](https://github.com/gnusenpai/colemakclub), which itself is a fork of [Colemak Academy](https://colemak.academy/).

## License
This project is under the **[GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.en.html)**, which is the same as Colemak Club and Colemak Academy, as seen in this [issue](https://github.com/Nemcorp/layoutacademy/issues/2).

Parts of the project that are not a part of this license are mentioned in this table:
| Project Name                                                                            | Project License   |
|-----------------------------------------------------------------------------------------|-------------------|
| [RPGUI](https://github.com/RonenNess/RPGUI) | zlib (see vendor/rpgui/LICENSE.txt) |
| [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) | Open Font License (see fonts/press-start-2p-OFL.txt) |
| [Popper](https://popper.js.org/)                                                        | MIT               |
| [Tippy.js](https://atomiks.github.io/tippyjs/)                                          | MIT               |
| [Fork Awesome CSS](https://github.com/ForkAwesome/Fork-Awesome)                         | MIT               |
| [Cuprum (Google Fonts)](https://fonts.google.com/specimen/Cuprum)                       | Open Font License |
| [Radio Canada (Google Fonts)](https://fonts.google.com/specimen/Radio+Canada)           | Open Font License |
| [Cascadia Code (Microsoft)](https://github.com/microsoft/cascadia-code)                 | Open Font License |
| [Material Icons (Google Fonts)](https://fonts.google.com/icons?selected=Material+Icons) | Apache-2.0        |

## Icon Attributions
Some of the icons have been taken from Flaticon, which requires attribution. Below is a list of all the icons in the `fontasm` font file that are directly taken from Flaticon or modified based on something from Flaticon.
| Icon Class      | Attribution                                                                        |
|-----------------|------------------------------------------------------------------------------------|
| fa-arrow-top    | [Flaticon](https://www.flaticon.com/free-icon/arrow-angle-pointing-to-right_54900) |
| fa-arrow-right  | [Flaticon](https://www.flaticon.com/free-icon/arrow-angle-pointing-to-right_54900) |
| fa-arrow-bottom | [Flaticon](https://www.flaticon.com/free-icon/arrow-angle-pointing-to-right_54900) |
| fa-arrow-left   | [Flaticon](https://www.flaticon.com/free-icon/arrow-angle-pointing-to-right_54900) |
| fa-editor       | [Flaticon](https://www.flaticon.com/free-icon/edit_10074336)                       |
| fa-settings     | [Flaticon](https://www.flaticon.com/free-icon/setting_12439246)                    |
| fa-theme        | [Flaticon](https://www.flaticon.com/free-icon/paint-palette_1763061)               |
| fa-preferences  | [Flaticon](https://www.flaticon.com/free-icon/equalizer_4724337)                   |
| fa-send         | [Flaticon](https://www.flaticon.com/free-icon/message_10426368)                    |
| fa-edit         | [Flaticon](https://www.flaticon.com/free-icon/edit_10074336)                       |
| fa-keyboard     | [Flaticon](https://www.flaticon.com/free-icon/keyboard_4122844)                    |

Icons not listed here are either from Material Icons, or created from scratch.