# Vibing Together

A browser party game for dubbing movie scenes together, based on the principle of *Choicer Voicer*. It runs entirely in the browser, is free, and supports mixed PC and mobile play (crossplay).

## How a game works

1. The **host** (PC) creates a room and loads a **dub pack** (GameBanana, Choicer Voicer format) into the lobby.
2. Players join via room code or QR code (phone or PC, microphone required).
3. Everyone is assigned characters (for example, one player gets Brian, another gets Peter) and records **independently and at their own pace**. Anyone who finishes waits and can see the other players' progress.
4. For each line there is a still image and these buttons:
   - **Original**: the scene with the original audio, with the text shown on screen.
   - **Record**: the scene muted, and you speak your lines.
   - **My take**: your take together with the muted scene.
   - **Next / ◀**: next or previous line.
5. When everyone is done, the main screen plays the **complete scene with your voices**. Watch it as often as you like, then return to the lobby.
6. The premiere starts for everyone at the same time. The host can replay it for everyone with "Watch again"; with the small orange button, the host can also watch it on their own screen only. Every player can save the result as a video (MP4) or just the audio (WAV).

More players than characters: the lines are split among all players. Fewer players: one player speaks several characters.

## Dub pack format

A ZIP or folder containing `_pack_info.ini`, `dub_video.ogv` (or mp4/webm), and for each line an audio file plus an `.ini` or `.txt` file (text, timestamps, character) plus a still image. Optional: `_backing_track` and `icon.png`. Packs are stored in the browser (IndexedDB); nothing is uploaded. You load a pack into the lobby as a ZIP or folder (drag it in or select it).

## Dub pack creator (experimental)

The start page has a **Create a dub pack** button. You prepare subtitles (`.srt` or `.vtt`), a voice track and a background track with free websites, without installing any program (the guide, the links and an info button with safety notes are inside the creator). In the creator you load the video and files, check lines and times, assign characters and build the pack. It can be used in the game right away or saved as a ZIP. Nothing is uploaded; everything runs in the browser.

To remove it: delete `js/maker.js`, and in `index.html` delete the `js/maker.js` line, the `btn-maker` button and the `v-maker` section. Or set `enabled` to `false` under `maker` in `js/config.js`.

### Create subtitles (Whisper)

The creator has a **Create subtitles** tab at the top. It recognizes the speech in a video or audio file with OpenAI's Whisper model and outputs `.srt` or `.vtt`. Recognition runs in the browser (Transformers.js with ONNX Runtime, `vendor/transformers`, `js/whisper-worker.js`); your file is not uploaded. Only the language model is downloaded from Hugging Face the first time (about 45, 81 or 255 MB depending on accuracy) and is then cached by the browser. The available models are listed in `js/config.js` under `whisper`.

A line editor lets you play each line, adjust start and end, edit the text, add or delete lines, sort by time, export `.srt`/`.vtt`, or send the lines straight to the pack builder. Cancel stops recognition immediately; lines that were already recognized are kept.

Notes: the first run needs internet. Without special page headers (GitHub Pages has none) recognition runs on a single CPU core, which is slow, especially on phones. The text can differ from what was said and must be checked. To remove it: delete `js/subtitles.js` and its line in `index.html` (then also `js/whisper-worker.js` and `vendor/transformers`).

## Video note

Chrome and Edge no longer play Ogg/Theora (the pack format) natively. For this reason, Vibing Together automatically loads a bundled software decoder (ogv.js, `vendor/ogv`). The video always stays muted; the audio comes from the game. The duration of unknown videos is estimated from the lines. On weak phones, software decoding can stutter; in that case the game keeps showing the still image and the progress bar.

## Running locally

The game is a plain website with no build step. In the folder that contains `index.html`, start any simple web server, for example:

```bash
python3 -m http.server 3000     # or: npx serve -l 3000
```

Then open `http://localhost:3000` (on `localhost` the microphone also works without HTTPS).

Phones need **HTTPS** for the microphone. The easiest way: upload this folder to **GitHub Pages**, Netlify or Cloudflare Pages. The connection uses WebRTC (PeerJS, public signaling server, see `js/config.js`). On some mobile networks, a TURN server is also required.

## Troubleshooting

- **Microphone blocked:** the page was not opened via HTTPS.
- **Room not found:** check the code; the host must stay open.
- **Video missing on phone:** the still image and audio still work.
- **Voice slightly out of sync:** Bluetooth headphones on a phone add delay.

## Licenses

