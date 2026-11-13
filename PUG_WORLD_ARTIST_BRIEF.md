# 3D artist brief: Pulgo dog collection (6 cute 3D dog breeds)

*Post this on Fiverr / Upwork (search "3D stylized animal character rigging animation", "cute 3D game character", "glTF character for web").*

---

## About the project
Pulgo is an AI study-planner app for students (iPhone). We're adding a **dog collection game**: studying earns chests, chests contain cute **3D dogs** of different rarities, and players collect them, dress them up and show them in a 3D showcase (spin, outfits, a trick). We need **6 dog breeds** as cute full-body 3D characters for real-time web 3D (three.js inside the app), starting with our mascot, **Pulgo the pug**.

**Reference:** our current mascot picture (attached: `pug-avatar.png`). It's a cute pug in a graduation cap with a purple bow tie, in a soft 3D-film look: big shiny eyes, rounded shapes, warm fawn fur and a black face mask. The pug should look like **this exact pug**, with a **full body**: four legs, a curly tail and a chubby body. The other 5 breeds should match the same cute style.

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

## Breeds and variants
- **6 breeds on one shared quadruped skeleton** (so they share animations): **pug (Pulgo), beagle, dachshund, corgi, shiba inu, husky**.
- Colour variants are made by us in code, so please keep fur colour in a **separate, clean texture / material** (e.g. a base-colour texture with a mask for markings).
- Rare skins (golden, crystal, galaxy, rainbow) are also done by us with materials — no extra models needed.

## Animations (3 per breed, shared skeleton)
| # | Name | Loop? | What it shows |
|---|---|---|---|
| 1 | `idle` | loop | standing or sitting, breathing, small tail wag, blink |
| 2 | `happy` | once | a happy jump with a tail wag (when the dog is revealed from a chest) |
| 3 | `trick` | once | a fun trick: spin around, or sit and give a paw |

## Deliverables
1. One `.glb` per breed with its model and the 3 animations, tested in a glTF viewer (e.g. gltf-viewer or three.js editor).
2. Source file (`.blend` or equivalent) and textures.
3. A short preview video of each animation.
4. **Full commercial rights**: we can use and modify the character in our app, store pages and marketing.

## Nice to have (quote separately)
- Accessories as separate `.glb`s fitted to the attachment points: graduation cap, bow tie, cap, sunglasses, scarf, hoodie.
- More breeds later on the same skeleton (golden retriever, dalmatian, samoyed, French bulldog…).

## Please include in your offer
- Your portfolio of **animated stylized animals** (ideally game- or web-ready).
- Price and timeline for the 6 breeds with 3 animations each (and a price per extra breed), and for the "nice to have" items.
