# Supreme Master Typist
A keyboard practice app for Dvorak, Colemak, and other layouts, with typing stats and a timeline showing exactly where mistakes happen.

Try [Supreme Master Typist](https://shaqaruden.github.io/dvokakdubs/), hosted with GitHub Pages.

Supreme Master Typist is a fork of [Colemak Camp](https://github.com/ColemakCamp/colemakcamp.github.io), which is a fork of [Colemak Club](https://github.com/gnusenpai/colemakclub), which itself is a fork of [Colemak Academy](https://colemak.academy/).

## Key Features
Supreme Master Typist adds:
- A current-test event timeline showing completed words and mistakes in red.
- Selectable events with timestamps and expected versus typed characters.
- A results layout that keeps typing stats and Reset visible.

Features inherited from Colemak Camp include:
- Responsive design, fits in more display sizes.
- Customizable theme colors, including light and dark modes.
- Several more menu options are now saved in local storage, thus remembered if you refresh.
- Cheatsheet keyboard is sized more accurately.
- Custom input keyboard changes according to selected keyboard type.
- Overall change in the design language.
- Persistent custom layout via local storage.
- Support for phones and tablets running Android (and iOS hopefully).

### Planned Features
- Custom themes.
- Sharing and loading custom themes via links.

## Build Tools
This project does not rely on npm or other similar tools. You may utilize any toolchain you want as long as you can reproduce same results.

- Install VS Code
- Install extensions:
    - [Nu-Minify](https://marketplace.visualstudio.com/items?itemName=emapco.nu-minify)
    - [Live Sass Compiler](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass)
    - [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
- Update VS Code settings:
``` json
{
    "minify.js": {
        "output": {
            "comments": "/^!/"
        }
    },
    "minify.minifyExistingOnSave": true,
    "liveSassCompile.settings.useNewCompiler": true,
    "liveServer.settings.donotShowInfoMsg": true
}
```

- Watch Sass
    - You will need to click 'Watch Sass' to compile `scss` files to `css`. Once clicked, all changes will be automatically compiled within that session. Note that this does not minify anything.
- Minify on Save
    - Using the settings above will enable this feature; otherwise enable it manually from extension settings.
    - If the file you're minifying already has an existing `.min` file, simply saving the source will update the minified file. So, you need to save the `main.css` file to update the `main.min.css` file.
    - If there is no existing `.min` file, run the `Minify` command on the source file. (Press F1 to search available commands, `>minify`.)

## Pull Requests
Please create an issue and await my response before submitting any pull requests.

## License
This project is under the **[GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.en.html)**, which is the same as Colemak Club and Colemak Academy, as seen in this [issue](https://github.com/Nemcorp/layoutacademy/issues/2).

Parts of the project that are not a part of this license are mentioned in this table:
| Project Name                                                                            | Project License   |
|-----------------------------------------------------------------------------------------|-------------------|
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