Vibing Together itself is licensed under the **PolyForm Noncommercial License 1.0.0** (see `LICENSE`): using, modifying and sharing is allowed for noncommercial purposes, meaning private use, with friends, for learning, or for hobby projects. Commercial use (selling, advertising or payment models, integration into a commercial product) is not allowed without the author's permission. The license text and copyright notice must be retained in copies. The bundled libraries have their own licenses:

Fonts Fredoka and Nunito (SIL Open Font License 1.1, license texts in `fonts/`), PeerJS (MIT), JSZip (MIT), qrcode-generator (MIT), ogv.js (MIT, licenses in `vendor/ogv`), mp4-muxer (MIT, `vendor/mp4-muxer.LICENSE`), RNNoise (BSD-3, see below), Transformers.js (Apache 2.0) and ONNX Runtime Web (MIT, `vendor/transformers`), Whisper models by OpenAI (MIT, downloaded from Hugging Face). Pack contents belong to their creators; only use material you have the rights to. Independent fan project.

## Noise suppression

Background noise filtering uses RNNoise (BSD-3, Xiph/Mozilla) as WebAssembly in `vendor/rnnoise/`. It is on by default; each player can turn it on or off themselves in the lobby and in the game (applies per device). Licenses: `vendor/rnnoise/NOTICE.txt`.

## Glass buttons

The small control buttons (light/dark, noise suppression, create dub pack, language menu, info, and the buttons in the top bars) have a glass look: no border, a semi-transparent and slightly blurred background. It lives at the end of `css/style.css` (section "Glass buttons"); the colors come from the `--glass-*` variables and work in dark and light mode. The `glass` class gives other small elements the same look. Browsers without backdrop blur and devices set to "reduce transparency" get a solid background. Large buttons and cards are unchanged.

## Language menu

The language selector is a custom menu in the glass style instead of the browser's select box: a button shows the code of the current language (for example DE), a tap opens a list below it with all languages in their own spelling, and the active one is marked with a check mark. It closes with Esc, a click outside, or tapping again; with the keyboard, the arrow keys choose and Enter confirms. The code is in `js/i18n.js` (`VD.langPicker`), the look at the end of `css/style.css` (`.lang-pick`, `.lang-menu`). There is only one menu for the whole page, it never extends past the screen edge, and it opens upwards when there is little room below. A new language shows up automatically as soon as it is in `LANGS`.

## Languages

At the top right of the start page (and when joining) there is a language selector: Deutsch, English, Español, Français, Português, Русский and हिन्दी. Each device sets its own language. Without a selection, the game uses the browser's language (otherwise English). The German texts are in the code and serve as the keys; the other languages are in `js/lang/` (one file per language; the creator and subtitle tabs keep their own small dictionaries in `js/maker.js` and `js/subtitles.js`). To add another language: create a file modeled on `en.js`, and add it in `js/i18n.js` (the `LANGS` list) and in `index.html`. The subtitle translation below the text runs in the selected language.

## Settings dialog

