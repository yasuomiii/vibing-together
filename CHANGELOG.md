# Changelog

All notable changes to Vibing Together. Newest first.

## 2026-11-28

### Changed
- **Code audit (no change to look, texts or behavior).** Whole code base checked for errors, dead code and needless work.
  - `style.css`: removed leftovers of the old background sparks (`.bg-spark-*`, their variables and keyframes) and unused rules (`.mk-tools`, `.mk-warn-t`); merged duplicate and overridden rules (icon buttons, pack rows, preview bars, host bar, modal padding, favorites bar).
  - Translations: removed keys no language uses (maker, subtitles, "Leertaste", "Nur Favoriten").
  - Small fixes: a removed local player no longer keeps redrawing on language change and frees its scene data; a replaced subtitle video stops playing; the microphone output node is released on stop; MP4 export no longer leaves a hidden video behind if audio preparation fails.
  - `motion.js`: the page-wide observer now needs one search per inserted element instead of six.
  - Service worker version 34.

## 2026-11-21

### Added
- **Shared pack preview.** When the host taps "Preview" in the lobby, the preview now plays on all connected devices at the same time. Everyone sees and hears what is coming up.
  - The host sends the small data first (sound, texts, stills), then the video, using the same transfer and phone cache as a normal round. A video loaded for the preview is not sent again when the round starts.
  - The host sees how many devices are ready and can start at any time ("Start now"). Otherwise it starts when everyone has the video or after a short wait (`game.previewWaitMs` in `config.js`).
  - The start is synchronized with a lead time, like "Watch again" in the premiere.
  - Devices without the video at the start get a simple version (sound, text, stills) until the end.
  - Only the host controls pause, continue, seek and close. Players see "Preview from the host" with a progress bar.
  - New host button "Watch only on my screen" keeps the preview local (nothing is sent).
  - Starting a round or changing the pack ends the preview everywhere. Lobby music is paused during the preview.
- Maximum video size for transfer to phones raised to 100 MB (`limits.maxBlobBytes`).

- **Subtitles switch** ("CC") in the preview and in the settings, saved per device.
- **Switch the language inside a room** without reloading, so nobody gets kicked out.

### Changed
- **Fluid motion everywhere (new `js/motion.js`, look unchanged).** Selector highlights glide between options; lobby players, pack lists and chips slide into their new places while new entries fade in and removed ones fade out; the old view now fades out as the new one fades in; dialogs grow out of the button that opened them and shrink back; counters and button state changes move briefly; selected role and effect chips spring slightly. Everything respects reduced motion, is skipped while recording, and is cached for offline use (service worker version 21).
- **Visual polish (look and motion only, no changes to features or texts).**
  - Shared motion values (durations and easing) at the top of `style.css`; all buttons, round buttons, role chips and switches now react to hover, focus and press in the same rhythm.
  - Soft fade-in when switching between the start page and the join page; shorter, calmer view transitions in the lobby, recording and result views.
  - Windows fade in without moving the backdrop and never grow taller than the screen (inner scrolling on small phones). Notifications and progress bars no longer overshoot.
  - Lobby bar on phones is one row instead of a tall block; on very narrow phones (360 px) the title makes room for the room code so nothing is cut off.
  - Recording view: the main action stands out (record, then "Done"); "Original", "My take" and "Back" are quieter.
  - Result view: title, picture, speaker chips and buttons appear one after another.
  - Contrast raised to WCAG AA in both themes (hint text in dark, red record button, red/green/orange texts in light).
- Phones with a notch or rounded corners: the top bar, the background and the host stage now respect the safe areas (nothing is hidden under the notch or the bottom bar). The PC layout is unchanged.

### Security
- Player IDs are now secret between the phone and the host; other players only get a public ID.
- Player names are cleaned (no invisible or direction-changing characters, limited stacked accents).
- Incoming data from other devices is checked more strictly: line lists, colors, recordings (length and loudness) and message rate. Spamming devices are disconnected, and the number of connections is limited.
- Pack import is protected against oversized or manipulated ZIP files and overly long audio lines.

