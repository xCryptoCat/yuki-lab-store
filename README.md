# Yuki Lab Store + Yukizo hero

`index.html` is the **Yuki Lab Store** website. Yukizo, the live 3D store manager, stands between shelves of "products", which are Yuki Lab's services:

- **Games:** ユキゾウ 地下鉄ランナー, 警備会社シミュレーション, and custom games.
- **Office documents:** Excel, Word and PowerPoint.
- **Web:** landing pages, websites and 3D mascots.
- **Apps:** security apps and business apps.

When a visitor points at a product (or taps it on a phone), Yukizo looks at it, presents it with his open hand and explains it in his speech bubble. Clicking it, or tapping a second time, scrolls to that aisle.

Yukizo talks: his mouth moves in sync while each line types out. He also breathes, shifts his weight, glances around the shop, twitches an ear, and squints when he smiles.

The page has some Japanese store touches:

- **手書きPOP:** handwritten "店長のひとこと" notes on every aisle, and a "店長イチオシ!" card on the shelf.
- **スタンプラリー:** visitors collect a stamp for each aisle they visit. Progress is remembered between visits, and Yukizo thanks them when the card is complete.
- **受付印:** a red hanko stamp on the order receipt.

The rest of the page has four parts:

- **Aisle sections:** one portfolio section per shelf.
- **Store manager profile.**
- **Order flow:** shown as a store receipt.
- **Contact form:** it opens the visitor's email app.

The footer and contact section credit the parent company, Yuki Security (株式会社裕輝 / Yuki Co., Ltd.), with a link to https://yuki-security.com/. The whole site is in Japanese and English, with a 日本語 / EN switch. It starts in the visitor's browser language and remembers their choice.

**Edit before going live**

| what | where |
|---|---|
| Contact email address (sakuseed0327@gmail.com) | `CONTACT_EMAIL` in `src/site/store.js` |
| Yukizo's speech-bubble lines | `LINES` in `src/site/store.js` |
| Page copy | `index.html`: every text exists as `<span lang="ja">` + `<span lang="en">` |
| Images | `public/img/`, converted from the design bundle's uploads |
| Yukizo's 3D model | `public/models/yukizo.glb` (see below) |

---

## The `<yukizo-hero>` component

Yukizo is an animated 3D elephant mascot, packaged as a `<yukizo-hero>` web component for your website's hero section. It is built with three.js.

He's the Claude Design prototype (`project/Yukizo 3D.html`), rebuilt as a proper package. His look and behaviour are unchanged:

- **Entrance:** he pops in with a salute and wink the first time he scrolls into view.
- **Idle:** he sways and breathes, blinks, flaps his ears, moves his trunk and grins now and then.
- **Gestures:** about every 4–9 s he waves, holds the "proud" pose, or puts his fist on his chest. Otherwise his arms rest at his sides.
- **Gaze:** his eyes follow the cursor and his head turns after them. When the cursor is still, he looks at the viewer.
- **Hover:** he grins and waves.
- **Click / tap / Enter:** he salutes and winks.
- **Plush finish:** sheen materials, a felt normal map, fur shells, and a soft contact shadow.
- **Reduced motion:** he holds the still image pose, and switches live when the OS setting changes.
- **Off-screen:** he stops rendering until he's back in view.

## Use it on your site

```bash
npm install
npm run build          # → dist-lib/yukizo-hero.js (one file, three.js bundled in)
```

Copy `dist-lib/yukizo-hero.js` to your site, then:

```html
<script type="module" src="/yukizo-hero.js"></script>
<style>yukizo-hero:not(:defined){visibility:hidden}</style>

<yukizo-hero style="height:560px"></yukizo-hero>
```

Size it with ordinary CSS. The default is `width:100%; height:560px`.

### Attributes

| attribute    | values | |
|--------------|--------|---|
| `mode`       | `hero` (default) | Transparent background and no UI. Scroll-zoom is off, and vertical swipes scroll the page. |
|              | `viewer` | Full-screen sky gradient, download buttons, hint text and scroll-zoom. |
| `background` | any CSS background | Same effect as setting `--yukizo-bg`. |
| `name`       | text | Basename for downloads (default `yukizo`). |
| `src`        | URL of a `.glb` | Show this model instead of the one built in code. If it fails to load, he is built in code. |

### Methods & events

```js
const y = document.querySelector('yukizo-hero');
await y.ready;
y.salute();              // salute + wink (the Blender model hops and waves, its sleeves can't bend)
y.talk(2.5);             // move his mouth as if speaking (e.g. while a speech bubble types)
y.gesture('wave');       // 'wave' | 'proud' | 'chest'
y.lookAt(x, y);          // glance at a point on the page (viewport px)
y.resetView();           // also on double-click
y.downloadGLB();         // image pose, mouth closed, no fur shells; mouth "open" morph target included
y.downloadOBJ();         // OBJ + MTL
y.addEventListener('yukizo-salute', () => {});
y.addEventListener('yukizo-ready', () => {});
```

### The Blender model

The site and the viewer show `public/models/yukizo.glb`, the Blender-built Yukizo (`yukizo_v5.blend`). It must keep the export conventions of the Blender file: metres, Y-up, facing +Z, feet at y≈0, and the node names `rig`, `legs`, `upper`, `head` (pivot at the neck), `head_offset`, `ear_L/R`, `eyelid_L/R`, `iris_L/R`, `brow_L/R`, `hand_R`, `trunk*`, `tail*`, plus an `open` morph target on `mouth` and `tongue`. `src/model/yukizo-glb.js` animates those parts.

The Blender export (about 7 MB) is shrunk to about 0.4 MB with `tools/optimize-yukizo.mjs` (glTF Transform + meshoptimizer; how to run it is at the top of the file). It simplifies only the big meshes, then quantizes and Meshopt-compresses everything, keeping the node names and the mouth's morph target.

## Develop

```bash
npm run dev       # http://localhost:5173 (Yuki Lab Store) and /viewer.html (full-screen Yukizo viewer)
npm run build     # site → dist/ (deploy this folder), component → dist-lib/
```

| file | |
|---|---|
| `src/model/yukizo.js` | Geometry, rig and `pose()`. All measurements are from the prototype. |
| `src/model/materials.js` | Plush materials, felt normal map and blush gradient. |
| `src/model/helpers.js` | Decal, ribbon, limb and subdivision helpers. |
| `src/life.js` | Behaviour: entrance, idle, gestures, gaze, salute and blinks. Smoothing runs at a fixed 60 Hz, so it feels the same on high-refresh screens. |
| `src/stage.js` | Renderer, lights, environment map, shadows, camera framing and controls. |
| `src/export.js` | GLB and OBJ+MTL downloads. |
| `src/yukizo-hero.js` | The custom element. |
| `src/site/store.css`, `src/site/store.js` | The Yuki Lab Store website: layout, language switch, Yukizo's speech bubble, shelf interactions and the contact form. |

The original design handoff (prototype, chat transcript, reference images) is in `project/` and `chats/`.
