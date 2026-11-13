# 3D artist brief: "Pulgo" the study pug

*Post this on Fiverr / Upwork (search "3D stylized animal character rigging animation", "cute 3D game character", "glTF character for web").*

---

## About the project
Pulgo is an AI study-planner app for students (iPhone). We're adding a pet game: studying earns coins, and you spend them on your **3D pug** — food, toys, outfits, furniture — and watch it grow from a tiny puppy into an adult dog. It lives in a cozy bedroom. We need our mascot, **Pulgo the pug**, as a **full-body, animated 3D character** for a real-time web 3D game (three.js inside the app).

**Reference:** our current mascot picture (attached: `pug-avatar.png`). It's a cute pug in a graduation cap with a purple bow tie, in a soft 3D-film look: big shiny eyes, rounded shapes, warm fawn fur and a black face mask. The 3D model should look like **this exact pug**, with a **full body**: four legs, a curly tail and a chubby body.

Please create an **original** character from our reference, not based on any existing game or film character.

## Style
- Cute stylized 3D, like an animated family film: soft, rounded, big expressive eyes.
- Clean and readable on a phone screen. Calm, not hyper.
- Fur colour: warm fawn/beige; black face mask and ears. Optional removable accessories: a **graduation cap with a purple tassel** and a **purple bow tie / collar**.

## Technical requirements
- **Format:** `.glb` (glTF 2.0) with all animations embedded, plus the source file (`.blend` preferred).
- **Polycount:** about **10,000–20,000 triangles** for the dog (mobile web).
- **Textures:** one material if possible, base colour plus optional roughness/normal, **1024–2048 px**.
- **Rig:** a quadruped skeleton that is clean for game use (root bone at the floor, between the paws).
- **Face:** blend shapes or bones for **blink**, **mouth open**, **happy**, **sad/sleepy** and **ear wiggle**.
- **Attachment points** (empty bones) for accessories: **head (hats)**, **neck (collars, bow ties)**, **back (backpack/clothes)**.
- Real-world scale, facing +Z (glTF forward), animations at 30 fps, **looping animations must loop seamlessly**.

## Growth stages
The dog grows up in the game: **newborn puppy → puppy → young → adult**. Please make the proportions change with age (a puppy has a bigger head, shorter legs, clumsier moves), either as **blend shapes / bone scaling on one model** (preferred, so all animations are shared) or as separate models on the same skeleton.

## Animations (about 18)
| # | Name | Loop? | What it shows |
|---|---|---|---|
| 1 | `idle` | loop | standing, breathing, small tail wag |
| 2 | `idle_look` | once | looks around / tilts head (random idle) |
| 3 | `walk` | loop | walking forward |
| 4 | `sit` | loop | sitting, happy |
| 5 | `sleep` | loop | lying down, sleeping, slow breathing |
| 6 | `yawn` | once | sleepy yawn |
| 7 | `eat` | loop | eating from a bowl on the floor |
| 8 | `drink` | loop | drinking from a bowl |
| 9 | `bath_shake` | once | shakes off water after a bath |
| 10 | `play_ball` | once | jumps / pounces on a ball |
| 11 | `brush` | loop | enjoys being brushed (eyes half closed, leg kick) |
| 12 | `celebrate` | once | happy jump, tail wag (new toy, grew up) |
| 13 | `sad` | loop | ears down, a little sad ("misses you"), never sick |
| 14 | `pet_happy` | once | reacts happily when tapped / petted |
| 15 | `trick_sit` | once | sits on command |
| 16 | `trick_paw` | once | gives a paw |
| 17 | `trick_spin` | once | spins around |
| 18 | `trick_roll` | once | rolls over |

## Deliverables
1. `pulgo.glb` with the model and all animations above, tested in a glTF viewer (e.g. gltf-viewer or three.js editor).
2. Source file (`.blend` or equivalent) and textures.
3. A short preview video of each animation.
4. **Full commercial rights**: we can use and modify the character in our app, store pages and marketing.

## Nice to have (quote separately)
- Accessories as separate `.glb`s fitted to the attachment points: graduation cap, bow tie, school backpack, a hoodie.
- 5 more dog breeds on the **same skeleton**, so they share the animations: beagle, dachshund, corgi, shiba, husky.

## Please include in your offer
- Your portfolio of **animated stylized animals** (ideally game- or web-ready).
- Price and timeline for the main pug with the growth stages and 18 animations, and for the "nice to have" items.