### Fixed
- Recording view: "Original", "My take" and "Back" have their 3D edge back (dark, same height and press feel as "Record" and "Next"). Buttons no longer all bounce at once when they are re-enabled after recording or playback; only a button that really switches state (Record/Stop, Original/Stop, My take/Stop) springs briefly. Moving to the next or previous line now slides the line counter, role and caption in the direction of travel instead of switching hard (service worker version 29). "Original" and "My take" now have a solid dark fill instead of a see-through one (service worker version 30).
- Lobby: when switching between "All packs" and "Favorites", the fading copies of removed packs no longer flash over the bottom bar (they are cut off at the bar's edge).
- Wish roles (and warning notes) faded in twice when they re-appeared, e.g. when switching "Allow wish role" off and on, or "Random" / "In order". The fade-in was started backwards and then jumped back; it now plays once. The same fix applies to the spring of selected chips and the theme button (service worker version 31).
- **Help window.** A "?" button at the top left of the start page opens a short explanation of the game and of the buttons (lobby, recording buttons, the icons at the top such as noise filter, settings, full screen, language, and the result). Translated into all seven languages.
- **Voice effect resets every round.** Each new round starts without a voice effect, so it can no longer be left on by accident. A scene that is re-sent after a dropped connection does not reset it.
- **"Watch now" / "Next" on the host screen** is now triggered with the **P** key instead of the space bar (the key hint on the button says P).
- **Language is locked during a round.** The language can still be changed any time on the start page and in the lobby, but not while a game is running (the settings show a short note instead). Service worker version 33.
- Pressing record and stop very quickly no longer shows "Recording could not be processed"; the empty take is ignored and the "hardly heard anything" hint appears instead (service worker version 28).
- **Motion fixes.** Fading-out copies of the old view, closed dialogs and removed list entries no longer replay their fade-in animations; views with their own staggered entrances (lobby, loading, result) no longer fade in twice; redrawing the same view (language switch, a player joining mid-round, replaying the result) no longer fades out and in again; list entries without a stable key are no longer faded out and in at the same time; the selection spring on role and effect chips only plays when the selection really changes. Service worker version 27. Lobby lists rebuilt on a simpler, measured approach: positions are taken right before and right after each redraw, so packs (select, favourite, filter, delete, random), player cards and preferred roles glide from where they really are, even when a second redraw follows or the whole card moves because something above it changed height; the lobby cards themselves now slide instead of jumping, and the page no longer jumps when the content gets shorter while scrolled to the bottom. The player count text fades softly on every change. Lobby: the preferred-role section and notices now fade in gently when they appear (only then, never twice), and keyboard focus stays on the same role button after the list is redrawn. Dialogs (settings, information, preview) are simpler and more reliable: background and window fade in at the same speed (the window only springs slightly), and closing fades the whole dialog out together; the grow-from-button effect was removed. Dialogs: the window now becomes visible together with the dimmed background when opening, and fades out together with it when closing (before, the screen went dark first and the window arrived late, or vanished before the background). When an old view fades out, the new one no longer fades in as well (it only rises slightly), so there is no dip in brightness.
- Lobby music was too loud for the first 1 to 2 seconds. It now fades in cleanly.
- Pack delete now asks for a second tap ("Sure?") to avoid accidental deletion.
- Translation errors are no longer cached, so a failed translation can be retried.
- Several smaller fixes from a full code review: audio of a stopped video, wake lock handling, name length limit from config, cleanup when leaving a game, keyboard focus in the info dialog, contrast of a text color in the light theme, unused translation keys removed.

## Earlier

- Reconnecting phones (screen lock, signal loss, page reload) and "Rejoin?" prompt.
- Pack preview for the host, pack favorites, random pack and preferred role.
- Dub pack maker with subtitles (Whisper in the browser), background music, and six more interface languages.
