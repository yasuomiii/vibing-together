/* Dub-Pack-Ersteller: baut aus einem Video, Untertiteln (.srt/.vtt) und zwei Tonspuren einen Pack im selben Format wie die
   Community-Packs (siehe js/packs.js). Text und Ton bereitest du vorher mit kostenlosen Webseiten vor (Anleitung und Links
   stehen im Ersteller). Alles Weitere läuft im Browser, nichts wird hochgeladen.

   Entfernen: js/maker.js löschen, die Zeile <script src="js/maker.js"> und den Knopf #btn-maker samt <section id="v-maker"> in index.html
   entfernen (oder in js/config.js maker.enabled auf false setzen). Das Spiel selbst braucht diese Datei nicht. */
(function () {
  const VD = (window.VD = window.VD || {});
  const h = VD.h;
  const t = (k, p) => VD.t(k, p);
  const CFG = (window.VD_CONFIG && window.VD_CONFIG.maker) || {};

  /* Englische Texte. Texte gibt es auf Deutsch, Englisch, Spanisch, Französisch, Portugiesisch, Russisch und Hindi. */
  VD.addLang('en', {
    'Das Video bei vocalremover.org in die Seite hineinziehen (Drag and Drop, siehe Hinweis bei den Links). Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund (Musik und Geräusche).': 'Drag the video into the page at vocalremover.org (drag and drop, see the note at the links). You get two files: voices only and background only (music and noises).',
    'Die Szene als Videodatei bereitlegen (mp4 oder webm, am besten 20 bis 90 Sekunden).': 'Have the scene ready as a video file (mp4 or webm, ideally 20 to 90 seconds).',
    'Trennt Stimmen und Hintergrund in zwei Dateien. Ein mp4-Video lässt sich dort nicht über „Datei wählen“ auswählen, du musst es in die Seite hineinziehen (Drag and Drop).': 'Splits voices and background into two files. An mp4 video cannot be picked there with “Choose file”, you have to drag it into the page (drag and drop).',
    'Erzeugt Untertitel direkt auf deinem Gerät, es wird nichts hochgeladen. Das dauert länger, besonders am Handy. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.': 'Creates subtitles right on your device, nothing is uploaded. It takes longer, especially on a phone. Export as .srt or .vtt. The text can differ from what is spoken.',
    'Erzeugt Untertitel online, du lädst die Datei dort hoch. Die Nutzung ist nur teilweise kostenlos. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.': 'Creates subtitles online, you upload the file there. Only partly free to use. Export as .srt or .vtt. The text can differ from what is spoken.',
    'Läuft im Browser': 'Runs in the browser',
    'Datei wird hochgeladen': 'File is uploaded',
    'Selbst prüfen': 'Check it yourself',
    'Unabhängige Prüfseiten zeigen dir live, ob eine Webseite vertrauenswürdig ist. Tippe bei einer Seite auf einen Namen, dann siehst du dort die aktuelle Einschätzung zu genau dieser Adresse.': 'Independent checking sites show you live whether a website is trustworthy. Tap a name under a site and you see the current rating for exactly that address.',
    'Bewertungen von echten Nutzern.': 'Reviews from real users.',
    'Prüft Betrugs-Anzeichen und Alter der Seite.': 'Checks signs of fraud and the age of the site.',
    'Googles Liste gefährlicher Seiten.': 'Google’s list of dangerous sites.',
    'Fragt viele Virenscanner auf einmal.': 'Asks many virus scanners at once.',
    'Alles läuft über Webseiten, du musst nichts installieren. Du bereitest Text und Ton dort vor und lädst es hier hoch. Daraus wird ein Dub-Pack.': 'Everything runs on websites, you install nothing. You prepare text and sound there and load it here. It becomes a dub pack.',
    'Webseiten für die Vorbereitung': 'Websites for preparing',
    'Alles im Browser, ohne Programm zum Herunterladen. Tippe oben rechts auf das i, dort steht, worauf du achten solltest.': 'All in the browser, no program to download. Tap the i at the top right to see what to watch out for.',
    'Die Tondatei bei einer Stimmentrenner-Seite hochladen. Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund (Musik und Geräusche).': 'Upload the audio file to a stem splitter site. You get two files: voices only and background only (music and noises).',
    'Bei einer Untertitel-Seite die Datei laden, Untertitel erzeugen lassen und als .srt- oder .vtt-Datei herunterladen. Der erkannte Text kann teilweise falsch sein, du musst ihn danach hier selbst korrigieren.': 'Load the file on a subtitle site, have subtitles generated and download them as an .srt or .vtt file. The recognised text can be partly wrong, so you have to correct it yourself here afterwards.',
    'Dienste ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.': 'Services change. Check for yourself whether they are still free and what happens to your files. Only use material you are allowed to use.',
    'Trennt Stimmen und Hintergrund in zwei Dateien. Ein mp4-Video lässt sich dort nicht über „Datei wählen“ auswählen, du musst es in die Seite hineinziehen (Drag and Drop).': 'Splits voices and background into two files.',
    'Erzeugt Untertitel automatisch, Download als .srt. Die kostenlose Version ist begrenzt.': 'Creates subtitles automatically, download as .srt. The free version is limited.',
    'Ebenfalls automatische Untertitel mit .srt-Download. Auch hier ist die kostenlose Version begrenzt.': 'Also automatic subtitles with .srt download. The free version is limited here too.',
    'Du lädst dort dein Video hoch und bekommst nur den Ton als mp3-Datei zurück. Oder du änderst das Dateiformat des Videos, wenn es hier nicht abgespielt wird. Pro Tag sind nur einige Umwandlungen kostenlos.': 'You upload your video there and get just the sound back as an mp3 file. Or you change the video’s file format if it does not play here. Only a few conversions per day are free.',
    'Quellen und Sicherheit': 'Sources and safety',
    'Das sind alle Seiten, auf die der Ersteller verweist. Jede Adresse steht genau so da, es gibt keine Umleitung.': 'These are all the sites the creator points to. Each address is shown exactly as it is, there is no redirect.',
    'Stimmen und Hintergrund trennen': 'Split voices and background',
    'YouTube-Video als mp4': 'YouTube video as mp4',
    'Wandelt ein YouTube-Video in eine mp4-Datei um.': 'Turns a YouTube video into an mp4 file.',
    'Die Szene als Videodatei bereitlegen (mp4 oder webm, am besten 20 bis 90 Sekunden). Bei einem YouTube-Video hilft notube.cc bei den Links.': 'Have the scene ready as a video file (mp4 or webm, ideally 20 to 90 seconds). For a YouTube video, notube.cc in the links helps.',
    'Untertitel erzeugen': 'Create subtitles',
    'Video und Ton umwandeln': 'Convert video and sound',
    'Ehrlich gesagt:': 'To be honest:',
    'Ich kann nicht garantieren, dass diese Seiten sicher sind oder es bleiben. Ich konnte sie nicht prüfen, es sind bekannte Anbieter.': 'I cannot guarantee that these sites are or will stay safe. I could not check them, they are well-known providers.',
    'Auf diesen Seiten werden deine Dateien hochgeladen. Hier im Spiel bleibt alles auf deinem Gerät.': 'Your files are uploaded to those sites. Here in the game everything stays on your device.',
    'Lade dort nichts herunter außer deinen fertigen Dateien (mp3, wav, mp4, srt). Installiere nichts und bezahle nichts.': 'Download nothing there except your finished files (mp3, wav, mp4, srt). Install nothing and pay for nothing.',
    'Schau in der Adresszeile nach, dass wirklich die oben genannte Adresse mit https dasteht.': 'Check the address bar to see that the address listed above really shows, with https.',
    'Nutze dort kein Passwort, das du woanders brauchst.': 'Do not use a password there that you need elsewhere.',
    'Schließen': 'Close',
    'So geht es': 'How it works',
    'Du bereitest Text und Ton mit kostenlosen Seiten und Programmen vor und lädst alles hier hoch. Daraus wird ein Dub-Pack.': 'You prepare text and sound with free sites and programs and load everything here. It becomes a dub pack.',
    'Anleitung zeigen': 'Show instructions',
    'Links zeigen': 'Show links',
    'Kostenlose Seiten und Programme': 'Free sites and programs',
    'Alles, was du für die Vorbereitung brauchst. Die Links führen auf die Seiten der Anbieter.': 'Everything you need to prepare. The links go to the providers’ own sites.',
    'Die Szene als Videodatei bereitlegen (mp4 oder webm, am besten 20 bis 90 Sekunden). Passt das Format nicht, wandle es mit HandBrake oder einem Online-Konverter um.': 'Have the scene ready as a video file (mp4 or webm, ideally 20 to 90 seconds). If the format does not fit, convert it with HandBrake or an online converter.',
    'Den Ton der Szene als Audiodatei herausziehen (mp3 oder wav), zum Beispiel mit VLC, Audacity oder einem Online-Konverter.': 'Extract the scene’s sound as an audio file (mp3 or wav), for example with VLC, Audacity or an online converter.',
    'Die Tondatei in einen Stimmentrenner geben. Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund (Musik und Geräusche).': 'Put the audio file into a stem splitter. You get two files: voices only and background only (music and noises).',
    'Untertitel erzeugen lassen und als .srt-Datei speichern. Die Zeiten dürfen danach hier noch korrigiert werden.': 'Have subtitles generated and save them as an .srt file. You can still fix the times here afterwards.',
    'Hier das Video laden, die .srt-Datei importieren, die Stimmenspur und die Hintergrundspur laden, Charaktere vergeben und den Pack bauen.': 'Load the video here, import the .srt file, load the voices file and the background file, assign characters and build the pack.',
    'Alle Dateien müssen gleich lang sein und im selben Moment beginnen wie das Video.': 'All files must be the same length and start at the same moment as the video.',
    'Stimmen und Hintergrund trennen': 'Split voices and background',
    'Untertitel erzeugen': 'Create subtitles',
    'Ton aus dem Video holen oder Video-Format ändern': 'Get the sound out of a video or change the video format',
    'Seite im Browser, ohne Installation. Gibt Stimmen und Hintergrund als zwei Dateien.': 'Site in the browser, no install. Gives voices and background as two files.',
    'Programm für den PC, kostenlos und meist besser. Zum Download dort auf „Releases“ gehen.': 'Program for your PC, free and usually better. For the download, go to “Releases” there.',
    'Programm für den PC, erkennt Sprache und speichert als .srt.': 'Program for your PC, recognises speech and saves as .srt.',
    'Programm für Windows. Erkennt Sprache und lässt Untertitel von Hand verbessern.': 'Program for Windows. Recognises speech and lets you fix subtitles by hand.',
    'Spielt fast alles ab und wandelt unter „Konvertieren“ in mp3 oder mp4 um.': 'Plays almost anything and converts to mp3 or mp4 under “Convert”.',
    'Schneidet und speichert Ton als wav oder mp3.': 'Cuts and saves sound as wav or mp3.',
    'Wandelt Videos in mp4 um.': 'Converts videos to mp4.',
    'Falls ein Link nicht mehr geht, suche den Namen im Netz.': 'If a link no longer works, search for the name.',
    'Noch keine Zeilen. Importiere eine Untertitel-Datei oder füge Zeilen von Hand hinzu.': 'No lines yet. Import a subtitle file or add lines by hand.',
    'Dub-Pack erstellen': 'Create a dub pack',
    'Zurück': 'Back',
    'Baue aus einem Video deinen eigenen Dub-Pack. Alles bleibt auf deinem Gerät.': 'Turn a video into your own dub pack. Everything stays on your device.',
    'Weg 1: Alles im Browser': 'Way 1: Everything in the browser',
    'Einfach und privat, aber langsamer und weniger genau. Am PC empfohlen.': 'Simple and private, but slower and less accurate. Recommended on a PC.',
    'Weg 2: Mit externen Seiten': 'Way 2: With outside sites',
    'Schneller und meist besser. Du bereitest Text und Ton selbst vor und lädst sie hier hoch.': 'Faster and usually better. You prepare text and audio yourself and load them here.',
    'So geht Weg 1': 'How Way 1 works',
    'So geht Weg 2': 'How Way 2 works',
    'Video wählen: am besten eine kurze Szene (20 bis 90 Sekunden) als mp4 oder webm.': 'Pick a video: ideally a short scene (20 to 90 seconds) as mp4 or webm.',
    'Bei „Zeilen“ auf „Automatisch erkennen“ drücken. Beim ersten Mal lädt der Browser ein Modell (40 bis 250 MB, danach gespeichert). Das dauert, besonders am Handy.': 'Under “Lines” press “Detect automatically”. The first time, the browser downloads a model (40 to 250 MB, saved afterwards). This takes a while, especially on a phone.',
    'Text und Zeiten prüfen und korrigieren. Mit ▶ hörst du jede Zeile an.': 'Check and fix the text and times. Use ▶ to listen to each line.',
    'Jeder Zeile einen Charakter geben.': 'Give each line a character.',
    'Beim Hintergrund bleibt „Original ohne Sprechstellen“. Die Stimmen werden hier nicht per KI entfernt, sondern an den Sprechstellen stummgeschaltet. Dort fehlt dann auch die Musik.': 'For the background, keep “Original without speech”. Voices are not removed by AI here, they are muted where people speak. Music is missing there too.',
    'Pack bauen und entweder gleich im Spiel verwenden oder als ZIP speichern.': 'Build the pack and either use it in the game right away or save it as a ZIP.',
    'Die Szene als Videodatei bereitlegen (mp4 oder webm).': 'Have the scene ready as a video file (mp4 or webm).',
    'Den Ton der Szene als Audiodatei herausziehen (zum Beispiel mit VLC oder Audacity) und in einen Stimmentrenner geben. Das ist ein Programm oder eine Seite, die Stimmen und Musik trennt, zum Beispiel Ultimate Vocal Remover (läuft kostenlos auf deinem PC) oder ein Online-Vocal-Remover. Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund.': 'Extract the sound of the scene as an audio file (for example with VLC or Audacity) and put it into a stem splitter. That is a program or site that separates voices from music, for example Ultimate Vocal Remover (free, runs on your PC) or an online vocal remover. You get two files: voices only and background only.',
    'Untertitel erzeugen lassen, zum Beispiel mit einem Whisper-Programm wie Buzz (kostenlos, läuft auf deinem PC) oder Subtitle Edit. Ergebnis: eine .srt-Datei.': 'Have subtitles generated, for example with a Whisper program such as Buzz (free, runs on your PC) or Subtitle Edit. Result: an .srt file.',
    'Hier das Video laden, bei „Zeilen“ die .srt-Datei importieren, bei „Ton“ Stimmenspur und Hintergrundspur laden.': 'Load the video here, import the .srt file under “Lines”, and load the voices file and background file under “Sound”.',
    'Dienste und Programme ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.': 'Services and programs change. Check for yourself whether they are still free and what happens to your files. Only use material you are allowed to use.',
    '1  Video': '1  Video',
    'Videodatei wählen': 'Choose video file',
    'Dein Browser muss das Video abspielen können (mp4 oder webm). Das Video wird unverändert in den Pack gelegt, am besten unter 100 MB.': 'Your browser must be able to play the video (mp4 or webm). The video goes into the pack unchanged, ideally under 100 MB.',
    'Titel des Packs': 'Pack title',
    'Dein Name (optional)': 'Your name (optional)',
    'Dauer {d} s': 'Length {d} s',
    'Ton wird gelesen …': 'Reading the sound …',
    'Der Browser kann den Ton dieses Videos nicht lesen. Lade bei „Ton“ eine eigene Stimmenspur.': 'The browser cannot read this video’s sound. Load your own voices file under “Sound”.',
    'Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.': 'The browser cannot play this video. Use mp4 (H.264) or webm.',
    '2  Zeilen': '2  Lines',
    'Jede Zeile ist ein Satz, den die Spieler einsprechen. Start und Ende in Sekunden.': 'Each line is a sentence the players will record. Start and end in seconds.',
    'Automatisch erkennen': 'Detect automatically',
    'Vorhandene Zeilen ersetzen?': 'Replace existing lines?',
    'Genauigkeit': 'Accuracy',
    'Schnell, ca. 40 MB': 'Fast, about 40 MB',
    'Ausgewogen, ca. 80 MB': 'Balanced, about 80 MB',
    'Genau, ca. 250 MB, langsam': 'Accurate, about 250 MB, slow',
    'Sprache im Video': 'Language in the video',
    'Automatisch': 'Automatic',
    'Untertitel importieren (.srt, .vtt)': 'Import subtitles (.srt, .vtt)',
    'Zeile bei {s} s hinzufügen': 'Add line at {s} s',
    'Nach Zeit sortieren': 'Sort by time',
    'Noch keine Zeilen. Importiere eine Untertitel-Datei oder füge Zeilen von Hand hinzu.': 'No lines yet. Detect them automatically, import subtitles or add them by hand.',
    'Lade Modell … {p} %': 'Loading model … {p} %',
    'Erkenne Sprache … das kann einige Minuten dauern.': 'Recognising speech … this can take a few minutes.',
    'Bereite Ton vor …': 'Preparing the sound …',
    'Erkennung fehlgeschlagen: {e}': 'Detection failed: {e}',
    'Die Texterkennung braucht Internet für das Modell und darf Dateien von cdn.jsdelivr.net und huggingface.co laden.': 'Speech detection needs the internet for the model and may load files from cdn.jsdelivr.net and huggingface.co.',
    '{n} Zeilen erkannt. Bitte prüfen.': '{n} lines detected. Please check them.',
    '{n} Zeilen importiert.': '{n} lines imported.',
    'In der Datei wurden keine Zeilen gefunden.': 'No lines were found in the file.',
    'Zeile anhören': 'Listen to line',
    'Zeile löschen': 'Delete line',
    'Start': 'Start',
    'Ende': 'End',
    'Text': 'Text',
    'Charakter': 'Character',
    'Auf die aktuelle Position im Video setzen': 'Set to the current video position',
    '3  Charaktere': '3  Characters',
    'So heißen die Rollen im Spiel. Jede Zeile gehört zu einem Charakter.': 'These are the roles in the game. Each line belongs to one character.',
    'Charakter hinzufügen': 'Add character',
    'Zeilen abwechselnd verteilen': 'Share lines out in turn',
    'Charakter entfernen': 'Remove character',
    'Sprecher {n}': 'Speaker {n}',
    '4  Ton': '4  Sound',
    'Stimmen der Zeilen': 'Voices of the lines',
    'Aus dem Video': 'From the video',
    'Eigene Stimmenspur': 'My own voices file',
    'Hintergrund (Musik und Geräusche)': 'Background (music and noises)',
    'Original ohne Sprechstellen': 'Original without speech',
    'Eigene Hintergrundspur': 'My own background file',
    'Keiner': 'None',
    'Das Original wird an den Stellen stummgeschaltet, an denen gesprochen wird. Dort fehlt auch die Musik. Mit einer eigenen Hintergrundspur klingt es besser.': 'The original is muted wherever people speak. Music is missing there too. A background file of your own sounds better.',
    'Die Szene hat dann nur die Stimmen der Spieler.': 'The scene then has only the players’ voices.',
    'Nur Stimmen, ohne Musik. Dann sind die Original-Zeilen sauberer. Die Datei muss gleich lang sein wie das Video und gleich beginnen.': 'Voices only, no music. The original lines are cleaner then. The file must be as long as the video and start at the same moment.',
    'Nur Musik und Geräusche, ohne Stimmen. Die Datei muss gleich lang sein wie das Video und gleich beginnen.': 'Music and noises only, no voices. The file must be as long as the video and start at the same moment.',
    'Audiodatei wählen': 'Choose audio file',
    'Datei kann nicht gelesen werden: {n}': 'Cannot read the file: {n}',
    '5  Pack': '5  Pack',
    'Pack bauen': 'Build pack',
    'Im Spiel verwenden': 'Use in the game',
    'ZIP speichern': 'Save ZIP',
    'Der Pack ist fertig. Du kannst ihn gleich im Spiel verwenden oder als ZIP speichern.': 'The pack is ready. You can use it in the game right away or save it as a ZIP.',
    'Der Pack liegt jetzt in deiner Pack-Liste. Erstelle einen Raum, dann kannst du ihn auswählen.': 'The pack is now in your pack list. Create a room and you can pick it.',
    'Bitte zuerst ein Video wählen.': 'Please choose a video first.',
    'Es gibt noch keine Zeilen.': 'There are no lines yet.',
    'Zeile {n}: Das Ende muss nach dem Start liegen.': 'Line {n}: the end must be after the start.',
    'Zeile {n}: Der Start liegt hinter dem Ende des Videos.': 'Line {n}: the start is after the end of the video.',
    'Zeile {n}: Bitte einen Text eintragen.': 'Line {n}: please enter a text.',
    'Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.': 'No sound available. Load a voices file under “Sound”.',
    'Baue Zeile {n}/{total} …': 'Building line {n}/{total} …',
    'Baue Hintergrund …': 'Building the background …',
    'Packe alles zusammen … {p} %': 'Packing everything … {p} %',
    'Bau fehlgeschlagen: {e}': 'Build failed: {e}',
    'Das Video hat ein Format, das der Pack nicht kennt (mp4, webm).': 'The video has a format the pack does not know (mp4, webm).'
  });

  /* Weitere Sprachen für den Ersteller */
  VD.addLang('es', {
 "Das Video bei vocalremover.org in die Seite hineinziehen (Drag and Drop, siehe Hinweis bei den Links). Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund (Musik und Geräusche).": "Arrastra el vídeo a la página de vocalremover.org (arrastrar y soltar, mira la nota en los enlaces). Obtienes dos archivos: solo voces y solo fondo (música y ruidos).",
 "Trennt Stimmen und Hintergrund in zwei Dateien. Ein mp4-Video lässt sich dort nicht über „Datei wählen“ auswählen, du musst es in die Seite hineinziehen (Drag and Drop).": "Separa voces y fondo en dos archivos. Un vídeo mp4 no se puede elegir allí con «Elegir archivo»; tienes que arrastrarlo a la página (arrastrar y soltar).",
 "Erzeugt Untertitel direkt auf deinem Gerät, es wird nichts hochgeladen. Das dauert länger, besonders am Handy. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "Crea subtítulos directamente en tu dispositivo, no se sube nada. Tarda más, sobre todo en el móvil. Exporta como .srt o .vtt. El texto puede diferir de lo hablado.",
 "Erzeugt Untertitel online, du lädst die Datei dort hoch. Die Nutzung ist nur teilweise kostenlos. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "Crea subtítulos en línea, tú subes allí el archivo. El uso solo es gratuito en parte. Exporta como .srt o .vtt. El texto puede diferir de lo hablado.",
 "Läuft im Browser": "Funciona en el navegador",
 "Datei wird hochgeladen": "El archivo se sube",
 "Selbst prüfen": "Compruébalo tú mismo",
 "Unabhängige Prüfseiten zeigen dir live, ob eine Webseite vertrauenswürdig ist. Tippe bei einer Seite auf einen Namen, dann siehst du dort die aktuelle Einschätzung zu genau dieser Adresse.": "Sitios de comprobación independientes te muestran en directo si una página web es de fiar. Toca un nombre bajo una página y verás la valoración actual de esa dirección exacta.",
 "Bewertungen von echten Nutzern.": "Opiniones de usuarios reales.",
 "Prüft Betrugs-Anzeichen und Alter der Seite.": "Comprueba señales de fraude y la antigüedad de la página.",
 "Googles Liste gefährlicher Seiten.": "La lista de Google de páginas peligrosas.",
 "Fragt viele Virenscanner auf einmal.": "Consulta muchos antivirus a la vez.",
 "Alles läuft über Webseiten, du musst nichts installieren. Du bereitest Text und Ton dort vor und lädst es hier hoch. Daraus wird ein Dub-Pack.": "Todo funciona con páginas web, no tienes que instalar nada. Preparas allí el texto y el sonido y lo subes aquí. Con ello se crea un pack de doblaje.",
 "Webseiten für die Vorbereitung": "Páginas web para la preparación",
 "Alles im Browser, ohne Programm zum Herunterladen. Tippe oben rechts auf das i, dort steht, worauf du achten solltest.": "Todo en el navegador, sin programas que descargar. Toca la i arriba a la derecha para ver a qué debes prestar atención.",
 "Bei einer Untertitel-Seite die Datei laden, Untertitel erzeugen lassen und als .srt- oder .vtt-Datei herunterladen. Der erkannte Text kann teilweise falsch sein, du musst ihn danach hier selbst korrigieren.": "En un sitio de subtítulos, carga el archivo, deja que genere los subtítulos y descárgalos como archivo .srt o .vtt. El texto reconocido puede ser en parte incorrecto; después tienes que corregirlo tú aquí.",
 "Dienste ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.": "Los servicios cambian. Comprueba tú mismo si siguen siendo gratis y qué pasa con tus archivos. Usa solo material que puedas usar.",
 "Quellen und Sicherheit": "Fuentes y seguridad",
 "Stimmen und Hintergrund trennen": "Separar voces y fondo",
 "YouTube-Video als mp4": "Vídeo de YouTube como mp4",
 "Wandelt ein YouTube-Video in eine mp4-Datei um.": "Convierte un vídeo de YouTube en un archivo mp4.",
 "Die Szene als Videodatei bereitlegen (mp4 oder webm, am besten 20 bis 90 Sekunden). Bei einem YouTube-Video hilft notube.cc bei den Links.": "Ten la escena lista como archivo de vídeo (mp4 o webm, lo mejor es de 20 a 90 segundos). Para un vídeo de YouTube te ayuda notube.cc en los enlaces.",
 "Untertitel erzeugen": "Crear subtítulos",
 "Schließen": "Cerrar",
 "So geht es": "Así funciona",
 "Anleitung zeigen": "Mostrar instrucciones",
 "Links zeigen": "Mostrar enlaces",
 "Hier das Video laden, die .srt-Datei importieren, die Stimmenspur und die Hintergrundspur laden, Charaktere vergeben und den Pack bauen.": "Carga aquí el vídeo, importa el archivo .srt, carga la pista de voces y la pista de fondo, asigna personajes y crea el pack.",
 "Alle Dateien müssen gleich lang sein und im selben Moment beginnen wie das Video.": "Todos los archivos deben durar lo mismo y empezar en el mismo momento que el vídeo.",
 "Falls ein Link nicht mehr geht, suche den Namen im Netz.": "Si un enlace ya no funciona, busca el nombre en internet.",
 "Noch keine Zeilen. Importiere eine Untertitel-Datei oder füge Zeilen von Hand hinzu.": "Aún no hay líneas. Importa un archivo de subtítulos o añade líneas a mano.",
 "Dub-Pack erstellen": "Crear pack de doblaje",
 "Zurück": "Atrás",
 "Baue aus einem Video deinen eigenen Dub-Pack. Alles bleibt auf deinem Gerät.": "Crea tu propio pack de doblaje a partir de un vídeo. Todo se queda en tu dispositivo.",
 "1  Video": "1  Vídeo",
 "Videodatei wählen": "Elegir archivo de vídeo",
 "Dein Browser muss das Video abspielen können (mp4 oder webm). Das Video wird unverändert in den Pack gelegt, am besten unter 100 MB.": "Tu navegador debe poder reproducir el vídeo (mp4 o webm). El vídeo se guarda sin cambios en el pack, mejor si pesa menos de 100 MB.",
 "Titel des Packs": "Título del pack",
 "Dein Name (optional)": "Tu nombre (opcional)",
 "Dauer {d} s": "Duración {d} s",
 "Ton wird gelesen …": "Leyendo el sonido …",
 "Der Browser kann den Ton dieses Videos nicht lesen. Lade bei „Ton“ eine eigene Stimmenspur.": "El navegador no puede leer el sonido de este vídeo. En «Sonido» carga una pista de voces propia.",
 "Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.": "El navegador no puede reproducir este vídeo. Usa mp4 (H.264) o webm.",
 "2  Zeilen": "2  Líneas",
 "Jede Zeile ist ein Satz, den die Spieler einsprechen. Start und Ende in Sekunden.": "Cada línea es una frase que grabarán los jugadores. Inicio y fin en segundos.",
 "Untertitel importieren (.srt, .vtt)": "Importar subtítulos (.srt, .vtt)",
 "Zeile bei {s} s hinzufügen": "Añadir línea en {s} s",
 "Nach Zeit sortieren": "Ordenar por tiempo",
 "{n} Zeilen importiert.": "{n} líneas importadas.",
 "In der Datei wurden keine Zeilen gefunden.": "No se encontraron líneas en el archivo.",
 "Zeile anhören": "Escuchar línea",
 "Zeile löschen": "Borrar línea",
 "Start": "Inicio",
 "Ende": "Fin",
 "Text": "Texto",
 "Charakter": "Personaje",
 "Auf die aktuelle Position im Video setzen": "Poner en la posición actual del vídeo",
 "3  Charaktere": "3  Personajes",
 "So heißen die Rollen im Spiel. Jede Zeile gehört zu einem Charakter.": "Así se llaman los papeles en el juego. Cada línea pertenece a un personaje.",
 "Charakter hinzufügen": "Añadir personaje",
 "Zeilen abwechselnd verteilen": "Repartir las líneas por turnos",
 "Charakter entfernen": "Quitar personaje",
 "Sprecher {n}": "Hablante {n}",
 "4  Ton": "4  Sonido",
 "Stimmen der Zeilen": "Voces de las líneas",
 "Aus dem Video": "Del vídeo",
 "Eigene Stimmenspur": "Pista de voces propia",
 "Hintergrund (Musik und Geräusche)": "Fondo (música y ruidos)",
 "Original ohne Sprechstellen": "Original sin partes habladas",
 "Eigene Hintergrundspur": "Pista de fondo propia",
 "Keiner": "Ninguno",
 "Das Original wird an den Stellen stummgeschaltet, an denen gesprochen wird. Dort fehlt auch die Musik. Mit einer eigenen Hintergrundspur klingt es besser.": "El original se silencia donde se habla. Allí también falta la música. Con una pista de fondo propia suena mejor.",
 "Die Szene hat dann nur die Stimmen der Spieler.": "Entonces la escena solo tiene las voces de los jugadores.",
 "Nur Stimmen, ohne Musik. Dann sind die Original-Zeilen sauberer. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "Solo voces, sin música. Así las líneas originales quedan más limpias. El archivo debe durar lo mismo que el vídeo y empezar igual.",
 "Nur Musik und Geräusche, ohne Stimmen. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "Solo música y ruidos, sin voces. El archivo debe durar lo mismo que el vídeo y empezar igual.",
 "Audiodatei wählen": "Elegir archivo de audio",
 "Datei kann nicht gelesen werden: {n}": "No se puede leer el archivo: {n}",
 "5  Pack": "5  Pack",
 "Pack bauen": "Crear pack",
 "Im Spiel verwenden": "Usar en el juego",
 "ZIP speichern": "Guardar ZIP",
 "Der Pack ist fertig. Du kannst ihn gleich im Spiel verwenden oder als ZIP speichern.": "El pack está listo. Puedes usarlo enseguida en el juego o guardarlo como ZIP.",
 "Der Pack liegt jetzt in deiner Pack-Liste. Erstelle einen Raum, dann kannst du ihn auswählen.": "El pack ya está en tu lista de packs. Crea una sala y podrás elegirlo.",
 "Bitte zuerst ein Video wählen.": "Elige primero un vídeo.",
 "Es gibt noch keine Zeilen.": "Todavía no hay líneas.",
 "Zeile {n}: Das Ende muss nach dem Start liegen.": "Línea {n}: el final debe ir después del inicio.",
 "Zeile {n}: Der Start liegt hinter dem Ende des Videos.": "Línea {n}: el inicio queda después del final del vídeo.",
 "Zeile {n}: Bitte einen Text eintragen.": "Línea {n}: escribe un texto.",
 "Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.": "No hay sonido. En «Sonido» carga una pista de voces.",
 "Baue Zeile {n}/{total} …": "Creando línea {n}/{total} …",
 "Baue Hintergrund …": "Creando el fondo …",
 "Packe alles zusammen … {p} %": "Empaquetando todo … {p} %",
 "Bau fehlgeschlagen: {e}": "Error al crear: {e}",
 "Das Video hat ein Format, das der Pack nicht kennt (mp4, webm).": "El vídeo tiene un formato que el pack no conoce (mp4, webm)."
});
  VD.addLang('fr', {
 "Das Video bei vocalremover.org in die Seite hineinziehen (Drag and Drop, siehe Hinweis bei den Links). Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund (Musik und Geräusche).": "Faites glisser la vidéo dans la page de vocalremover.org (glisser-déposer, voir la remarque près des liens). Vous obtenez deux fichiers : voix seules et fond seul (musique et bruits).",
 "Trennt Stimmen und Hintergrund in zwei Dateien. Ein mp4-Video lässt sich dort nicht über „Datei wählen“ auswählen, du musst es in die Seite hineinziehen (Drag and Drop).": "Sépare les voix et le fond en deux fichiers. Une vidéo mp4 ne peut pas y être choisie avec « Choisir un fichier » ; il faut la faire glisser dans la page (glisser-déposer).",
 "Erzeugt Untertitel direkt auf deinem Gerät, es wird nichts hochgeladen. Das dauert länger, besonders am Handy. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "Crée des sous-titres directement sur votre appareil, rien n’est envoyé. C’est plus long, surtout sur mobile. Export en .srt ou .vtt. Le texte peut différer de ce qui est dit.",
 "Erzeugt Untertitel online, du lädst die Datei dort hoch. Die Nutzung ist nur teilweise kostenlos. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "Crée des sous-titres en ligne, vous y envoyez le fichier. L’utilisation n’est que partiellement gratuite. Export en .srt ou .vtt. Le texte peut différer de ce qui est dit.",
 "Läuft im Browser": "Fonctionne dans le navigateur",
 "Datei wird hochgeladen": "Le fichier est envoyé",
 "Selbst prüfen": "Vérifiez vous-même",
 "Unabhängige Prüfseiten zeigen dir live, ob eine Webseite vertrauenswürdig ist. Tippe bei einer Seite auf einen Namen, dann siehst du dort die aktuelle Einschätzung zu genau dieser Adresse.": "Des sites de vérification indépendants montrent en direct si un site web est digne de confiance. Touchez un nom sous un site pour voir l’évaluation actuelle de cette adresse précise.",
 "Bewertungen von echten Nutzern.": "Avis d’utilisateurs réels.",
 "Prüft Betrugs-Anzeichen und Alter der Seite.": "Vérifie les signes de fraude et l’ancienneté du site.",
 "Googles Liste gefährlicher Seiten.": "La liste de Google des sites dangereux.",
 "Fragt viele Virenscanner auf einmal.": "Interroge de nombreux antivirus à la fois.",
 "Alles läuft über Webseiten, du musst nichts installieren. Du bereitest Text und Ton dort vor und lädst es hier hoch. Daraus wird ein Dub-Pack.": "Tout passe par des sites web, vous n’avez rien à installer. Vous y préparez le texte et le son, puis vous les chargez ici. Cela devient un pack de doublage.",
 "Webseiten für die Vorbereitung": "Sites web pour la préparation",
 "Alles im Browser, ohne Programm zum Herunterladen. Tippe oben rechts auf das i, dort steht, worauf du achten solltest.": "Tout dans le navigateur, sans programme à télécharger. Touchez le i en haut à droite pour voir à quoi faire attention.",
 "Bei einer Untertitel-Seite die Datei laden, Untertitel erzeugen lassen und als .srt- oder .vtt-Datei herunterladen. Der erkannte Text kann teilweise falsch sein, du musst ihn danach hier selbst korrigieren.": "Sur un site de sous-titres, chargez le fichier, faites générer les sous-titres et téléchargez-les en fichier .srt ou .vtt. Le texte reconnu peut être en partie faux, vous devez ensuite le corriger vous-même ici.",
 "Dienste ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.": "Les services changent. Vérifiez vous-même s’ils sont toujours gratuits et ce qu’il advient de vos fichiers. N’utilisez que du matériel que vous avez le droit d’utiliser.",
 "Quellen und Sicherheit": "Sources et sécurité",
 "Stimmen und Hintergrund trennen": "Séparer voix et fond",
 "YouTube-Video als mp4": "Vidéo YouTube en mp4",
 "Wandelt ein YouTube-Video in eine mp4-Datei um.": "Convertit une vidéo YouTube en fichier mp4.",
 "Die Szene als Videodatei bereitlegen (mp4 oder webm, am besten 20 bis 90 Sekunden). Bei einem YouTube-Video hilft notube.cc bei den Links.": "Préparez la scène sous forme de fichier vidéo (mp4 ou webm, de préférence 20 à 90 secondes). Pour une vidéo YouTube, notube.cc dans les liens peut aider.",
 "Untertitel erzeugen": "Créer des sous-titres",
 "Schließen": "Fermer",
 "So geht es": "Comment ça marche",
 "Anleitung zeigen": "Afficher les instructions",
 "Links zeigen": "Afficher les liens",
 "Hier das Video laden, die .srt-Datei importieren, die Stimmenspur und die Hintergrundspur laden, Charaktere vergeben und den Pack bauen.": "Chargez ici la vidéo, importez le fichier .srt, chargez la piste de voix et la piste de fond, attribuez les personnages et créez le pack.",
 "Alle Dateien müssen gleich lang sein und im selben Moment beginnen wie das Video.": "Tous les fichiers doivent avoir la même durée et commencer au même moment que la vidéo.",
 "Falls ein Link nicht mehr geht, suche den Namen im Netz.": "Si un lien ne fonctionne plus, cherchez le nom sur le web.",
 "Noch keine Zeilen. Importiere eine Untertitel-Datei oder füge Zeilen von Hand hinzu.": "Pas encore de lignes. Importez un fichier de sous-titres ou ajoutez des lignes à la main.",
 "Dub-Pack erstellen": "Créer un pack de doublage",
 "Zurück": "Retour",
 "Baue aus einem Video deinen eigenen Dub-Pack. Alles bleibt auf deinem Gerät.": "Créez votre propre pack de doublage à partir d’une vidéo. Tout reste sur votre appareil.",
 "1  Video": "1  Vidéo",
 "Videodatei wählen": "Choisir un fichier vidéo",
 "Dein Browser muss das Video abspielen können (mp4 oder webm). Das Video wird unverändert in den Pack gelegt, am besten unter 100 MB.": "Votre navigateur doit pouvoir lire la vidéo (mp4 ou webm). La vidéo est placée telle quelle dans le pack, de préférence moins de 100 Mo.",
 "Titel des Packs": "Titre du pack",
 "Dein Name (optional)": "Votre nom (facultatif)",
 "Dauer {d} s": "Durée {d} s",
 "Ton wird gelesen …": "Lecture du son …",
 "Der Browser kann den Ton dieses Videos nicht lesen. Lade bei „Ton“ eine eigene Stimmenspur.": "Le navigateur ne peut pas lire le son de cette vidéo. Sous « Son », chargez votre propre piste de voix.",
 "Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.": "Le navigateur ne peut pas lire cette vidéo. Utilisez mp4 (H.264) ou webm.",
 "2  Zeilen": "2  Lignes",
 "Jede Zeile ist ein Satz, den die Spieler einsprechen. Start und Ende in Sekunden.": "Chaque ligne est une phrase que les joueurs vont enregistrer. Début et fin en secondes.",
 "Untertitel importieren (.srt, .vtt)": "Importer des sous-titres (.srt, .vtt)",
 "Zeile bei {s} s hinzufügen": "Ajouter une ligne à {s} s",
 "Nach Zeit sortieren": "Trier par temps",
 "{n} Zeilen importiert.": "{n} lignes importées.",
 "In der Datei wurden keine Zeilen gefunden.": "Aucune ligne n’a été trouvée dans le fichier.",
 "Zeile anhören": "Écouter la ligne",
 "Zeile löschen": "Supprimer la ligne",
 "Start": "Début",
 "Ende": "Fin",
 "Text": "Texte",
 "Charakter": "Personnage",
 "Auf die aktuelle Position im Video setzen": "Mettre sur la position actuelle de la vidéo",
 "3  Charaktere": "3  Personnages",
 "So heißen die Rollen im Spiel. Jede Zeile gehört zu einem Charakter.": "Ce sont les noms des rôles dans le jeu. Chaque ligne appartient à un personnage.",
 "Charakter hinzufügen": "Ajouter un personnage",
 "Zeilen abwechselnd verteilen": "Répartir les lignes à tour de rôle",
 "Charakter entfernen": "Retirer le personnage",
 "Sprecher {n}": "Intervenant {n}",
 "4  Ton": "4  Son",
 "Stimmen der Zeilen": "Voix des lignes",
 "Aus dem Video": "De la vidéo",
 "Eigene Stimmenspur": "Ma propre piste de voix",
 "Hintergrund (Musik und Geräusche)": "Fond (musique et bruits)",
 "Original ohne Sprechstellen": "Original sans passages parlés",
 "Eigene Hintergrundspur": "Ma propre piste de fond",
 "Keiner": "Aucun",
 "Das Original wird an den Stellen stummgeschaltet, an denen gesprochen wird. Dort fehlt auch die Musik. Mit einer eigenen Hintergrundspur klingt es besser.": "L’original est coupé là où l’on parle. La musique manque aussi à ces endroits. Avec votre propre piste de fond, le rendu est meilleur.",
 "Die Szene hat dann nur die Stimmen der Spieler.": "La scène n’aura alors que les voix des joueurs.",
 "Nur Stimmen, ohne Musik. Dann sind die Original-Zeilen sauberer. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "Voix seules, sans musique. Les lignes d’origine sont alors plus propres. Le fichier doit avoir la même durée que la vidéo et commencer au même moment.",
 "Nur Musik und Geräusche, ohne Stimmen. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "Musique et bruits seulement, sans voix. Le fichier doit avoir la même durée que la vidéo et commencer au même moment.",
 "Audiodatei wählen": "Choisir un fichier audio",
 "Datei kann nicht gelesen werden: {n}": "Impossible de lire le fichier : {n}",
 "5  Pack": "5  Pack",
 "Pack bauen": "Créer le pack",
 "Im Spiel verwenden": "Utiliser dans le jeu",
 "ZIP speichern": "Enregistrer le ZIP",
 "Der Pack ist fertig. Du kannst ihn gleich im Spiel verwenden oder als ZIP speichern.": "Le pack est prêt. Vous pouvez l’utiliser tout de suite dans le jeu ou l’enregistrer en ZIP.",
 "Der Pack liegt jetzt in deiner Pack-Liste. Erstelle einen Raum, dann kannst du ihn auswählen.": "Le pack se trouve maintenant dans votre liste de packs. Créez une salle et vous pourrez le choisir.",
 "Bitte zuerst ein Video wählen.": "Veuillez d’abord choisir une vidéo.",
 "Es gibt noch keine Zeilen.": "Il n’y a pas encore de lignes.",
 "Zeile {n}: Das Ende muss nach dem Start liegen.": "Ligne {n} : la fin doit venir après le début.",
 "Zeile {n}: Der Start liegt hinter dem Ende des Videos.": "Ligne {n} : le début est après la fin de la vidéo.",
 "Zeile {n}: Bitte einen Text eintragen.": "Ligne {n} : veuillez saisir un texte.",
 "Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.": "Aucun son disponible. Sous « Son », chargez une piste de voix.",
 "Baue Zeile {n}/{total} …": "Création de la ligne {n}/{total} …",
 "Baue Hintergrund …": "Création du fond …",
 "Packe alles zusammen … {p} %": "Assemblage de tout … {p} %",
 "Bau fehlgeschlagen: {e}": "Échec de la création : {e}",
 "Das Video hat ein Format, das der Pack nicht kennt (mp4, webm).": "La vidéo a un format que le pack ne connaît pas (mp4, webm)."
});
  VD.addLang('pt', {
 "Das Video bei vocalremover.org in die Seite hineinziehen (Drag and Drop, siehe Hinweis bei den Links). Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund (Musik und Geräusche).": "Arraste o vídeo para a página do vocalremover.org (arrastar e soltar, veja a nota nos links). Você recebe dois arquivos: só vozes e só fundo (música e ruídos).",
 "Trennt Stimmen und Hintergrund in zwei Dateien. Ein mp4-Video lässt sich dort nicht über „Datei wählen“ auswählen, du musst es in die Seite hineinziehen (Drag and Drop).": "Separa vozes e fundo em dois arquivos. Um vídeo mp4 não pode ser escolhido lá com “Escolher arquivo”; é preciso arrastá-lo para a página (arrastar e soltar).",
 "Erzeugt Untertitel direkt auf deinem Gerät, es wird nichts hochgeladen. Das dauert länger, besonders am Handy. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "Cria legendas direto no seu aparelho, nada é enviado. Demora mais, principalmente no celular. Exporta como .srt ou .vtt. O texto pode diferir do que foi falado.",
 "Erzeugt Untertitel online, du lädst die Datei dort hoch. Die Nutzung ist nur teilweise kostenlos. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "Cria legendas online, você envia o arquivo para lá. O uso só é gratuito em parte. Exporta como .srt ou .vtt. O texto pode diferir do que foi falado.",
 "Läuft im Browser": "Roda no navegador",
 "Datei wird hochgeladen": "O arquivo é enviado",
 "Selbst prüfen": "Confira você mesmo",
 "Unabhängige Prüfseiten zeigen dir live, ob eine Webseite vertrauenswürdig ist. Tippe bei einer Seite auf einen Namen, dann siehst du dort die aktuelle Einschätzung zu genau dieser Adresse.": "Sites de verificação independentes mostram ao vivo se um site é confiável. Toque em um nome sob um site e você verá a avaliação atual desse endereço exato.",
 "Bewertungen von echten Nutzern.": "Avaliações de usuários reais.",
 "Prüft Betrugs-Anzeichen und Alter der Seite.": "Verifica sinais de fraude e a idade do site.",
 "Googles Liste gefährlicher Seiten.": "A lista do Google de sites perigosos.",
 "Fragt viele Virenscanner auf einmal.": "Consulta vários antivírus de uma vez.",
 "Alles läuft über Webseiten, du musst nichts installieren. Du bereitest Text und Ton dort vor und lädst es hier hoch. Daraus wird ein Dub-Pack.": "Tudo funciona por sites, você não precisa instalar nada. Você prepara o texto e o som lá e envia aqui. Disso sai um pack de dublagem.",
 "Webseiten für die Vorbereitung": "Sites para a preparação",
 "Alles im Browser, ohne Programm zum Herunterladen. Tippe oben rechts auf das i, dort steht, worauf du achten solltest.": "Tudo no navegador, sem programa para baixar. Toque no i no canto superior direito para ver no que prestar atenção.",
 "Bei einer Untertitel-Seite die Datei laden, Untertitel erzeugen lassen und als .srt- oder .vtt-Datei herunterladen. Der erkannte Text kann teilweise falsch sein, du musst ihn danach hier selbst korrigieren.": "Em um site de legendas, carregue o arquivo, deixe gerar as legendas e baixe como arquivo .srt ou .vtt. O texto reconhecido pode estar em parte errado; depois você precisa corrigi-lo aqui.",
 "Dienste ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.": "Os serviços mudam. Confira você mesmo se ainda são gratuitos e o que acontece com seus arquivos. Use só material que você pode usar.",
 "Quellen und Sicherheit": "Fontes e segurança",
 "Stimmen und Hintergrund trennen": "Separar vozes e fundo",
 "YouTube-Video als mp4": "Vídeo do YouTube como mp4",
 "Wandelt ein YouTube-Video in eine mp4-Datei um.": "Converte um vídeo do YouTube em um arquivo mp4.",
 "Die Szene als Videodatei bereitlegen (mp4 oder webm, am besten 20 bis 90 Sekunden). Bei einem YouTube-Video hilft notube.cc bei den Links.": "Deixe a cena pronta como arquivo de vídeo (mp4 ou webm, de preferência de 20 a 90 segundos). Para um vídeo do YouTube, o notube.cc nos links ajuda.",
 "Untertitel erzeugen": "Criar legendas",
 "Schließen": "Fechar",
 "So geht es": "Como funciona",
 "Anleitung zeigen": "Mostrar instruções",
 "Links zeigen": "Mostrar links",
 "Hier das Video laden, die .srt-Datei importieren, die Stimmenspur und die Hintergrundspur laden, Charaktere vergeben und den Pack bauen.": "Carregue aqui o vídeo, importe o arquivo .srt, carregue a faixa de vozes e a faixa de fundo, atribua os personagens e crie o pack.",
 "Alle Dateien müssen gleich lang sein und im selben Moment beginnen wie das Video.": "Todos os arquivos precisam ter a mesma duração e começar no mesmo momento que o vídeo.",
 "Falls ein Link nicht mehr geht, suche den Namen im Netz.": "Se um link não funcionar mais, procure o nome na internet.",
 "Noch keine Zeilen. Importiere eine Untertitel-Datei oder füge Zeilen von Hand hinzu.": "Ainda não há linhas. Importe um arquivo de legendas ou adicione linhas à mão.",
 "Dub-Pack erstellen": "Criar pack de dublagem",
 "Zurück": "Voltar",
 "Baue aus einem Video deinen eigenen Dub-Pack. Alles bleibt auf deinem Gerät.": "Crie seu próprio pack de dublagem a partir de um vídeo. Tudo fica no seu aparelho.",
 "1  Video": "1  Vídeo",
 "Videodatei wählen": "Escolher arquivo de vídeo",
 "Dein Browser muss das Video abspielen können (mp4 oder webm). Das Video wird unverändert in den Pack gelegt, am besten unter 100 MB.": "Seu navegador precisa conseguir reproduzir o vídeo (mp4 ou webm). O vídeo vai sem alterações para o pack, de preferência com menos de 100 MB.",
 "Titel des Packs": "Título do pack",
 "Dein Name (optional)": "Seu nome (opcional)",
 "Dauer {d} s": "Duração {d} s",
 "Ton wird gelesen …": "Lendo o som …",
 "Der Browser kann den Ton dieses Videos nicht lesen. Lade bei „Ton“ eine eigene Stimmenspur.": "O navegador não consegue ler o som deste vídeo. Em “Som”, carregue sua própria faixa de vozes.",
 "Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.": "O navegador não consegue reproduzir este vídeo. Use mp4 (H.264) ou webm.",
 "2  Zeilen": "2  Linhas",
 "Jede Zeile ist ein Satz, den die Spieler einsprechen. Start und Ende in Sekunden.": "Cada linha é uma frase que os jogadores vão gravar. Início e fim em segundos.",
 "Untertitel importieren (.srt, .vtt)": "Importar legendas (.srt, .vtt)",
 "Zeile bei {s} s hinzufügen": "Adicionar linha em {s} s",
 "Nach Zeit sortieren": "Ordenar por tempo",
 "{n} Zeilen importiert.": "{n} linhas importadas.",
 "In der Datei wurden keine Zeilen gefunden.": "Nenhuma linha foi encontrada no arquivo.",
 "Zeile anhören": "Ouvir linha",
 "Zeile löschen": "Excluir linha",
 "Start": "Início",
 "Ende": "Fim",
 "Text": "Texto",
 "Charakter": "Personagem",
 "Auf die aktuelle Position im Video setzen": "Definir para a posição atual do vídeo",
 "3  Charaktere": "3  Personagens",
 "So heißen die Rollen im Spiel. Jede Zeile gehört zu einem Charakter.": "Estes são os nomes dos papéis no jogo. Cada linha pertence a um personagem.",
 "Charakter hinzufügen": "Adicionar personagem",
 "Zeilen abwechselnd verteilen": "Distribuir as linhas alternadamente",
 "Charakter entfernen": "Remover personagem",
 "Sprecher {n}": "Falante {n}",
 "4  Ton": "4  Som",
 "Stimmen der Zeilen": "Vozes das linhas",
 "Aus dem Video": "Do vídeo",
 "Eigene Stimmenspur": "Minha própria faixa de vozes",
 "Hintergrund (Musik und Geräusche)": "Fundo (música e ruídos)",
 "Original ohne Sprechstellen": "Original sem trechos falados",
 "Eigene Hintergrundspur": "Minha própria faixa de fundo",
 "Keiner": "Nenhum",
 "Das Original wird an den Stellen stummgeschaltet, an denen gesprochen wird. Dort fehlt auch die Musik. Mit einer eigenen Hintergrundspur klingt es besser.": "O original fica mudo onde há fala. Lá a música também some. Com uma faixa de fundo própria soa melhor.",
 "Die Szene hat dann nur die Stimmen der Spieler.": "Então a cena terá só as vozes dos jogadores.",
 "Nur Stimmen, ohne Musik. Dann sind die Original-Zeilen sauberer. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "Só vozes, sem música. Assim as linhas originais ficam mais limpas. O arquivo precisa ter a mesma duração do vídeo e começar igual.",
 "Nur Musik und Geräusche, ohne Stimmen. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "Só música e ruídos, sem vozes. O arquivo precisa ter a mesma duração do vídeo e começar igual.",
 "Audiodatei wählen": "Escolher arquivo de áudio",
 "Datei kann nicht gelesen werden: {n}": "Não foi possível ler o arquivo: {n}",
 "5  Pack": "5  Pack",
 "Pack bauen": "Criar pack",
 "Im Spiel verwenden": "Usar no jogo",
 "ZIP speichern": "Salvar ZIP",
 "Der Pack ist fertig. Du kannst ihn gleich im Spiel verwenden oder als ZIP speichern.": "O pack está pronto. Você pode usá-lo logo no jogo ou salvá-lo como ZIP.",
 "Der Pack liegt jetzt in deiner Pack-Liste. Erstelle einen Raum, dann kannst du ihn auswählen.": "O pack agora está na sua lista de packs. Crie uma sala e você poderá escolhê-lo.",
 "Bitte zuerst ein Video wählen.": "Escolha primeiro um vídeo.",
 "Es gibt noch keine Zeilen.": "Ainda não há linhas.",
 "Zeile {n}: Das Ende muss nach dem Start liegen.": "Linha {n}: o fim precisa vir depois do início.",
 "Zeile {n}: Der Start liegt hinter dem Ende des Videos.": "Linha {n}: o início fica depois do fim do vídeo.",
 "Zeile {n}: Bitte einen Text eintragen.": "Linha {n}: digite um texto.",
 "Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.": "Não há som. Em “Som”, carregue uma faixa de vozes.",
 "Baue Zeile {n}/{total} …": "Criando linha {n}/{total} …",
 "Baue Hintergrund …": "Criando o fundo …",
 "Packe alles zusammen … {p} %": "Juntando tudo … {p} %",
 "Bau fehlgeschlagen: {e}": "Falha ao criar: {e}",
 "Das Video hat ein Format, das der Pack nicht kennt (mp4, webm).": "O vídeo tem um formato que o pack não conhece (mp4, webm)."
});
  VD.addLang('ru', {
 "Das Video bei vocalremover.org in die Seite hineinziehen (Drag and Drop, siehe Hinweis bei den Links). Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund (Musik und Geräusche).": "Перетащите видео на страницу vocalremover.org (drag and drop, см. примечание у ссылок). Вы получите два файла: только голоса и только фон (музыка и шумы).",
 "Trennt Stimmen und Hintergrund in zwei Dateien. Ein mp4-Video lässt sich dort nicht über „Datei wählen“ auswählen, du musst es in die Seite hineinziehen (Drag and Drop).": "Разделяет голоса и фон на два файла. Видео mp4 там нельзя выбрать кнопкой «Выбрать файл», его нужно перетащить на страницу (drag and drop).",
 "Erzeugt Untertitel direkt auf deinem Gerät, es wird nichts hochgeladen. Das dauert länger, besonders am Handy. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "Создаёт субтитры прямо на вашем устройстве, ничего не загружается. Это дольше, особенно на телефоне. Экспорт в .srt или .vtt. Текст может отличаться от сказанного.",
 "Erzeugt Untertitel online, du lädst die Datei dort hoch. Die Nutzung ist nur teilweise kostenlos. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "Создаёт субтитры онлайн, файл вы загружаете туда. Использование бесплатно только частично. Экспорт в .srt или .vtt. Текст может отличаться от сказанного.",
 "Läuft im Browser": "Работает в браузере",
 "Datei wird hochgeladen": "Файл загружается",
 "Selbst prüfen": "Проверьте сами",
 "Unabhängige Prüfseiten zeigen dir live, ob eine Webseite vertrauenswürdig ist. Tippe bei einer Seite auf einen Namen, dann siehst du dort die aktuelle Einschätzung zu genau dieser Adresse.": "Независимые сайты проверки показывают в реальном времени, можно ли доверять сайту. Нажмите на название под сайтом, и вы увидите текущую оценку именно этого адреса.",
 "Bewertungen von echten Nutzern.": "Отзывы настоящих пользователей.",
 "Prüft Betrugs-Anzeichen und Alter der Seite.": "Проверяет признаки мошенничества и возраст сайта.",
 "Googles Liste gefährlicher Seiten.": "Список опасных сайтов от Google.",
 "Fragt viele Virenscanner auf einmal.": "Проверяет сразу многими антивирусами.",
 "Alles läuft über Webseiten, du musst nichts installieren. Du bereitest Text und Ton dort vor und lädst es hier hoch. Daraus wird ein Dub-Pack.": "Всё работает через сайты, ничего устанавливать не нужно. Вы готовите там текст и звук и загружаете их сюда. Из этого получится пак дубляжа.",
 "Webseiten für die Vorbereitung": "Сайты для подготовки",
 "Alles im Browser, ohne Programm zum Herunterladen. Tippe oben rechts auf das i, dort steht, worauf du achten solltest.": "Всё в браузере, без программ для скачивания. Нажмите на i вверху справа, там написано, на что обратить внимание.",
 "Bei einer Untertitel-Seite die Datei laden, Untertitel erzeugen lassen und als .srt- oder .vtt-Datei herunterladen. Der erkannte Text kann teilweise falsch sein, du musst ihn danach hier selbst korrigieren.": "На сайте субтитров загрузите файл, дождитесь создания субтитров и скачайте их как файл .srt или .vtt. Распознанный текст может быть частично неверным, потом вам нужно исправить его самим здесь.",
 "Dienste ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.": "Сервисы меняются. Проверьте сами, остаются ли они бесплатными и что происходит с вашими файлами. Используйте только тот материал, который вам можно использовать.",
 "Quellen und Sicherheit": "Источники и безопасность",
 "Stimmen und Hintergrund trennen": "Разделить голоса и фон",
 "YouTube-Video als mp4": "Видео с YouTube в mp4",
 "Wandelt ein YouTube-Video in eine mp4-Datei um.": "Превращает видео с YouTube в файл mp4.",
 "Die Szene als Videodatei bereitlegen (mp4 oder webm, am besten 20 bis 90 Sekunden). Bei einem YouTube-Video hilft notube.cc bei den Links.": "Подготовьте сцену как видеофайл (mp4 или webm, лучше 20–90 секунд). Для видео с YouTube поможет notube.cc среди ссылок.",
 "Untertitel erzeugen": "Создать субтитры",
 "Schließen": "Закрыть",
 "So geht es": "Как это работает",
 "Anleitung zeigen": "Показать инструкцию",
 "Links zeigen": "Показать ссылки",
 "Hier das Video laden, die .srt-Datei importieren, die Stimmenspur und die Hintergrundspur laden, Charaktere vergeben und den Pack bauen.": "Загрузите здесь видео, импортируйте файл .srt, загрузите дорожку голосов и дорожку фона, назначьте персонажей и соберите пак.",
 "Alle Dateien müssen gleich lang sein und im selben Moment beginnen wie das Video.": "Все файлы должны быть одной длины и начинаться в тот же момент, что и видео.",
 "Falls ein Link nicht mehr geht, suche den Namen im Netz.": "Если ссылка больше не работает, найдите название в интернете.",
 "Noch keine Zeilen. Importiere eine Untertitel-Datei oder füge Zeilen von Hand hinzu.": "Пока нет строк. Импортируйте файл субтитров или добавьте строки вручную.",
 "Dub-Pack erstellen": "Создать пак дубляжа",
 "Zurück": "Назад",
 "Baue aus einem Video deinen eigenen Dub-Pack. Alles bleibt auf deinem Gerät.": "Сделайте из видео свой пак дубляжа. Всё остаётся на вашем устройстве.",
 "1  Video": "1  Видео",
 "Videodatei wählen": "Выбрать видеофайл",
 "Dein Browser muss das Video abspielen können (mp4 oder webm). Das Video wird unverändert in den Pack gelegt, am besten unter 100 MB.": "Ваш браузер должен уметь воспроизводить видео (mp4 или webm). Видео кладётся в пак без изменений, лучше не больше 100 МБ.",
 "Titel des Packs": "Название пака",
 "Dein Name (optional)": "Ваше имя (необязательно)",
 "Dauer {d} s": "Длительность {d} с",
 "Ton wird gelesen …": "Чтение звука …",
 "Der Browser kann den Ton dieses Videos nicht lesen. Lade bei „Ton“ eine eigene Stimmenspur.": "Браузер не может прочитать звук этого видео. В разделе «Звук» загрузите свою дорожку голосов.",
 "Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.": "Браузер не может воспроизвести это видео. Используйте mp4 (H.264) или webm.",
 "2  Zeilen": "2  Строки",
 "Jede Zeile ist ein Satz, den die Spieler einsprechen. Start und Ende in Sekunden.": "Каждая строка — это фраза, которую будут записывать игроки. Начало и конец в секундах.",
 "Untertitel importieren (.srt, .vtt)": "Импортировать субтитры (.srt, .vtt)",
 "Zeile bei {s} s hinzufügen": "Добавить строку на {s} с",
 "Nach Zeit sortieren": "Сортировать по времени",
 "{n} Zeilen importiert.": "Импортировано строк: {n}.",
 "In der Datei wurden keine Zeilen gefunden.": "В файле не найдено строк.",
 "Zeile anhören": "Прослушать строку",
 "Zeile löschen": "Удалить строку",
 "Start": "Начало",
 "Ende": "Конец",
 "Text": "Текст",
 "Charakter": "Персонаж",
 "Auf die aktuelle Position im Video setzen": "Установить на текущую позицию видео",
 "3  Charaktere": "3  Персонажи",
 "So heißen die Rollen im Spiel. Jede Zeile gehört zu einem Charakter.": "Так называются роли в игре. Каждая строка принадлежит одному персонажу.",
 "Charakter hinzufügen": "Добавить персонажа",
 "Zeilen abwechselnd verteilen": "Распределить строки по очереди",
 "Charakter entfernen": "Удалить персонажа",
 "Sprecher {n}": "Говорящий {n}",
 "4  Ton": "4  Звук",
 "Stimmen der Zeilen": "Голоса строк",
 "Aus dem Video": "Из видео",
 "Eigene Stimmenspur": "Своя дорожка голосов",
 "Hintergrund (Musik und Geräusche)": "Фон (музыка и шумы)",
 "Original ohne Sprechstellen": "Оригинал без речи",
 "Eigene Hintergrundspur": "Своя дорожка фона",
 "Keiner": "Нет",
 "Das Original wird an den Stellen stummgeschaltet, an denen gesprochen wird. Dort fehlt auch die Musik. Mit einer eigenen Hintergrundspur klingt es besser.": "В оригинале звук отключается там, где говорят. Музыки там тоже нет. Со своей дорожкой фона звучит лучше.",
 "Die Szene hat dann nur die Stimmen der Spieler.": "Тогда в сцене будут только голоса игроков.",
 "Nur Stimmen, ohne Musik. Dann sind die Original-Zeilen sauberer. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "Только голоса, без музыки. Тогда оригинальные строки чище. Файл должен быть той же длины, что и видео, и начинаться в тот же момент.",
 "Nur Musik und Geräusche, ohne Stimmen. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "Только музыка и шумы, без голосов. Файл должен быть той же длины, что и видео, и начинаться в тот же момент.",
 "Audiodatei wählen": "Выбрать аудиофайл",
 "Datei kann nicht gelesen werden: {n}": "Не удаётся прочитать файл: {n}",
 "5  Pack": "5  Пак",
 "Pack bauen": "Собрать пак",
 "Im Spiel verwenden": "Использовать в игре",
 "ZIP speichern": "Сохранить ZIP",
 "Der Pack ist fertig. Du kannst ihn gleich im Spiel verwenden oder als ZIP speichern.": "Пак готов. Его можно сразу использовать в игре или сохранить как ZIP.",
 "Der Pack liegt jetzt in deiner Pack-Liste. Erstelle einen Raum, dann kannst du ihn auswählen.": "Пак теперь в вашем списке паков. Создайте комнату, и вы сможете его выбрать.",
 "Bitte zuerst ein Video wählen.": "Сначала выберите видео.",
 "Es gibt noch keine Zeilen.": "Строк пока нет.",
 "Zeile {n}: Das Ende muss nach dem Start liegen.": "Строка {n}: конец должен быть после начала.",
 "Zeile {n}: Der Start liegt hinter dem Ende des Videos.": "Строка {n}: начало находится после конца видео.",
 "Zeile {n}: Bitte einen Text eintragen.": "Строка {n}: введите текст.",
 "Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.": "Звука нет. В разделе «Звук» загрузите дорожку голосов.",
 "Baue Zeile {n}/{total} …": "Сборка строки {n}/{total} …",
 "Baue Hintergrund …": "Сборка фона …",
 "Packe alles zusammen … {p} %": "Упаковка всего … {p} %",
 "Bau fehlgeschlagen: {e}": "Не удалось собрать: {e}",
 "Das Video hat ein Format, das der Pack nicht kennt (mp4, webm).": "У видео формат, который пак не знает (mp4, webm)."
});
  VD.addLang('hi', {
 "Das Video bei vocalremover.org in die Seite hineinziehen (Drag and Drop, siehe Hinweis bei den Links). Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund (Musik und Geräusche).": "वीडियो को vocalremover.org के पेज पर खींचकर छोड़ें (ड्रैग एंड ड्रॉप, लिंक के पास का नोट देखें)। आपको दो फ़ाइलें मिलती हैं: सिर्फ़ आवाज़ें और सिर्फ़ बैकग्राउंड (संगीत और शोर)।",
 "Trennt Stimmen und Hintergrund in zwei Dateien. Ein mp4-Video lässt sich dort nicht über „Datei wählen“ auswählen, du musst es in die Seite hineinziehen (Drag and Drop).": "आवाज़ और बैकग्राउंड को दो फ़ाइलों में अलग करता है। वहाँ mp4 वीडियो “फ़ाइल चुनें” से नहीं चुना जा सकता, उसे पेज पर खींचकर छोड़ना होगा (ड्रैग एंड ड्रॉप)।",
 "Erzeugt Untertitel direkt auf deinem Gerät, es wird nichts hochgeladen. Das dauert länger, besonders am Handy. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "सबटाइटल सीधे आपके डिवाइस पर बनाता है, कुछ भी अपलोड नहीं होता। इसमें ज़्यादा समय लगता है, ख़ासकर फ़ोन पर। .srt या .vtt में एक्सपोर्ट। टेक्स्ट बोले गए से अलग हो सकता है।",
 "Erzeugt Untertitel online, du lädst die Datei dort hoch. Die Nutzung ist nur teilweise kostenlos. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.": "सबटाइटल ऑनलाइन बनाता है, फ़ाइल आप वहाँ अपलोड करते हैं। इस्तेमाल सिर्फ़ आंशिक रूप से मुफ़्त है। .srt या .vtt में एक्सपोर्ट। टेक्स्ट बोले गए से अलग हो सकता है।",
 "Läuft im Browser": "ब्राउज़र में चलता है",
 "Datei wird hochgeladen": "फ़ाइल अपलोड होती है",
 "Selbst prüfen": "ख़ुद जाँचें",
 "Unabhängige Prüfseiten zeigen dir live, ob eine Webseite vertrauenswürdig ist. Tippe bei einer Seite auf einen Namen, dann siehst du dort die aktuelle Einschätzung zu genau dieser Adresse.": "स्वतंत्र जाँच-साइटें लाइव दिखाती हैं कि कोई वेबसाइट भरोसेमंद है या नहीं। किसी साइट के नीचे एक नाम पर टैप करें, तो आपको उसी पते की मौजूदा रेटिंग दिखेगी।",
 "Bewertungen von echten Nutzern.": "असली उपयोगकर्ताओं की समीक्षाएँ।",
 "Prüft Betrugs-Anzeichen und Alter der Seite.": "धोखाधड़ी के संकेत और साइट की उम्र जाँचता है।",
 "Googles Liste gefährlicher Seiten.": "Google की ख़तरनाक साइटों की सूची।",
 "Fragt viele Virenscanner auf einmal.": "एक साथ कई वायरस स्कैनर से पूछता है।",
 "Alles läuft über Webseiten, du musst nichts installieren. Du bereitest Text und Ton dort vor und lädst es hier hoch. Daraus wird ein Dub-Pack.": "सब कुछ वेबसाइटों से होता है, आपको कुछ इंस्टॉल नहीं करना है। आप वहाँ टेक्स्ट और आवाज़ तैयार करते हैं और यहाँ अपलोड करते हैं। इससे एक डब पैक बनता है।",
 "Webseiten für die Vorbereitung": "तैयारी के लिए वेबसाइटें",
 "Alles im Browser, ohne Programm zum Herunterladen. Tippe oben rechts auf das i, dort steht, worauf du achten solltest.": "सब कुछ ब्राउज़र में, डाउनलोड करने के लिए कोई प्रोग्राम नहीं। ऊपर दाईं ओर i पर टैप करें, वहाँ लिखा है कि किस बात का ध्यान रखें।",
 "Bei einer Untertitel-Seite die Datei laden, Untertitel erzeugen lassen und als .srt- oder .vtt-Datei herunterladen. Der erkannte Text kann teilweise falsch sein, du musst ihn danach hier selbst korrigieren.": "किसी सबटाइटल साइट पर फ़ाइल लोड करें, सबटाइटल बनवाएँ और .srt या .vtt फ़ाइल के रूप में डाउनलोड करें। पहचाना गया टेक्स्ट कुछ जगह ग़लत हो सकता है, उसे बाद में आपको यहाँ ख़ुद ठीक करना होगा।",
 "Dienste ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.": "सेवाएँ बदलती रहती हैं। ख़ुद जाँचें कि वे अब भी मुफ़्त हैं या नहीं और आपकी फ़ाइलों का क्या होता है। सिर्फ़ वही सामग्री इस्तेमाल करें जिसका आपको इस्तेमाल करने का अधिकार है।",
 "Quellen und Sicherheit": "स्रोत और सुरक्षा",
 "Stimmen und Hintergrund trennen": "आवाज़ और बैकग्राउंड अलग करें",
 "YouTube-Video als mp4": "YouTube वीडियो mp4 के रूप में",
 "Wandelt ein YouTube-Video in eine mp4-Datei um.": "YouTube वीडियो को mp4 फ़ाइल में बदलता है।",
 "Die Szene als Videodatei bereitlegen (mp4 oder webm, am besten 20 bis 90 Sekunden). Bei einem YouTube-Video hilft notube.cc bei den Links.": "दृश्य को वीडियो फ़ाइल (mp4 या webm, बेहतर है 20 से 90 सेकंड) के रूप में तैयार रखें। YouTube वीडियो के लिए लिंक में notube.cc मदद करता है।",
 "Untertitel erzeugen": "सबटाइटल बनाएँ",
 "Schließen": "बंद करें",
 "So geht es": "यह कैसे काम करता है",
 "Anleitung zeigen": "निर्देश दिखाएँ",
 "Links zeigen": "लिंक दिखाएँ",
 "Hier das Video laden, die .srt-Datei importieren, die Stimmenspur und die Hintergrundspur laden, Charaktere vergeben und den Pack bauen.": "यहाँ वीडियो लोड करें, .srt फ़ाइल इम्पोर्ट करें, आवाज़ों वाला ट्रैक और बैकग्राउंड ट्रैक लोड करें, किरदार तय करें और पैक बनाएँ।",
 "Alle Dateien müssen gleich lang sein und im selben Moment beginnen wie das Video.": "सभी फ़ाइलें एक ही लंबाई की हों और वीडियो के ठीक उसी पल से शुरू हों।",
 "Falls ein Link nicht mehr geht, suche den Namen im Netz.": "अगर कोई लिंक अब नहीं चलता, तो नाम इंटरनेट पर खोजें।",
 "Noch keine Zeilen. Importiere eine Untertitel-Datei oder füge Zeilen von Hand hinzu.": "अभी कोई पंक्ति नहीं है। सबटाइटल फ़ाइल इम्पोर्ट करें या पंक्तियाँ हाथ से जोड़ें।",
 "Dub-Pack erstellen": "डब पैक बनाएँ",
 "Zurück": "वापस",
 "Baue aus einem Video deinen eigenen Dub-Pack. Alles bleibt auf deinem Gerät.": "एक वीडियो से अपना डब पैक बनाएँ। सब कुछ आपके डिवाइस पर रहता है।",
 "1  Video": "1  वीडियो",
 "Videodatei wählen": "वीडियो फ़ाइल चुनें",
 "Dein Browser muss das Video abspielen können (mp4 oder webm). Das Video wird unverändert in den Pack gelegt, am besten unter 100 MB.": "आपका ब्राउज़र वीडियो चला सके (mp4 या webm)। वीडियो बिना बदलाव के पैक में रखा जाता है, बेहतर है 100 MB से कम हो।",
 "Titel des Packs": "पैक का नाम",
 "Dein Name (optional)": "आपका नाम (वैकल्पिक)",
 "Dauer {d} s": "अवधि {d} सेकंड",
 "Ton wird gelesen …": "आवाज़ पढ़ी जा रही है …",
 "Der Browser kann den Ton dieses Videos nicht lesen. Lade bei „Ton“ eine eigene Stimmenspur.": "ब्राउज़र इस वीडियो की आवाज़ नहीं पढ़ सकता। “आवाज़” में अपना आवाज़ों वाला ट्रैक लोड करें।",
 "Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.": "ब्राउज़र यह वीडियो नहीं चला सकता। mp4 (H.264) या webm इस्तेमाल करें।",
 "2  Zeilen": "2  पंक्तियाँ",
 "Jede Zeile ist ein Satz, den die Spieler einsprechen. Start und Ende in Sekunden.": "हर पंक्ति एक वाक्य है जिसे खिलाड़ी रिकॉर्ड करेंगे। शुरुआत और अंत सेकंड में।",
 "Untertitel importieren (.srt, .vtt)": "सबटाइटल इम्पोर्ट करें (.srt, .vtt)",
 "Zeile bei {s} s hinzufügen": "{s} सेकंड पर पंक्ति जोड़ें",
 "Nach Zeit sortieren": "समय के अनुसार क्रमबद्ध करें",
 "{n} Zeilen importiert.": "{n} पंक्तियाँ इम्पोर्ट हुईं।",
 "In der Datei wurden keine Zeilen gefunden.": "फ़ाइल में कोई पंक्ति नहीं मिली।",
 "Zeile anhören": "पंक्ति सुनें",
 "Zeile löschen": "पंक्ति हटाएँ",
 "Start": "शुरुआत",
 "Ende": "अंत",
 "Text": "टेक्स्ट",
 "Charakter": "किरदार",
 "Auf die aktuelle Position im Video setzen": "वीडियो की मौजूदा स्थिति पर सेट करें",
 "3  Charaktere": "3  किरदार",
 "So heißen die Rollen im Spiel. Jede Zeile gehört zu einem Charakter.": "खेल में भूमिकाओं के ये नाम हैं। हर पंक्ति किसी एक किरदार की होती है।",
 "Charakter hinzufügen": "किरदार जोड़ें",
 "Zeilen abwechselnd verteilen": "पंक्तियाँ बारी-बारी से बाँटें",
 "Charakter entfernen": "किरदार हटाएँ",
 "Sprecher {n}": "वक्ता {n}",
 "4  Ton": "4  आवाज़",
 "Stimmen der Zeilen": "पंक्तियों की आवाज़ें",
 "Aus dem Video": "वीडियो से",
 "Eigene Stimmenspur": "अपना आवाज़ों वाला ट्रैक",
 "Hintergrund (Musik und Geräusche)": "बैकग्राउंड (संगीत और शोर)",
 "Original ohne Sprechstellen": "बिना बोली वाले हिस्सों का मूल",
 "Eigene Hintergrundspur": "अपना बैकग्राउंड ट्रैक",
 "Keiner": "कोई नहीं",
 "Das Original wird an den Stellen stummgeschaltet, an denen gesprochen wird. Dort fehlt auch die Musik. Mit einer eigenen Hintergrundspur klingt es besser.": "जहाँ बोला जाता है, वहाँ मूल आवाज़ म्यूट हो जाती है। वहाँ संगीत भी नहीं रहता। अपने बैकग्राउंड ट्रैक के साथ यह बेहतर लगता है।",
 "Die Szene hat dann nur die Stimmen der Spieler.": "तब दृश्य में सिर्फ़ खिलाड़ियों की आवाज़ें होंगी।",
 "Nur Stimmen, ohne Musik. Dann sind die Original-Zeilen sauberer. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "सिर्फ़ आवाज़ें, संगीत के बिना। तब मूल पंक्तियाँ साफ़ रहती हैं। फ़ाइल वीडियो जितनी ही लंबी हो और उसी पल से शुरू हो।",
 "Nur Musik und Geräusche, ohne Stimmen. Die Datei muss gleich lang sein wie das Video und gleich beginnen.": "सिर्फ़ संगीत और शोर, आवाज़ों के बिना। फ़ाइल वीडियो जितनी ही लंबी हो और उसी पल से शुरू हो।",
 "Audiodatei wählen": "ऑडियो फ़ाइल चुनें",
 "Datei kann nicht gelesen werden: {n}": "फ़ाइल पढ़ी नहीं जा सकती: {n}",
 "5  Pack": "5  पैक",
 "Pack bauen": "पैक बनाएँ",
 "Im Spiel verwenden": "खेल में इस्तेमाल करें",
 "ZIP speichern": "ZIP सहेजें",
 "Der Pack ist fertig. Du kannst ihn gleich im Spiel verwenden oder als ZIP speichern.": "पैक तैयार है। आप उसे तुरंत खेल में इस्तेमाल कर सकते हैं या ZIP के रूप में सहेज सकते हैं।",
 "Der Pack liegt jetzt in deiner Pack-Liste. Erstelle einen Raum, dann kannst du ihn auswählen.": "पैक अब आपकी पैक-सूची में है। एक कमरा बनाएँ, फिर आप उसे चुन सकते हैं।",
 "Bitte zuerst ein Video wählen.": "पहले एक वीडियो चुनें।",
 "Es gibt noch keine Zeilen.": "अभी कोई पंक्ति नहीं है।",
 "Zeile {n}: Das Ende muss nach dem Start liegen.": "पंक्ति {n}: अंत शुरुआत के बाद होना चाहिए।",
 "Zeile {n}: Der Start liegt hinter dem Ende des Videos.": "पंक्ति {n}: शुरुआत वीडियो के अंत के बाद है।",
 "Zeile {n}: Bitte einen Text eintragen.": "पंक्ति {n}: कृपया टेक्स्ट लिखें।",
 "Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.": "कोई आवाज़ नहीं है। “आवाज़” में आवाज़ों वाला ट्रैक लोड करें।",
 "Baue Zeile {n}/{total} …": "पंक्ति {n}/{total} बन रही है …",
 "Baue Hintergrund …": "बैकग्राउंड बन रहा है …",
 "Packe alles zusammen … {p} %": "सब कुछ पैक हो रहा है … {p} %",
 "Bau fehlgeschlagen: {e}": "बनाना विफल रहा: {e}",
 "Das Video hat ein Format, das der Pack nicht kennt (mp4, webm).": "वीडियो का फ़ॉर्मेट ऐसा है जिसे पैक नहीं जानता (mp4, webm)।"
});

  /* ------------------------------------------------------------------ Helfer */
  const TAIL = 0.15;                 // so viel Ton läuft nach dem Ende einer Zeile mit (Ausklang)
  const CLIP_SR = 32000;             // Abtastrate der Zeilen und der Hintergrundspur im Pack
  const MIN_LEN = 0.3;
  const fmt = (s) => (Math.round(s * 100) / 100).toString();
  const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const safeName = (s) => (String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)) || 'Dub-Pack';
  const clamp = VD.clamp;

  function wavBlob(chans, sr) {
    const nCh = chans.length, n = chans[0].length, buf = new ArrayBuffer(44 + n * nCh * 2), dv = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * nCh * 2, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, nCh, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * nCh * 2, true); dv.setUint16(32, nCh * 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * nCh * 2, true);
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < nCh; c++) { const v = clamp(chans[c][i], -1, 1); dv.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    return new Blob([buf], { type: 'audio/wav' });
  }

  const monoOf = (buf, t0, t1) => {
    const sr = buf.sampleRate, i0 = clamp(Math.floor(t0 * sr), 0, buf.length), i1 = clamp(Math.ceil(t1 * sr), i0 + 1, buf.length);
    const out = new Float32Array(i1 - i0);
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < out.length; i++) out[i] += d[i0 + i] / buf.numberOfChannels; }
    return out;
  };

  /* Ein Standbild aus dem Video (JPEG) */
  async function frameAt(url, time, maxW, square) {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.playsInline = true; v.src = url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('video')); setTimeout(() => rej(new Error('video')), 15000); });
    v.currentTime = clamp(time, 0, Math.max(0, (v.duration || 1) - 0.05));
    await new Promise((res) => { v.onseeked = res; setTimeout(res, 4000); });
    const w0 = v.videoWidth || 640, h0 = v.videoHeight || 480;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    if (square) {
      const s = Math.min(w0, h0); c.width = c.height = maxW;
      g.drawImage(v, (w0 - s) / 2, (h0 - s) / 2, s, s, 0, 0, maxW, maxW);
    } else {
      const k = Math.min(1, maxW / w0); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
      g.drawImage(v, 0, 0, c.width, c.height);
    }
    const blob = await new Promise((res) => c.toBlob(res, square ? 'image/png' : 'image/jpeg', 0.84));
    v.removeAttribute('src'); v.load();
    return blob;
  }

  /* Untertitel (.srt / .vtt) -> Zeilen */
  function parseSubs(text) {
    const lines = [];
    const tm = (s) => { const m = s.trim().replace(',', '.').match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/); return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) + (m[4] ? +('0.' + m[4].padEnd(3, '0')) : 0) : null; };
    const blocks = String(text).replace(/^﻿/, '').replace(/\r/g, '').split(/\n{2,}/);
    for (const b of blocks) {
      const ls = b.split('\n').filter((x) => x.trim() !== '');
      const i = ls.findIndex((x) => x.includes('-->'));
      if (i < 0) continue;
      const [a, rest] = ls[i].split('-->');
      const s = tm(a), e = tm((rest || '').trim().split(/\s+/)[0] || '');
      if (s == null || e == null) continue;
      const txt = ls.slice(i + 1).join(' ').replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').replace(/^\s*[-–]\s*/, '').replace(/\s+/g, ' ').trim();
      if (txt) lines.push({ start: s, end: e, text: txt });
    }
    return lines;
  }

  /* ------------------------------------------------------------------ Oberfläche */
  VD.Maker = {
    open(root, onBack) {
      const S = {
        file: null, url: '', dur: 0, ext: 'mp4', buf: null, voiceBuf: null, backBuf: null,
        title: '', author: VD.store.get('makerAuthor', ''), chars: [t('Sprecher {n}', { n: 1 }), t('Sprecher {n}', { n: 2 })],
        lines: [], voiceMode: 'file', backMode: 'file', zip: null, busy: false
      };
      let stopAt = null;
      const R = {};   // Verweise auf Elemente

      const panel = (title, ...kids) => {
        const m = String(title).match(/^(\d+)\s+(.*)$/);
        return h('section', { class: 'panel mk-panel' }, h('h2', {}, ...(m ? [h('span', { class: 'mk-badge', text: m[1] }), h('span', { text: m[2] })] : [title])), ...kids);
      };
      const note = (s) => h('p', { class: 'muted mk-note', text: s });
      const warn = (box, msg) => { box.textContent = msg || ''; box.hidden = !msg; };
      const field = (label, input) => h('label', { class: 'field' }, h('span', { class: 'field-l', text: label }), input);
      const steps = (arr) => h('ol', { class: 'mk-steps' }, ...arr.map((s) => h('li', { text: t(s) })));

      /* Aufklappbarer Bereich mit weichem Ein- und Ausfahren (nur die eigene Karte wird größer) */
      const fold = (label, ...kids) => {
        const body = h('div', { class: 'mk-fold-in' }, ...kids);
        const box = h('div', { class: 'mk-fold', 'aria-hidden': 'true' }, body);
        const btn = h('button', { class: 'mk-fold-btn', type: 'button', 'aria-expanded': 'false', onclick: () => {
          const open = btn.getAttribute('aria-expanded') !== 'true';
          btn.setAttribute('aria-expanded', String(open)); box.setAttribute('aria-hidden', String(!open)); box.classList.toggle('open', open);
        } }, h('span', { class: 'mk-chev', 'aria-hidden': 'true', text: '▸' }), h('span', { text: label }));
        return h('div', {}, btn, box);
      };

      /* --- Kopf und Einleitung --- */
      R.back = h('button', { class: 'btn link', type: 'button', onclick: () => { cleanup(); onBack && onBack(); } }, '◀ ' + t('Zurück'));
      const li = (...k) => h('li', {}, ...k);
      const tool = (name, url, what) => li(h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: name }), h('span', { text: ' – ' + t(what) }));
      const intro = h('div', { class: 'mk-intro' },
        h('div', { class: 'mk-way' },
          h('h2', { text: t('So geht es') }), h('p', { class: 'muted', text: t('Alles läuft über Webseiten, du musst nichts installieren. Du bereitest Text und Ton dort vor und lädst es hier hoch. Daraus wird ein Dub-Pack.') }),
          fold(t('Anleitung zeigen'), steps(['Die Szene als Videodatei bereitlegen (mp4 oder webm, am besten 20 bis 90 Sekunden). Bei einem YouTube-Video hilft notube.cc bei den Links.',
            'Das Video bei vocalremover.org in die Seite hineinziehen (Drag and Drop, siehe Hinweis bei den Links). Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund (Musik und Geräusche).',
            'Bei einer Untertitel-Seite die Datei laden, Untertitel erzeugen lassen und als .srt- oder .vtt-Datei herunterladen. Der erkannte Text kann teilweise falsch sein, du musst ihn danach hier selbst korrigieren.',
            'Hier das Video laden, die .srt-Datei importieren, die Stimmenspur und die Hintergrundspur laden, Charaktere vergeben und den Pack bauen.',
            'Alle Dateien müssen gleich lang sein und im selben Moment beginnen wie das Video.']),
          h('p', { class: 'muted mk-note', text: t('Dienste ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.') }))),
        h('div', { class: 'mk-way' },
          h('h2', { text: t('Webseiten für die Vorbereitung') }), h('p', { class: 'muted', text: t('Alles im Browser, ohne Programm zum Herunterladen. Tippe oben rechts auf das i, dort steht, worauf du achten solltest.') }),
          fold(t('Links zeigen'), h('h3', { class: 'mk-h3', text: t('YouTube-Video als mp4') }),
            h('ul', { class: 'mk-links' }, tool('notube.cc', 'https://notube.cc/de/youtube-app-457', 'Wandelt ein YouTube-Video in eine mp4-Datei um.')),
            h('h3', { class: 'mk-h3', text: t('Stimmen und Hintergrund trennen') }),
            h('ul', { class: 'mk-links' }, tool('vocalremover.org', 'https://vocalremover.org/', 'Trennt Stimmen und Hintergrund in zwei Dateien. Ein mp4-Video lässt sich dort nicht über „Datei wählen“ auswählen, du musst es in die Seite hineinziehen (Drag and Drop).')),
            h('h3', { class: 'mk-h3', text: t('Untertitel erzeugen') }),
            h('ul', { class: 'mk-links' },
              tool('snipsound.com', 'https://snipsound.com/tools/srt-generator/', 'Erzeugt Untertitel direkt auf deinem Gerät, es wird nichts hochgeladen. Das dauert länger, besonders am Handy. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.'),
              tool('wave.co', 'https://wave.co/tools/subtitle-generator', 'Erzeugt Untertitel online, du lädst die Datei dort hoch. Die Nutzung ist nur teilweise kostenlos. Export als .srt oder .vtt. Der Text kann vom Gesprochenen abweichen.')),
            h('p', { class: 'muted mk-note', text: t('Falls ein Link nicht mehr geht, suche den Namen im Netz.') }))));

      /* --- 1 Video --- */
      R.vWarn = h('p', { class: 'warn', role: 'alert', hidden: true });
      R.vInfo = h('p', { class: 'status' });
      R.video = h('video', { class: 'mk-video', controls: true, playsinline: true, hidden: true });
      R.vFile = h('input', { type: 'file', accept: 'video/*,.mp4,.m4v,.webm,.ogv', hidden: true, onchange: (e) => e.target.files[0] && loadVideo(e.target.files[0]) });
      R.vBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => R.vFile.click() }, t('Videodatei wählen'));
      R.title = h('input', { class: 'inp', maxlength: 60, oninput: (e) => { S.title = e.target.value; } });
      R.author = h('input', { class: 'inp', maxlength: 40, value: S.author, oninput: (e) => { S.author = e.target.value; VD.store.set('makerAuthor', S.author); } });
      const p1 = panel(t('1  Video'), note(t('Dein Browser muss das Video abspielen können (mp4 oder webm). Das Video wird unverändert in den Pack gelegt, am besten unter 100 MB.')),
        h('div', { class: 'row' }, R.vBtn, R.vFile), R.vWarn, R.vInfo, R.video,
        h('div', { class: 'mk-two' }, field(t('Titel des Packs'), R.title), field(t('Dein Name (optional)'), R.author)));

      /* --- 2 Zeilen --- */
      R.status2 = h('p', { class: 'status' });
      R.warn2 = h('p', { class: 'warn', role: 'alert', hidden: true });
      R.subFile = h('input', { type: 'file', accept: '.srt,.vtt,.txt,text/vtt', hidden: true, onchange: (e) => e.target.files[0] && importSubs(e.target.files[0]) });
      R.subBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => R.subFile.click() }, t('Untertitel importieren (.srt, .vtt)'));
      R.addBtn = h('button', { class: 'btn', type: 'button', onclick: () => addLine() }, '');
      R.sortBtn = h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { sortLines(); renderLines(); } }, t('Nach Zeit sortieren'));
      R.list = h('div', { class: 'mk-lines' });
      const p2 = panel(t('2  Zeilen'), note(t('Jede Zeile ist ein Satz, den die Spieler einsprechen. Start und Ende in Sekunden.')),
        h('div', { class: 'row' }, R.subBtn, R.subFile, R.addBtn, R.sortBtn),
        R.status2, R.warn2, R.list);

      /* --- 3 Charaktere --- */
      R.chars = h('div', { class: 'mk-chars' });
      const p3 = panel(t('3  Charaktere'), note(t('So heißen die Rollen im Spiel. Jede Zeile gehört zu einem Charakter.')), R.chars,
        h('div', { class: 'row' }, h('button', { class: 'btn sm', type: 'button', onclick: () => { S.chars.push(t('Sprecher {n}', { n: S.chars.length + 1 })); renderChars(); renderLines(); } }, '+ ' + t('Charakter hinzufügen')),
          h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { S.lines.forEach((l, i) => { l.char = S.chars[i % S.chars.length]; }); renderLines(); } }, t('Zeilen abwechselnd verteilen'))));

      /* --- 4 Ton --- */
      R.audWarn = h('p', { class: 'warn', role: 'alert', hidden: true });
      const seg = (name, opts, get, set) => {
        const box = h('div', { class: 'seg', role: 'group' });
        const draw = () => box.replaceChildren(...opts.map(([v, l]) => h('button', { type: 'button', class: 'seg-b' + (get() === v ? ' on' : ''), 'aria-pressed': String(get() === v), onclick: () => { set(v); draw(); renderAudioHints(); } }, t(l))));
        draw(); return box;
      };
      R.voiceFile = h('input', { type: 'file', accept: 'audio/*,.wav,.mp3,.ogg,.m4a,.flac,.opus', hidden: true, onchange: (e) => e.target.files[0] && loadAudioFile(e.target.files[0], 'voice') });
      R.backFile = h('input', { type: 'file', accept: 'audio/*,.wav,.mp3,.ogg,.m4a,.flac,.opus', hidden: true, onchange: (e) => e.target.files[0] && loadAudioFile(e.target.files[0], 'back') });
      R.voiceBtn = h('button', { class: 'btn sm', type: 'button', onclick: () => R.voiceFile.click() }, t('Audiodatei wählen'));
      R.backBtn = h('button', { class: 'btn sm', type: 'button', onclick: () => R.backFile.click() }, t('Audiodatei wählen'));
      R.voiceHint = h('p', { class: 'muted mk-note' }); R.backHint = h('p', { class: 'muted mk-note' });
      R.voiceRow = h('div', { class: 'row', hidden: true }, R.voiceBtn, R.voiceFile); R.backRow = h('div', { class: 'row', hidden: true }, R.backBtn, R.backFile);
      const p4 = panel(t('4  Ton'),
        h('div', { class: 'field' }, h('span', { class: 'field-l', text: t('Stimmen der Zeilen') }), seg('voice', [['video', 'Aus dem Video'], ['file', 'Eigene Stimmenspur']], () => S.voiceMode, (v) => { S.voiceMode = v; }), R.voiceHint, R.voiceRow),
        h('div', { class: 'field' }, h('span', { class: 'field-l', text: t('Hintergrund (Musik und Geräusche)') }), seg('back', [['mute', 'Original ohne Sprechstellen'], ['file', 'Eigene Hintergrundspur'], ['none', 'Keiner']], () => S.backMode, (v) => { S.backMode = v; }), R.backHint, R.backRow),
        R.audWarn);

      /* --- 5 Pack --- */
      R.warn5 = h('p', { class: 'warn', role: 'alert', hidden: true });
      R.status5 = h('p', { class: 'status' });
      R.build = h('button', { class: 'btn primary xl', type: 'button', onclick: () => onBuild() }, t('Pack bauen'));
      R.use = h('button', { class: 'btn primary', type: 'button', hidden: true, onclick: () => onUse() }, t('Im Spiel verwenden'));
      R.save = h('button', { class: 'btn', type: 'button', hidden: true, onclick: () => onSave() }, t('ZIP speichern'));
      const p5 = panel(t('5  Pack'), R.warn5, R.status5, h('div', { class: 'row' }, R.build, R.use, R.save));

      R.steps = h('div', { class: 'mk-steps-wrap', hidden: true }, p2, p3, p4, p5);
      root.replaceChildren(h('div', { class: 'mk-wrap' },
        h('header', { class: 'mk-top' }, R.back, h('h1', { text: t('Dub-Pack erstellen') }), h('div', { class: 'lang-slot' }, h('button', { class: 'icon-btn mk-info', type: 'button', title: t('Quellen und Sicherheit'), 'aria-label': t('Quellen und Sicherheit'), onclick: () => openInfo() }, 'i'), VD.ui.themeBtn())),
        h('p', { class: 'lead mk-lead', text: t('Baue aus einem Video deinen eigenen Dub-Pack. Alles bleibt auf deinem Gerät.') }), intro, p1, R.steps));
      renderChars(); renderLines(); renderAudioHints();

      function openInfo() {
        const prev = document.activeElement;
        const close = () => { box.remove(); document.removeEventListener('keydown', onKey); prev && prev.focus && prev.focus(); };
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        const a = (url, label) => h('a', { class: 'mk-chip', href: url, target: '_blank', rel: 'noopener noreferrer', text: label });
        const site = (dom, what, tag) => h('div', { class: 'mk-site' },
          h('div', { class: 'mk-site-h' }, h('b', { text: dom }), h('span', { class: 'muted', text: t(what) + (tag ? ' · ' + t(tag) : '') })),
          h('div', { class: 'mk-chips' },
            a('https://www.trustpilot.com/review/' + dom, 'Trustpilot'),
            a('https://www.scamadviser.com/check-website/' + dom, 'ScamAdviser'),
            a('https://transparencyreport.google.com/safe-browsing/search?url=' + dom, 'Google Safe Browsing'),
            a('https://www.virustotal.com/gui/domain/' + dom, 'VirusTotal')));
        const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mk-info-t', onclick: (e) => { if (e.target === box) close(); } },
          h('div', { class: 'modal-card mk-info-card' },
            h('h2', { id: 'mk-info-t', text: t('Selbst prüfen') }),
            h('p', { text: t('Unabhängige Prüfseiten zeigen dir live, ob eine Webseite vertrauenswürdig ist. Tippe bei einer Seite auf einen Namen, dann siehst du dort die aktuelle Einschätzung zu genau dieser Adresse.') }),
            site('notube.cc', 'YouTube-Video als mp4'),
            site('vocalremover.org', 'Stimmen und Hintergrund trennen'),
            site('snipsound.com', 'Untertitel erzeugen', 'Läuft im Browser'),
            site('wave.co', 'Untertitel erzeugen', 'Datei wird hochgeladen'),
            h('ul', { class: 'mk-links mk-legend' },
              h('li', {}, h('b', { text: 'Trustpilot' }), h('span', { text: ' – ' + t('Bewertungen von echten Nutzern.') })),
              h('li', {}, h('b', { text: 'ScamAdviser' }), h('span', { text: ' – ' + t('Prüft Betrugs-Anzeichen und Alter der Seite.') })),
              h('li', {}, h('b', { text: 'Google Safe Browsing' }), h('span', { text: ' – ' + t('Googles Liste gefährlicher Seiten.') })),
              h('li', {}, h('b', { text: 'VirusTotal' }), h('span', { text: ' – ' + t('Fragt viele Virenscanner auf einmal.') }))),
            h('div', { class: 'modal-btns' }, h('button', { class: 'btn primary', type: 'button', onclick: close }, t('Schließen')))));
        document.addEventListener('keydown', onKey);
        document.body.append(box);
      }

      function cleanup() {
        try { R.video.pause(); } catch { /* ignore */ }
        if (S.url) URL.revokeObjectURL(S.url);
      }

      /* ---------- Video laden ---------- */
      async function loadVideo(file) {
        warn(R.vWarn, ''); R.steps.hidden = true; R.use.hidden = true; R.save.hidden = true; S.zip = null;
        const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';
        const mime = file.type || '';
        S.ext = ext === 'm4v' ? 'm4v' : ext === 'webm' || /webm/.test(mime) ? 'webm' : ext === 'ogv' || /ogg/.test(mime) ? 'ogv' : ext === 'mp4' || /mp4/.test(mime) ? 'mp4' : '';
        if (!S.ext) return warn(R.vWarn, t('Das Video hat ein Format, das der Pack nicht kennt (mp4, webm).'));
        if (S.url) URL.revokeObjectURL(S.url);
        S.file = file; S.url = URL.createObjectURL(file); S.buf = null; S.lines = [];
        R.video.hidden = false; R.video.src = S.url;
        const ok = await new Promise((res) => { R.video.onloadedmetadata = () => res(true); R.video.onerror = () => res(false); setTimeout(() => res(false), 15000); });
        if (!ok || !isFinite(R.video.duration)) { R.video.hidden = true; return warn(R.vWarn, t('Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.')); }
        S.dur = R.video.duration;
        S.title = S.title || file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');
        R.title.value = S.title;
        R.vInfo.textContent = t('Dauer {d} s', { d: fmt(S.dur) }) + ' · ' + t('Ton wird gelesen …');
        R.steps.hidden = false; renderLines(); updateAddLabel();
        try { await VD.audio.ensure(); S.buf = await VD.audio.decode(await file.arrayBuffer()); R.vInfo.textContent = t('Dauer {d} s', { d: fmt(S.dur) }); }
        catch { S.buf = null; R.vInfo.textContent = t('Dauer {d} s', { d: fmt(S.dur) }); warn(R.vWarn, t('Der Browser kann den Ton dieses Videos nicht lesen. Lade bei „Ton“ eine eigene Stimmenspur.')); }
      }
      R.video.addEventListener('timeupdate', () => { updateAddLabel(); if (stopAt != null && R.video.currentTime >= stopAt) { R.video.pause(); stopAt = null; } });
      function updateAddLabel() { R.addBtn.textContent = '+ ' + t('Zeile bei {s} s hinzufügen', { s: fmt(R.video.currentTime || 0) }); }

      /* ---------- Zeilen ---------- */
      const newLine = (start, end, text, char) => ({ id: VD.uid(), start, end, text: text || '', char: char || S.chars[0] });
      function sortLines() { S.lines.sort((a, b) => a.start - b.start); }
      function addLine() {
        const s = clamp(R.video.currentTime || 0, 0, Math.max(0, S.dur - 0.5));
        S.lines.push(newLine(s, Math.min(S.dur, s + 2.5), '', S.chars[0])); sortLines(); renderLines();
      }
      function playLine(l) { R.video.currentTime = l.start; stopAt = l.end + TAIL; R.video.play().catch(() => {}); }

      function renderLines() {
        if (!S.lines.length) { R.list.replaceChildren(h('p', { class: 'muted', text: t('Noch keine Zeilen. Importiere eine Untertitel-Datei oder füge Zeilen von Hand hinzu.') })); return; }
        const num = (val, label, onset) => {
          const inp = h('input', { class: 'inp mk-num', type: 'number', step: '0.01', min: '0', value: fmt(val), 'aria-label': label, oninput: (e) => { const v = parseFloat(e.target.value); if (isFinite(v)) onset(Math.max(0, v)); } });
          const now = h('button', { class: 'icon-btn mk-now', type: 'button', title: t('Auf die aktuelle Position im Video setzen'), 'aria-label': t('Auf die aktuelle Position im Video setzen'), onclick: () => { const v = Math.round((R.video.currentTime || 0) * 100) / 100; inp.value = fmt(v); onset(v); } }, '⏱');
          return h('div', { class: 'mk-numwrap' }, h('span', { class: 'field-l', text: label }), h('div', { class: 'mk-numrow' }, inp, now));
        };
        R.list.replaceChildren(...S.lines.map((l, i) => {
          const sel = h('select', { class: 'inp mk-sel', 'aria-label': t('Charakter'), onchange: (e) => { l.char = e.target.value; } }, ...S.chars.map((c) => h('option', { value: c, selected: c === l.char, text: c })));
          return h('div', { class: 'mk-line' },
            h('span', { class: 'mk-n', text: String(i + 1) }),
            h('button', { class: 'icon-btn', type: 'button', title: t('Zeile anhören'), 'aria-label': t('Zeile anhören'), onclick: () => playLine(l) }, '▶'),
            num(l.start, t('Start'), (v) => { l.start = v; }), num(l.end, t('Ende'), (v) => { l.end = v; }),
            h('label', { class: 'mk-text' }, h('span', { class: 'field-l', text: t('Text') }), h('input', { class: 'inp', value: l.text, maxlength: 240, oninput: (e) => { l.text = e.target.value; } })),
            h('label', { class: 'mk-char' }, h('span', { class: 'field-l', text: t('Charakter') }), sel),
            h('button', { class: 'icon-btn', type: 'button', title: t('Zeile löschen'), 'aria-label': t('Zeile löschen'), onclick: () => { S.lines = S.lines.filter((x) => x !== l); renderLines(); } }, '✕'));
        }));
      }

      /* ---------- Charaktere ---------- */
      function renderChars() {
        R.chars.replaceChildren(...S.chars.map((c, i) => h('div', { class: 'mk-char-row' },
          h('input', { class: 'inp', value: c, maxlength: 30, 'aria-label': t('Charakter'), onchange: (e) => {
            const v = e.target.value.trim().slice(0, 30);
            if (!v || S.chars.some((x, j) => j !== i && x.toLowerCase() === v.toLowerCase())) { e.target.value = c; return; }
            S.lines.forEach((l) => { if (l.char === c) l.char = v; }); S.chars[i] = v; renderChars(); renderLines();
          } }),
          h('button', { class: 'icon-btn', type: 'button', disabled: S.chars.length < 2, title: t('Charakter entfernen'), 'aria-label': t('Charakter entfernen'), onclick: () => {
            const rest = S.chars.filter((_, j) => j !== i); S.lines.forEach((l) => { if (l.char === c) l.char = rest[0]; }); S.chars = rest; renderChars(); renderLines();
          } }, '✕'))));
      }

      async function importSubs(file) {
        warn(R.warn2, '');
        try {
          const ls = parseSubs(await file.text()).filter((l) => l.start < S.dur + 0.5);
          if (!ls.length) return warn(R.warn2, t('In der Datei wurden keine Zeilen gefunden.'));
          S.lines = ls.map((l) => newLine(Math.round(l.start * 100) / 100, Math.round(Math.min(S.dur, l.end) * 100) / 100, l.text, S.chars[0]));
          renderLines(); R.status2.textContent = t('{n} Zeilen importiert.', { n: S.lines.length });
        } catch (e) { warn(R.warn2, t('Datei kann nicht gelesen werden: {n}', { n: file.name })); }
        R.subFile.value = '';
      }

      /* ---------- Ton ---------- */
      function renderAudioHints() {
        R.voiceRow.hidden = S.voiceMode !== 'file'; R.backRow.hidden = S.backMode !== 'file';
        R.voiceHint.textContent = S.voiceMode === 'file' ? t('Nur Stimmen, ohne Musik. Dann sind die Original-Zeilen sauberer. Die Datei muss gleich lang sein wie das Video und gleich beginnen.') : '';
        R.backHint.textContent = S.backMode === 'mute' ? t('Das Original wird an den Stellen stummgeschaltet, an denen gesprochen wird. Dort fehlt auch die Musik. Mit einer eigenen Hintergrundspur klingt es besser.')
          : S.backMode === 'file' ? t('Nur Musik und Geräusche, ohne Stimmen. Die Datei muss gleich lang sein wie das Video und gleich beginnen.') : t('Die Szene hat dann nur die Stimmen der Spieler.');
      }
      async function loadAudioFile(file, which) {
        warn(R.audWarn, '');
        try {
          await VD.audio.ensure();
          const buf = await VD.audio.decode(await file.arrayBuffer());
          if (which === 'voice') { S.voiceBuf = buf; R.voiceBtn.textContent = file.name; } else { S.backBuf = buf; R.backBtn.textContent = file.name; }
        } catch { warn(R.audWarn, t('Datei kann nicht gelesen werden: {n}', { n: file.name })); }
      }

      /* ---------- Pack bauen ---------- */
      function validate() {
        if (!S.file) return t('Bitte zuerst ein Video wählen.');
        if (!S.lines.length) return t('Es gibt noch keine Zeilen.');
        const ls = S.lines.slice().sort((a, b) => a.start - b.start);
        for (let i = 0; i < ls.length; i++) {
          const l = ls[i];
          if (!(l.end - l.start >= 0.1)) return t('Zeile {n}: Das Ende muss nach dem Start liegen.', { n: i + 1 });
          if (l.start > S.dur) return t('Zeile {n}: Der Start liegt hinter dem Ende des Videos.', { n: i + 1 });
          if (!l.text.trim()) return t('Zeile {n}: Bitte einen Text eintragen.', { n: i + 1 });
        }
        if (!(S.voiceMode === 'file' ? S.voiceBuf : S.buf)) return t('Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.');
        return '';
      }

      async function buildZip(onStatus) {
        const ls = S.lines.slice().sort((a, b) => a.start - b.start).map((l) => ({ ...l, start: Math.max(0, l.start), end: Math.min(S.dur + 1, l.end) }));
        const voice = S.voiceMode === 'file' && S.voiceBuf ? S.voiceBuf : S.buf;
        const title = (S.title || 'Dub-Pack').trim().slice(0, 80);
        const dir = safeName(title);
        const zip = new JSZip();
        const f = zip.folder(dir);
        const STORE = { compression: 'STORE' };
        const q = (s) => JSON.stringify(String(s));   // Text im Format der ini-Dateien
        f.file('_pack_info.ini', `[data]\n\ntitle=${q(title)}\nicon="icon.png"\nauthors=${S.author.trim() ? '[' + q(S.author.trim().slice(0, 40)) + ']' : '[]'}\n`);
        f.file('dub_video.' + S.ext, S.file, STORE);
        const per = new Map(); const pad = ls.length > 99 ? 3 : 2;
        for (let i = 0; i < ls.length; i++) {
          const l = ls[i];
          onStatus(t('Baue Zeile {n}/{total} …', { n: i + 1, total: ls.length }));
          const k = (per.get(l.char) || 0) + 1; per.set(l.char, k);
          const stem = String(i + 1).padStart(pad, '0') + '_' + (slug(l.char) || 'sprecher') + '-' + k;
          const mono = monoOf(voice, l.start, l.end + TAIL);
          const clip = await VD.audio.resample(mono, voice.sampleRate, CLIP_SR);
          f.file(stem + '.wav', wavBlob([clip], CLIP_SR));
          f.file(stem + '.ini', `[data]\n\ncaption=${q(l.text.trim())}\ndub_timestamps=[${(Math.round(l.start * 1000) / 1000).toFixed(3)}]\ndub_characters=[${q(l.char)}]\n`);
          try { f.file(stem + '.jpg', await frameAt(S.url, l.start + 0.1, 960, false), STORE); } catch { /* Standbild ist optional */ }
          await VD.sleep(0);
        }
        try { f.file('icon.png', await frameAt(S.url, ls[0].start + 0.1, 256, true), STORE); } catch { /* optional */ }
        if (S.backMode !== 'none') {
          onStatus(t('Baue Hintergrund …'));
          const src = S.backMode === 'file' && S.backBuf ? S.backBuf : S.buf;
          if (src) {
            const chans = [];
            for (let c = 0; c < Math.min(2, src.numberOfChannels); c++) chans.push(await VD.audio.resample(src.getChannelData(c).slice(), src.sampleRate, CLIP_SR));
            if (S.backMode === 'mute') {
              const fade = Math.round(0.03 * CLIP_SR);
              for (const d of chans) {
                for (const l of ls) {
                  const a = Math.round((l.start - 0.03) * CLIP_SR), b = Math.round((l.end + TAIL + 0.02) * CLIP_SR);
                  for (let i = Math.max(0, a - fade); i < Math.min(d.length, b + fade); i++) {
                    const g = i < a ? (a - i) / fade : i > b ? (i - b) / fade : 0;
                    d[i] *= g;
                  }
                }
              }
            }
            f.file('_backing_track.wav', wavBlob(chans, CLIP_SR));
          }
        }
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } }, (m) => onStatus(t('Packe alles zusammen … {p} %', { p: Math.round(m.percent) })));
        return { blob, name: dir + '.zip' };
      }

      async function onBuild() {
        warn(R.warn5, ''); R.status5.textContent = '';
        const bad = validate();
        if (bad) return warn(R.warn5, bad);
        S.busy = true; R.build.disabled = true; R.build.classList.add('busy'); R.use.hidden = true; R.save.hidden = true;
        try {
          S.zip = await buildZip((s) => { R.status5.textContent = s; });
          R.status5.textContent = t('Der Pack ist fertig. Du kannst ihn gleich im Spiel verwenden oder als ZIP speichern.');
          R.use.hidden = false; R.save.hidden = false;
        } catch (e) { console.error(e); R.status5.textContent = ''; warn(R.warn5, t('Bau fehlgeschlagen: {e}', { e: e.message || e })); }
        finally { S.busy = false; R.build.disabled = false; R.build.classList.remove('busy'); }
      }
      async function onUse() {
        if (!S.zip) return;
        R.use.disabled = true;
        try {
          await VD.Packs.importFiles([new File([S.zip.blob], S.zip.name, { type: 'application/zip' })], (s) => { R.status5.textContent = s; });
          R.status5.textContent = t('Der Pack liegt jetzt in deiner Pack-Liste. Erstelle einen Raum, dann kannst du ihn auswählen.');
          VD.toast(R.status5.textContent);
        } catch (e) { console.error(e); warn(R.warn5, t('Bau fehlgeschlagen: {e}', { e: e.message || e })); }
        R.use.disabled = false;
      }
      function onSave() { if (S.zip) VD.Export.save(S.zip.blob, S.zip.name); }

      VD.Maker._state = S;   // für Tests und die Fehlersuche in der Konsole
    }
  };
})();