The sliders button (top right, on every screen: start page, join, dub pack creator, host screen and the player's top bar, also during a game) opens a **Settings** dialog with the less important per-device options, so the lobby and recording screens stay uncluttered. Everything is per device (`VD.store`, in the browser):

- **Auto-sync** (key `autosync`, default on), **Countdown** (key `countdown`, default off: Off / 3 / 5 seconds), **Voice effects** (key `voicefxon`, default off; only an on/off switch, shown for players with a microphone when the host allows effects), and **Sound on/off** (replaces the former separate sound button). The light/dark theme button stays next to the Settings button (to its left) on every screen.
- Changes apply immediately. During a game, auto-sync and countdown affect the next recording; switching voice effects on or off also recomputes the current line's take. The dialog is `VD.ui.openSettings(from, getCtrl)` in `js/ui.js`.

## Countdown before recording

If a countdown is set, the game counts down (a tick and a short vibration per second, then a higher start tone) before the recording starts, so you don't have to speak the moment you tap **Record**. The start tone has to finish before the recording mark is set, so nothing from the countdown ends up in the take. **Cancel** (the same button) stops it without recording.

## Auto-sync

After each recording the game finds where your speech starts and lines it up with the start of the original line. This helps with delayed Bluetooth headphones and with starting a little too early or too late. It is on by default and can be switched per device in the settings on the start page (key `autosync`).

How it works: the take is analysed in 10 ms windows; the threshold is relative to the take's noise level, and the start only counts when at least 60 ms in a row are above it (a click or a breath is ignored). The start of the original line is `line.ts - line.s0`, plus any silence at the start of the original audio file. The take is then moved by the difference, keeping its length (silence is added at one end and cut at the other). It moves by at most about 0.5 s, never cuts speech (moving earlier only uses the silence in front, moving later stops before the end of the speech), and does nothing when the start was not found reliably. Below the take a small note shows what happened, for example "Auto-sync: moved 120 ms earlier"; if nothing was moved there is no note. The unshifted version is kept in the take (`base`), so a take can always be recomputed from it as a new object (`sent: false`, so it is uploaded again). The shift happens before any voice effect and nothing changes on the host or in `net.js`.

The detection is two small pure functions in `js/analysis.js` (`VDA.speechSpan` and `VDA.autoSync`: `Float32Array` in, seconds out), so they can be tested in Node without a browser. The recording flow is in `js/player.js` (`makeTake`, `origStart`, `buildTake`).

## Voice effects

Every player can choose a voice effect: *None, Deep, High, Robot, Echo, Phone, Reverb*. The effect is applied on the player's own device to each take before it is uploaded, so the connection to the host and `Scene.finalMix` are unchanged. Order per take: record, loudness normalisation, auto-sync, effect, normalisation again to `voiceTargetDb` plus soft limiting.

- **Choosing:** the Settings dialog only switches voice effects on or off (key `voicefxon`, default off). While they are on, a small **Voice effect** button under the recording buttons opens a menu to pick the effect (key `voicefx`, default *Deep*). Picking one recomputes the take of the current line from its effect-free version (`take.base`) as a new object (`sent: false`, uploaded again) while a loading spinner shows. "My take" always plays the version with the effect. Other lines keep the effect they were recorded with.
- **Host switch:** *Allow voice effects* in the lobby rules, to the right of *Allow preferred role* (setting `effects`, default on), sent to the phones as `fxOn` in the `lobby` message like `wishOn`. When off, the effect UI is hidden and no effect is applied.
- **Not affected:** silent takes (`take.silent`) are never altered; spectators and players without a microphone do not see the selection.
- **Technique** (`js/fx.js`, pure JS on a `Float32Array`, `window.VDFX.apply(name, x, sr, { targetDb })`, testable in Node): every effect keeps the take length exactly. *Deep/High* shift the pitch by -5/+5 semitones without changing the duration (WSOLA time stretch plus resampling). *Robot* is ring modulation at 55 Hz plus a little distortion. *Phone* is a 300-3400 Hz band-pass plus slight saturation. *Echo* adds two decaying repeats (180 and 360 ms). *Reverb* is a small Schroeder room reverb. Echo and reverb tails are cut at the take length with a soft fade-out. Each effect takes well under a second per line (about 40 ms for 5 s of audio in Node).

## Background music

Music plays on the start page, the join screen and in the lobby (host and players), and is faded out (about 1.2 s) as soon as a round loads, plays or shows the result; it comes back in the lobby afterwards. It never plays in the dub pack creator, is paused while a pack preview is open and while the page is in the background, and is not started before the first tap or click (browser rule, no errors before that). It has its own audio bus (`js/music.js`), so it never reaches the microphone recording, the mix or the export. `VD.sfx.enabled` (button sounds) is independent.

- **Control:** the on/off switch and a fine-grained volume slider (1 % steps) are in the Settings dialog. Both are stored per device (`VD.store`, keys `music`, `musicvol`). Default: on, volume 25 % (`music.volume` in `js/config.js`, also `fadeSec`, `crossfadeSec`).
- **Files:** put mp3, ogg or m4a files in `audio/music/` and list them in `js/config.js` under `music.tracks` (`{ name: 'My piece', file: 'my-piece.mp3' }`). Several files play in random order with a 2 s crossfade; a file is only loaded after the first tap. **Only use music you have the right to use (CC0, public domain, or made by yourself). The game is non-commercial.**
- **Without files** (or if none can be loaded) the game plays its own generated music, *Dub Groove* (75 bpm, sub bass, kick, soft chords), made with Web Audio: no files, no licensing issues.
- **Sounds:** button *Pop* (`click`) and soft *Tap* (`tap`, used for switches, tabs, stars and menu items) are in `VD.sfx` (`js/audio.js`), together with the helpers `VD.sfx.T` (tone), `VD.sfx.N` (noise) and `VD.sfx.hz`.

## Install as an app (PWA)

Vibing Together can be installed on phones and PCs and the page itself starts offline (`manifest.webmanifest`, `sw.js`, `icons/`). Playing together still needs internet (WebRTC).

- **Chrome/Edge/Android:** an "App installieren" button appears on the home page. **iPhone/iPad (Safari):** Share → Add to Home Screen (a hint is shown). The button/hint is hidden when already installed.
- **Caching:** app files are precached; big files (`vendor/ogv`, `vendor/transformers`, `vendor/rnnoise/rnnoise.wasm`, `audio/music/`) are cached on first use. Other origins (PeerJS server, STUN/TURN, translation, Hugging Face) are never cached.
- **Updates:** a new version shows "Neue Version verfügbar – Neu laden" at the bottom; it never reloads by itself.
- **IMPORTANT:** raise `VERSION` at the top of `sw.js` on **every** file change, and add new files to `APP_FILES`. Otherwise users keep the old files.
- **Storage:** Chrome/Edge installed apps share localStorage/IndexedDB with the browser profile. On iPhone the home-screen app has its own storage (packs and settings are not shared with Safari).
- The service worker only registers on https or localhost.

## Reconnecting (phone drops out, reload)

If a phone loses the connection (dead spot, app in the background, screen locked, page reload), it rejoins the room by itself with the same player ID and room code and carries on where it was.

- **Banner and retries:** a banner "Verbindung verloren – verbinde neu …" covers the player screen. Retries after 1, 2, 4, 8 s, then every 10 s (`reconnect` in `js/config.js`). After 5 minutes it stops and shows a "Try again" button. If the host cannot be reached it says so and keeps trying; when the host comes back with the same room code, the phone reconnects.
- **Back in the foreground** (`visibilitychange`, `pageshow`, `online`): the connection is checked at once (ping, 2.5 s to answer), a dead one is replaced immediately. This is what fixes iPhone Safari.
- **What is kept:** current line, finished takes, settings. A recording in progress is discarded (no half takes) and the player is told to record it again. Finished takes are also sent to the host again (it accepts duplicates).
- **Page reload:** the room code and player ID are remembered on the device (`localStorage`, key `vd.session`, 12 h). After a reload the join screen asks "Wieder in Raum ABCD einsteigen?". Finished takes are stored in IndexedDB (`js/takestore.js`, database `vibingtogether-takes`, per room and line) and restored. Everything is deleted when the round ends (back to the lobby), when the player leaves the room, or is removed.
- **Microphone:** after reconnecting the phone checks the microphone and restarts it. If the browser needs a tap for that, a "Mikrofon starten" bar appears.
- **Host:** an absent player keeps the assignment and takes (`connected=false`). In the recording phase the host waits and shows "{name} ist kurz weg …" with a "Skip" button (the takes already sent stay in the result). If the connection dropped while the result was loading, the result audio is sent again on return.
- **Not covered:** if the host page itself is reloaded, the room is gone (a new room code is created).

## Pack preview

Every pack in the host lobby's list has a **Preview** button (a small ▶ plus text, only the ▶ on phones) left of *Select*/*Selected*. It opens a dialog (`js/preview.js`, `VD.PackPreview.open(pack)`) that plays the original scene: video (muted, through `VD.Video`, including the ogv.js fallback), all original lines at their times plus the background track, and the line text as subtitle with the character name. Controls: play/pause, a clickable and keyboard-operable progress bar (arrow keys jump 5 s), close (button, Esc or click outside). Audio comes from `VD.Scene.build`, so it is decoded only once per pack (the `WeakMap` cache in `scene.js`) and reopening is fast; the preview uses the same 16 kHz line audio the players hear. Without a playable video, or without a video at all, the still images of the lines are shown in turn. Closing stops everything immediately and revokes all object URLs. The preview never changes the selected pack and the list is only shown in the lobby.

### Shared preview

When the host taps "Preview" in the lobby, the preview runs on every connected device at the same time. The host first sends the small data (one mixed original sound, texts, character names, timings, stills) and then the video, in chunks, over the same transfer and the same phone-side cache (`js/vcache.js`) that a normal round uses, so a video loaded for the preview is not sent again in the real round. The host screen shows how many devices are ready and can start at any time ("Start now"). Without intervention it starts when all devices have the video or after `game.previewWaitMs` (`js/config.js`); the start uses `game.replayDelayMs` so the sound begins at about the same moment everywhere.

A device that has no video at the start gets a simple version (sound, text, stills) until the end. Only the host controls it (play, pause, jump, close). "Watch only on my screen" keeps the preview local. Players who join or reconnect during a preview see the lobby and take part in the next one. Starting a round, choosing another pack, or closing the preview ends it everywhere; the lobby music is paused on all devices meanwhile.

## Random pack ("Surprise me")

Above the pack list, below the *All packs / Favorites* buttons, the **🎲 Surprise me** button picks a random pack (`randomPack()` in `js/hostviews.js`). It chooses from all packs, or only from favorites while *Favorites* is selected, and leaves out the currently selected pack and the last randomly picked one as long as at least two packs are available. With only one pack it just shows a short note. The chosen pack is activated exactly like *Select* (`VD.Packs.select`), the list scrolls to it and highlights it briefly, a toast says "Randomly picked: {name}" and the same text goes to an `aria-live` region. Keyboard focus stays on the button when the list is redrawn. It exists only in the lobby, because the pack list is not shown during a round.

## Pack favorites

In the host lobby's pack list every pack has a star button (left of the delete cross; ☆ = no favorite, ★ = favorite). Favorites are stored in the browser (`VD.store`, key `packfav`, by pack id, not inside the pack) and removed again when the pack is deleted (`VD.Packs.remove`). Favorites are listed first, otherwise in the old order. Above the list two buttons in a box (like *Random / In order*) switch between **All packs** and **Favorites** (key `packfavonly`, per device); *Favorites* is greyed out while no pack is a favorite. The selected pack stays selected even if the filter hides it, and a note "Selected pack is hidden" is shown.

## Preferred role and translation

In the lobby, each player can tap their preferred character (only in "Random" mode; the host can turn this on or off with the "Allow preferred role" switch). A player who picks a preferred role gets that character in full (if the number of characters equals the number of players, everyone gets exactly one whole character; with more characters, the rest is distributed fairly). Only if too little would otherwise be left for players without a preference, very large preferred roles are trimmed slightly so that nobody goes empty-handed. Foreign-language subtitles automatically get a translation into the selected language on each device via the free MyMemory service (`api.mymemory.translated.net`, daily limit per internet connection). Without internet there is no translation, and the game runs normally.

## For developers: structure and customization

Pure HTML/CSS/JavaScript with no build step: change files, reload the page. All modules hang off the global object `VD`; `index.html` loads them in the correct order.

| File | Purpose |
|---|---|
| `js/config.js` | **Start here:** game name, server, limits (`limits`), game feel (`game`: lead-in/lead-out, recording tail, target volume, wait times), creator (`maker`) and Whisper models (`whisper`) |
| `js/scene.js` | Core mechanics: pack to scene, **role assignment** (`Scene.assign`, including preferred roles) and the final mix (`Scene.finalMix`) |
| `js/host.js` | Game flow on the host (lobby → loading → recording → result), player management, messages from phones |
| `js/hostviews.js` | All views of the host screen |
| `js/music.js` | Background music (files or generated Dub Groove). |
| `js/takestore.js` | Takes kept in IndexedDB so they survive a page reload. |
| `js/preview.js` | Pack preview dialog in the host lobby. |
| `js/player.js` | View and flow on the phone (or on the host PC as a player): original, recording, take, submission |
| `js/net.js` | Connection (PeerJS/WebRTC), chunked file transfer |
| `js/audio.js`, `analysis.js`, `denoise.js` | Microphone, playback, volume leveling, noise suppression |
| `js/video.js`, `export.js`, `vcache.js` | Video (including the ogv.js fallback), export as MP4/WebM/WAV, video cache on the phone |
| `js/packs.js` | Import and storage of dub packs |
| `js/maker.js`, `js/subtitles.js`, `js/whisper-worker.js` | Dub pack creator, subtitle creator and the Whisper web worker |
| `js/translate.js` | Subtitle translation (MyMemory) |
| `js/ui.js`, `js/util.js`, `js/main.js` | Shared UI parts (theme button, avatars), helpers and the animated background, start page and joining |
| `js/i18n.js`, `js/lang/` | Languages and the language menu (see above) |
| `css/style.css` | The entire look; colors and spacing as variables at the top of the file. Dark is the default, the light color set is under `html[data-theme="light"]`. |
| `fonts/` | Bundled fonts (Fredoka, Nunito), so no connection to Google is needed |

Messages between host and phone are small objects with a field `t` (for example `hello`, `scene`, `take`, `phase`); the receiving side handles them in `onPlayerMsg` (host.js) or `onMsg` (player.js). Everything coming from another device is validated there before it is used.

Checking translations: set the language, play through the game, and type `VD.missing` in the browser console. It lists all texts that are still missing in that language.
