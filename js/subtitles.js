/* Untertitel erstellen (Reiter im Dub-Pack-Ersteller).
   Erkennt Sprache in einem Video oder einer Audiodatei mit dem Whisper-Modell von OpenAI, direkt im Browser (Transformers.js, siehe js/whisper-worker.js).
   Die Datei wird nicht hochgeladen. Nur das Sprachmodell wird beim ersten Mal von Hugging Face geladen und danach im Browser zwischengespeichert.
   Entfernen: Datei löschen und die Zeile <script src="js/subtitles.js"> in index.html entfernen. Der Ersteller läuft dann ohne diesen Reiter. */
(function () {
  const VD = (window.VD = window.VD || {});
  const WORKER_URL = new URL('whisper-worker.js', (document.currentScript && document.currentScript.src) || document.baseURI).href;

  VD.addLang('en', {
    'Spiele jede Zeile ab, prüfe den Text und passe Start und Ende an. Fehlt etwas oder ist etwas falsch, ändere die Zeile oder füge eine hinzu. Zeilen, die nicht stimmen, kannst du löschen.': 'Play each line, check the text and adjust start and end. If something is missing or wrong, change the line or add one. You can delete lines that are wrong.',
    'Untertitel erstellen': 'Create subtitles',
    'Dub-Pack bauen': 'Build dub pack',
    'Erzeuge Untertitel aus der Sprache in einem Video oder einer Audiodatei. Die Erkennung läuft mit dem Whisper-Modell von OpenAI direkt in deinem Browser, deine Datei wird nicht hochgeladen.': 'Create subtitles from the speech in a video or an audio file. Recognition runs with OpenAI’s Whisper model right in your browser, your file is not uploaded.',
    '1  Datei und Einstellungen': '1  File and settings',
    'Video oder Audio wählen': 'Choose video or audio',
    'Genauigkeit': 'Accuracy',
    'Schnell': 'Fast', 'Ausgewogen': 'Balanced', 'Genau': 'Accurate',
    'etwa {mb} MB': 'about {mb} MB',
    'Sprache im Video': 'Language in the video',
    'Automatisch erkennen': 'Detect automatically',
    'Beim ersten Mal wird das Sprachmodell heruntergeladen und danach im Browser gespeichert. Das braucht Datenvolumen. Je genauer, desto größer und langsamer. Am Handy dauert es lange, am besten nimmst du einen Computer.': 'The first time, the language model is downloaded and then kept in the browser. This uses data. The more accurate, the bigger and slower. On a phone it takes long, a computer is best.',
    '2  Erkennen': '2  Recognise',
    'Untertitel erzeugen': 'Create subtitles',
    'Abbrechen': 'Cancel',
    'Bitte zuerst eine Datei wählen.': 'Please choose a file first.',
    'Ton wird vorbereitet …': 'Preparing the sound …',
    'Modell wird geladen … {p} %': 'Loading the model … {p} %',
    'Sprache wird erkannt … {p} %': 'Recognising speech … {p} %',
    'Fertig: {n} Zeilen in {s} Sekunden.': 'Done: {n} lines in {s} seconds.',
    'Abgebrochen.': 'Cancelled.',
    'Der Ton dieser Datei kann nicht gelesen werden.': 'The sound of this file cannot be read.',
    'Das Modell konnte nicht geladen werden. Prüfe die Internetverbindung. Technische Meldung: {e}': 'The model could not be loaded. Check your internet connection. Technical message: {e}',
    'Die Erkennung ist fehlgeschlagen: {e}': 'Recognition failed: {e}',
    'Es wurde keine Sprache erkannt.': 'No speech was found.',
    'Dein Browser kann das nicht ausführen.': 'Your browser cannot run this.',
    '3  Ergebnis': '3  Result',
    'Der erkannte Text kann vom Gesprochenen abweichen. Prüfe ihn und korrigiere ihn hier. Zeilen, die nicht stimmen, kannst du löschen.': 'The recognised text can differ from what was said. Check it and correct it here. You can delete lines that are wrong.',
    '.srt speichern': 'Save .srt',
    '.vtt speichern': 'Save .vtt',
    'In den Ersteller übernehmen': 'Use in the builder',
    'Zeile löschen': 'Delete line',
    'Text der Zeile {n}': 'Text of line {n}',
    '{n} Zeilen in den Ersteller übernommen.': '{n} lines added to the builder.',
    'Zum Übernehmen zuerst im Reiter „Dub-Pack bauen“ ein Video laden.': 'To use the lines, first load a video in the “Build dub pack” tab.',
    'Whisper von OpenAI, Lizenz MIT. Ausgeführt mit Transformers.js und ONNX Runtime.': 'Whisper by OpenAI, MIT licence. Run with Transformers.js and ONNX Runtime.'
  });
  VD.addLang('es', {
    'Spiele jede Zeile ab, prüfe den Text und passe Start und Ende an. Fehlt etwas oder ist etwas falsch, ändere die Zeile oder füge eine hinzu. Zeilen, die nicht stimmen, kannst du löschen.': 'Reproduce cada línea, revisa el texto y ajusta el inicio y el final. Si falta algo o está mal, cambia la línea o añade una. Puedes borrar las líneas incorrectas.',
    'Untertitel erstellen': 'Crear subtítulos',
    'Dub-Pack bauen': 'Crear el pack',
    'Erzeuge Untertitel aus der Sprache in einem Video oder einer Audiodatei. Die Erkennung läuft mit dem Whisper-Modell von OpenAI direkt in deinem Browser, deine Datei wird nicht hochgeladen.': 'Crea subtítulos a partir de la voz de un vídeo o un archivo de audio. El reconocimiento usa el modelo Whisper de OpenAI directamente en tu navegador, tu archivo no se sube.',
    '1  Datei und Einstellungen': '1  Archivo y ajustes',
    'Video oder Audio wählen': 'Elegir vídeo o audio',
    'Genauigkeit': 'Precisión',
    'Schnell': 'Rápido', 'Ausgewogen': 'Equilibrado', 'Genau': 'Preciso',
    'etwa {mb} MB': 'unos {mb} MB',
    'Sprache im Video': 'Idioma del vídeo',
    'Automatisch erkennen': 'Detectar automáticamente',
    'Beim ersten Mal wird das Sprachmodell heruntergeladen und danach im Browser gespeichert. Das braucht Datenvolumen. Je genauer, desto größer und langsamer. Am Handy dauert es lange, am besten nimmst du einen Computer.': 'La primera vez se descarga el modelo de idioma y luego se guarda en el navegador. Gasta datos. Cuanto más preciso, más grande y lento. En el móvil tarda mucho, lo mejor es un ordenador.',
    '2  Erkennen': '2  Reconocer',
    'Untertitel erzeugen': 'Crear subtítulos',
    'Abbrechen': 'Cancelar',
    'Bitte zuerst eine Datei wählen.': 'Primero elige un archivo.',
    'Ton wird vorbereitet …': 'Preparando el sonido …',
    'Modell wird geladen … {p} %': 'Cargando el modelo … {p} %',
    'Sprache wird erkannt … {p} %': 'Reconociendo la voz … {p} %',
    'Fertig: {n} Zeilen in {s} Sekunden.': 'Listo: {n} líneas en {s} segundos.',
    'Abgebrochen.': 'Cancelado.',
    'Der Ton dieser Datei kann nicht gelesen werden.': 'No se puede leer el sonido de este archivo.',
    'Das Modell konnte nicht geladen werden. Prüfe die Internetverbindung. Technische Meldung: {e}': 'No se pudo cargar el modelo. Revisa tu conexión a internet. Mensaje técnico: {e}',
    'Die Erkennung ist fehlgeschlagen: {e}': 'El reconocimiento falló: {e}',
    'Es wurde keine Sprache erkannt.': 'No se detectó voz.',
    'Dein Browser kann das nicht ausführen.': 'Tu navegador no puede ejecutar esto.',
    '3  Ergebnis': '3  Resultado',
    'Der erkannte Text kann vom Gesprochenen abweichen. Prüfe ihn und korrigiere ihn hier. Zeilen, die nicht stimmen, kannst du löschen.': 'El texto reconocido puede diferir de lo dicho. Revísalo y corrígelo aquí. Puedes borrar las líneas que no sean correctas.',
    '.srt speichern': 'Guardar .srt',
    '.vtt speichern': 'Guardar .vtt',
    'In den Ersteller übernehmen': 'Usar en el creador',
    'Zeile löschen': 'Borrar línea',
    'Text der Zeile {n}': 'Texto de la línea {n}',
    '{n} Zeilen in den Ersteller übernommen.': '{n} líneas añadidas al creador.',
    'Zum Übernehmen zuerst im Reiter „Dub-Pack bauen“ ein Video laden.': 'Para usar las líneas, primero carga un vídeo en la pestaña «Crear el pack».',
    'Whisper von OpenAI, Lizenz MIT. Ausgeführt mit Transformers.js und ONNX Runtime.': 'Whisper de OpenAI, licencia MIT. Ejecutado con Transformers.js y ONNX Runtime.'
  });
  VD.addLang('fr', {
    'Spiele jede Zeile ab, prüfe den Text und passe Start und Ende an. Fehlt etwas oder ist etwas falsch, ändere die Zeile oder füge eine hinzu. Zeilen, die nicht stimmen, kannst du löschen.': 'Écoute chaque ligne, vérifie le texte et ajuste le début et la fin. S’il manque quelque chose ou si c’est faux, modifie la ligne ou ajoutes-en une. Tu peux supprimer les lignes incorrectes.',
    'Untertitel erstellen': 'Créer des sous-titres',
    'Dub-Pack bauen': 'Créer le pack',
    'Erzeuge Untertitel aus der Sprache in einem Video oder einer Audiodatei. Die Erkennung läuft mit dem Whisper-Modell von OpenAI direkt in deinem Browser, deine Datei wird nicht hochgeladen.': 'Crée des sous-titres à partir de la voix d’une vidéo ou d’un fichier audio. La reconnaissance utilise le modèle Whisper d’OpenAI directement dans ton navigateur, ton fichier n’est pas envoyé.',
    '1  Datei und Einstellungen': '1  Fichier et réglages',
    'Video oder Audio wählen': 'Choisir une vidéo ou un audio',
    'Genauigkeit': 'Précision',
    'Schnell': 'Rapide', 'Ausgewogen': 'Équilibré', 'Genau': 'Précis',
    'etwa {mb} MB': 'environ {mb} Mo',
    'Sprache im Video': 'Langue de la vidéo',
    'Automatisch erkennen': 'Détecter automatiquement',
    'Beim ersten Mal wird das Sprachmodell heruntergeladen und danach im Browser gespeichert. Das braucht Datenvolumen. Je genauer, desto größer und langsamer. Am Handy dauert es lange, am besten nimmst du einen Computer.': 'La première fois, le modèle de langue est téléchargé puis conservé dans le navigateur. Cela consomme des données. Plus il est précis, plus il est gros et lent. Sur un téléphone, c’est long, un ordinateur est préférable.',
    '2  Erkennen': '2  Reconnaître',
    'Untertitel erzeugen': 'Créer des sous-titres',
    'Abbrechen': 'Annuler',
    'Bitte zuerst eine Datei wählen.': 'Choisis d’abord un fichier.',
    'Ton wird vorbereitet …': 'Préparation du son …',
    'Modell wird geladen … {p} %': 'Chargement du modèle … {p} %',
    'Sprache wird erkannt … {p} %': 'Reconnaissance de la voix … {p} %',
    'Fertig: {n} Zeilen in {s} Sekunden.': 'Terminé : {n} lignes en {s} secondes.',
    'Abgebrochen.': 'Annulé.',
    'Der Ton dieser Datei kann nicht gelesen werden.': 'Le son de ce fichier ne peut pas être lu.',
    'Das Modell konnte nicht geladen werden. Prüfe die Internetverbindung. Technische Meldung: {e}': 'Le modèle n’a pas pu être chargé. Vérifie ta connexion internet. Message technique : {e}',
    'Die Erkennung ist fehlgeschlagen: {e}': 'La reconnaissance a échoué : {e}',
    'Es wurde keine Sprache erkannt.': 'Aucune voix n’a été détectée.',
    'Dein Browser kann das nicht ausführen.': 'Ton navigateur ne peut pas l’exécuter.',
    '3  Ergebnis': '3  Résultat',
    'Der erkannte Text kann vom Gesprochenen abweichen. Prüfe ihn und korrigiere ihn hier. Zeilen, die nicht stimmen, kannst du löschen.': 'Le texte reconnu peut différer de ce qui a été dit. Vérifie-le et corrige-le ici. Tu peux supprimer les lignes incorrectes.',
    '.srt speichern': 'Enregistrer en .srt',
    '.vtt speichern': 'Enregistrer en .vtt',
    'In den Ersteller übernehmen': 'Utiliser dans le créateur',
    'Zeile löschen': 'Supprimer la ligne',
    'Text der Zeile {n}': 'Texte de la ligne {n}',
    '{n} Zeilen in den Ersteller übernommen.': '{n} lignes ajoutées au créateur.',
    'Zum Übernehmen zuerst im Reiter „Dub-Pack bauen“ ein Video laden.': 'Pour utiliser les lignes, charge d’abord une vidéo dans l’onglet « Créer le pack ».',
    'Whisper von OpenAI, Lizenz MIT. Ausgeführt mit Transformers.js und ONNX Runtime.': 'Whisper d’OpenAI, licence MIT. Exécuté avec Transformers.js et ONNX Runtime.'
  });
  VD.addLang('pt', {
    'Spiele jede Zeile ab, prüfe den Text und passe Start und Ende an. Fehlt etwas oder ist etwas falsch, ändere die Zeile oder füge eine hinzu. Zeilen, die nicht stimmen, kannst du löschen.': 'Reproduza cada linha, confira o texto e ajuste o início e o fim. Se faltar algo ou estiver errado, altere a linha ou adicione uma. Você pode apagar as linhas erradas.',
    'Untertitel erstellen': 'Criar legendas',
    'Dub-Pack bauen': 'Criar o pack',
    'Erzeuge Untertitel aus der Sprache in einem Video oder einer Audiodatei. Die Erkennung läuft mit dem Whisper-Modell von OpenAI direkt in deinem Browser, deine Datei wird nicht hochgeladen.': 'Crie legendas a partir da fala de um vídeo ou arquivo de áudio. O reconhecimento usa o modelo Whisper da OpenAI direto no seu navegador, seu arquivo não é enviado.',
    '1  Datei und Einstellungen': '1  Arquivo e ajustes',
    'Video oder Audio wählen': 'Escolher vídeo ou áudio',
    'Genauigkeit': 'Precisão',
    'Schnell': 'Rápido', 'Ausgewogen': 'Equilibrado', 'Genau': 'Preciso',
    'etwa {mb} MB': 'cerca de {mb} MB',
    'Sprache im Video': 'Idioma do vídeo',
    'Automatisch erkennen': 'Detectar automaticamente',
    'Beim ersten Mal wird das Sprachmodell heruntergeladen und danach im Browser gespeichert. Das braucht Datenvolumen. Je genauer, desto größer und langsamer. Am Handy dauert es lange, am besten nimmst du einen Computer.': 'Na primeira vez, o modelo de idioma é baixado e depois guardado no navegador. Isso gasta dados. Quanto mais preciso, maior e mais lento. No celular demora muito, o melhor é um computador.',
    '2  Erkennen': '2  Reconhecer',
    'Untertitel erzeugen': 'Criar legendas',
    'Abbrechen': 'Cancelar',
    'Bitte zuerst eine Datei wählen.': 'Escolha um arquivo primeiro.',
    'Ton wird vorbereitet …': 'Preparando o som …',
    'Modell wird geladen … {p} %': 'Carregando o modelo … {p} %',
    'Sprache wird erkannt … {p} %': 'Reconhecendo a fala … {p} %',
    'Fertig: {n} Zeilen in {s} Sekunden.': 'Pronto: {n} linhas em {s} segundos.',
    'Abgebrochen.': 'Cancelado.',
    'Der Ton dieser Datei kann nicht gelesen werden.': 'Não é possível ler o som deste arquivo.',
    'Das Modell konnte nicht geladen werden. Prüfe die Internetverbindung. Technische Meldung: {e}': 'Não foi possível carregar o modelo. Verifique sua conexão com a internet. Mensagem técnica: {e}',
    'Die Erkennung ist fehlgeschlagen: {e}': 'O reconhecimento falhou: {e}',
    'Es wurde keine Sprache erkannt.': 'Nenhuma fala foi detectada.',
    'Dein Browser kann das nicht ausführen.': 'Seu navegador não consegue executar isso.',
    '3  Ergebnis': '3  Resultado',
    'Der erkannte Text kann vom Gesprochenen abweichen. Prüfe ihn und korrigiere ihn hier. Zeilen, die nicht stimmen, kannst du löschen.': 'O texto reconhecido pode diferir do que foi dito. Confira e corrija aqui. Você pode apagar as linhas que estiverem erradas.',
    '.srt speichern': 'Salvar .srt',
    '.vtt speichern': 'Salvar .vtt',
    'In den Ersteller übernehmen': 'Usar no criador',
    'Zeile löschen': 'Apagar linha',
    'Text der Zeile {n}': 'Texto da linha {n}',
    '{n} Zeilen in den Ersteller übernommen.': '{n} linhas adicionadas ao criador.',
    'Zum Übernehmen zuerst im Reiter „Dub-Pack bauen“ ein Video laden.': 'Para usar as linhas, primeiro carregue um vídeo na aba “Criar o pack”.',
    'Whisper von OpenAI, Lizenz MIT. Ausgeführt mit Transformers.js und ONNX Runtime.': 'Whisper da OpenAI, licença MIT. Executado com Transformers.js e ONNX Runtime.'
  });
  VD.addLang('ru', {
    'Spiele jede Zeile ab, prüfe den Text und passe Start und Ende an. Fehlt etwas oder ist etwas falsch, ändere die Zeile oder füge eine hinzu. Zeilen, die nicht stimmen, kannst du löschen.': 'Прослушайте каждую строку, проверьте текст и поправьте начало и конец. Если чего-то не хватает или что-то неверно, измените строку или добавьте новую. Неверные строки можно удалить.',
    'Untertitel erstellen': 'Создать субтитры',
    'Dub-Pack bauen': 'Собрать пак',
    'Erzeuge Untertitel aus der Sprache in einem Video oder einer Audiodatei. Die Erkennung läuft mit dem Whisper-Modell von OpenAI direkt in deinem Browser, deine Datei wird nicht hochgeladen.': 'Создайте субтитры по речи из видео или аудиофайла. Распознавание выполняет модель Whisper от OpenAI прямо в вашем браузере, файл никуда не загружается.',
    '1  Datei und Einstellungen': '1  Файл и настройки',
    'Video oder Audio wählen': 'Выбрать видео или аудио',
    'Genauigkeit': 'Точность',
    'Schnell': 'Быстро', 'Ausgewogen': 'Сбалансированно', 'Genau': 'Точно',
    'etwa {mb} MB': 'около {mb} МБ',
    'Sprache im Video': 'Язык в видео',
    'Automatisch erkennen': 'Определить автоматически',
    'Beim ersten Mal wird das Sprachmodell heruntergeladen und danach im Browser gespeichert. Das braucht Datenvolumen. Je genauer, desto größer und langsamer. Am Handy dauert es lange, am besten nimmst du einen Computer.': 'В первый раз языковая модель загружается и затем сохраняется в браузере. Это расходует трафик. Чем точнее модель, тем она больше и медленнее. На телефоне это долго, лучше использовать компьютер.',
    '2  Erkennen': '2  Распознавание',
    'Untertitel erzeugen': 'Создать субтитры',
    'Abbrechen': 'Отмена',
    'Bitte zuerst eine Datei wählen.': 'Сначала выберите файл.',
    'Ton wird vorbereitet …': 'Подготовка звука …',
    'Modell wird geladen … {p} %': 'Загрузка модели … {p} %',
    'Sprache wird erkannt … {p} %': 'Распознавание речи … {p} %',
    'Fertig: {n} Zeilen in {s} Sekunden.': 'Готово: {n} строк за {s} с.',
    'Abgebrochen.': 'Отменено.',
    'Der Ton dieser Datei kann nicht gelesen werden.': 'Не удаётся прочитать звук этого файла.',
    'Das Modell konnte nicht geladen werden. Prüfe die Internetverbindung. Technische Meldung: {e}': 'Не удалось загрузить модель. Проверьте подключение к интернету. Техническое сообщение: {e}',
    'Die Erkennung ist fehlgeschlagen: {e}': 'Распознавание не удалось: {e}',
    'Es wurde keine Sprache erkannt.': 'Речь не обнаружена.',
    'Dein Browser kann das nicht ausführen.': 'Ваш браузер не может это выполнить.',
    '3  Ergebnis': '3  Результат',
    'Der erkannte Text kann vom Gesprochenen abweichen. Prüfe ihn und korrigiere ihn hier. Zeilen, die nicht stimmen, kannst du löschen.': 'Распознанный текст может отличаться от сказанного. Проверьте и исправьте его здесь. Неверные строки можно удалить.',
    '.srt speichern': 'Сохранить .srt',
    '.vtt speichern': 'Сохранить .vtt',
    'In den Ersteller übernehmen': 'Использовать в конструкторе',
    'Zeile löschen': 'Удалить строку',
    'Text der Zeile {n}': 'Текст строки {n}',
    '{n} Zeilen in den Ersteller übernommen.': 'Строк добавлено в конструктор: {n}.',
    'Zum Übernehmen zuerst im Reiter „Dub-Pack bauen“ ein Video laden.': 'Чтобы использовать строки, сначала загрузите видео на вкладке «Собрать пак».',
    'Whisper von OpenAI, Lizenz MIT. Ausgeführt mit Transformers.js und ONNX Runtime.': 'Whisper от OpenAI, лицензия MIT. Работает на Transformers.js и ONNX Runtime.'
  });
  VD.addLang('hi', {
    'Spiele jede Zeile ab, prüfe den Text und passe Start und Ende an. Fehlt etwas oder ist etwas falsch, ändere die Zeile oder füge eine hinzu. Zeilen, die nicht stimmen, kannst du löschen.': 'हर पंक्ति को चलाकर सुनें, टेक्स्ट जाँचें और शुरुआत व अंत ठीक करें। कुछ छूटा या गलत हो तो पंक्ति बदलें या नई जोड़ें। गलत पंक्तियाँ हटा सकते हैं।',
    'Untertitel erstellen': 'सबटाइटल बनाएँ',
    'Dub-Pack bauen': 'पैक बनाएँ',
    'Erzeuge Untertitel aus der Sprache in einem Video oder einer Audiodatei. Die Erkennung läuft mit dem Whisper-Modell von OpenAI direkt in deinem Browser, deine Datei wird nicht hochgeladen.': 'किसी वीडियो या ऑडियो फ़ाइल की आवाज़ से सबटाइटल बनाएँ। पहचान OpenAI के Whisper मॉडल से सीधे आपके ब्राउज़र में होती है, आपकी फ़ाइल अपलोड नहीं होती।',
    '1  Datei und Einstellungen': '1  फ़ाइल और सेटिंग',
    'Video oder Audio wählen': 'वीडियो या ऑडियो चुनें',
    'Genauigkeit': 'सटीकता',
    'Schnell': 'तेज़', 'Ausgewogen': 'संतुलित', 'Genau': 'सटीक',
    'etwa {mb} MB': 'लगभग {mb} MB',
    'Sprache im Video': 'वीडियो की भाषा',
    'Automatisch erkennen': 'अपने आप पहचानें',
    'Beim ersten Mal wird das Sprachmodell heruntergeladen und danach im Browser gespeichert. Das braucht Datenvolumen. Je genauer, desto größer und langsamer. Am Handy dauert es lange, am besten nimmst du einen Computer.': 'पहली बार भाषा मॉडल डाउनलोड होता है और फिर ब्राउज़र में सहेजा जाता है। इसमें डेटा लगता है। जितना सटीक, उतना बड़ा और धीमा। फ़ोन पर बहुत समय लगता है, कंप्यूटर सबसे अच्छा है।',
    '2  Erkennen': '2  पहचान',
    'Untertitel erzeugen': 'सबटाइटल बनाएँ',
    'Abbrechen': 'रद्द करें',
    'Bitte zuerst eine Datei wählen.': 'पहले एक फ़ाइल चुनें।',
    'Ton wird vorbereitet …': 'आवाज़ तैयार हो रही है …',
    'Modell wird geladen … {p} %': 'मॉडल लोड हो रहा है … {p} %',
    'Sprache wird erkannt … {p} %': 'आवाज़ पहचानी जा रही है … {p} %',
    'Fertig: {n} Zeilen in {s} Sekunden.': 'तैयार: {s} सेकंड में {n} पंक्तियाँ।',
    'Abgebrochen.': 'रद्द किया गया।',
    'Der Ton dieser Datei kann nicht gelesen werden.': 'इस फ़ाइल की आवाज़ पढ़ी नहीं जा सकती।',
    'Das Modell konnte nicht geladen werden. Prüfe die Internetverbindung. Technische Meldung: {e}': 'मॉडल लोड नहीं हो सका। अपना इंटरनेट कनेक्शन जाँचें। तकनीकी संदेश: {e}',
    'Die Erkennung ist fehlgeschlagen: {e}': 'पहचान विफल रही: {e}',
    'Es wurde keine Sprache erkannt.': 'कोई आवाज़ नहीं मिली।',
    'Dein Browser kann das nicht ausführen.': 'आपका ब्राउज़र इसे नहीं चला सकता।',
    '3  Ergebnis': '3  नतीजा',
    'Der erkannte Text kann vom Gesprochenen abweichen. Prüfe ihn und korrigiere ihn hier. Zeilen, die nicht stimmen, kannst du löschen.': 'पहचाना गया टेक्स्ट बोले गए से अलग हो सकता है। उसे यहाँ जाँचें और सुधारें। गलत पंक्तियाँ हटा सकते हैं।',
    '.srt speichern': '.srt सहेजें',
    '.vtt speichern': '.vtt सहेजें',
    'In den Ersteller übernehmen': 'निर्माता में इस्तेमाल करें',
    'Zeile löschen': 'पंक्ति हटाएँ',
    'Text der Zeile {n}': 'पंक्ति {n} का टेक्स्ट',
    '{n} Zeilen in den Ersteller übernommen.': '{n} पंक्तियाँ निर्माता में जोड़ी गईं।',
    'Zum Übernehmen zuerst im Reiter „Dub-Pack bauen“ ein Video laden.': 'पंक्तियाँ इस्तेमाल करने के लिए पहले “पैक बनाएँ” टैब में वीडियो लोड करें।',
    'Whisper von OpenAI, Lizenz MIT. Ausgeführt mit Transformers.js und ONNX Runtime.': 'OpenAI का Whisper, MIT लाइसेंस। Transformers.js और ONNX Runtime से चलता है।'
  });

  /* ---------- Hilfsfunktionen ---------- */
  const pad = (n, w) => String(Math.floor(n)).padStart(w || 2, '0');
  const stamp = (s, comma) => {
    const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60, r = ms % 1000;
    return pad(h) + ':' + pad(m) + ':' + pad(sec) + (comma ? ',' : '.') + pad(r, 3);
  };
  const toSrt = (segs) => segs.map((s, i) => (i + 1) + '\n' + stamp(s.start, true) + ' --> ' + stamp(s.end, true) + '\n' + s.text + '\n').join('\n');
  const toVtt = (segs) => 'WEBVTT\n\n' + segs.map((s) => stamp(s.start) + ' --> ' + stamp(s.end) + '\n' + s.text + '\n').join('\n');

  /* Ton in 16000 Hz, ein Kanal (so erwartet es Whisper) */
  async function prepareAudio(file) {
    await VD.audio.ensure();
    const buf = await VD.audio.decode(await file.arrayBuffer());
    const n = Math.max(1, Math.ceil(buf.duration * 16000));
    const oc = new OfflineAudioContext(1, n, 16000);
    const src = oc.createBufferSource(); src.buffer = buf; src.connect(oc.destination); src.start();
    const out = await oc.startRendering();
    return out.getChannelData(0).slice();
  }

  /* ---------- Oberfläche ---------- */
  VD.Subtitles = {
    /* ui: { h, t, panel, note, field, warn }, hooks: { use(file, lines) -> Promise<string> } */
    create(ui, hooks) {
      const { h, t, panel, note, field, warn } = ui;
      const cfg = (window.VD_CONFIG && window.VD_CONFIG.whisper) || {};
      const models = cfg.models || [];
      const S = { file: null, url: '', media: null, dur: 0, stopAt: null, rows: [], focusId: null, ran: false, segs: [], worker: null, workerModel: '', running: false, t0: 0 };
      const R = {};

      R.warn = h('p', { class: 'warn', role: 'alert', hidden: true });
      R.fileInfo = h('p', { class: 'status' });
      R.file = h('input', { type: 'file', accept: 'video/*,audio/*,.mp4,.m4v,.webm,.ogv,.wav,.mp3,.ogg,.m4a,.flac,.opus', hidden: true, onchange: (e) => e.target.files[0] && pickFile(e.target.files[0]) });
      R.pick = h('button', { class: 'btn primary', type: 'button', onclick: () => R.file.click() }, t('Video oder Audio wählen'));

      R.model = h('select', { class: 'inp' }, ...models.map((m) => h('option', { value: m.id, text: t(m.label) + ' – ' + t('etwa {mb} MB', { mb: m.mb }) })));
      R.model.value = (models.find((m) => m.default) || models[0] || {}).id || '';
      const langNames = (() => { try { return new Intl.DisplayNames([VD.lang || 'en'], { type: 'language' }); } catch { return null; } })();
      const LANGS = cfg.languages || ['de', 'en', 'es', 'fr', 'pt', 'ru', 'hi', 'it', 'nl', 'pl', 'tr', 'ja', 'ko', 'zh', 'ar', 'uk', 'sv', 'cs'];
      R.lang = h('select', { class: 'inp' }, h('option', { value: 'auto', text: t('Automatisch erkennen') }),
        ...LANGS.map((c) => h('option', { value: c, text: (langNames && langNames.of(c)) || c })));

      R.go = h('button', { class: 'btn primary', type: 'button', onclick: () => start() }, t('Untertitel erzeugen'));
      R.stop = h('button', { class: 'btn', type: 'button', hidden: true, onclick: () => stop() }, t('Abbrechen'));
      R.bar = h('i'); R.meter = h('div', { class: 'meter mk-prog', hidden: true, role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' }, R.bar);
      R.status = h('p', { class: 'status', 'aria-live': 'polite' });

      R.list = h('div', { class: 'mk-lines mk-sub-lines' });
      R.msg = h('p', { class: 'status' });
      R.media = h('div', { class: 'mk-sub-media' });
      R.addBtn = h('button', { class: 'btn', type: 'button', onclick: () => addLine() }, '');
      R.sortBtn = h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { sortSegs(); renderResult(); } }, t('Nach Zeit sortieren'));
      R.dlSrt = h('button', { class: 'btn', type: 'button', onclick: () => save('srt') }, t('.srt speichern'));
      R.dlVtt = h('button', { class: 'btn', type: 'button', onclick: () => save('vtt') }, t('.vtt speichern'));
      R.use = h('button', { class: 'btn primary', type: 'button', onclick: () => useInBuilder() }, t('In den Ersteller übernehmen'));
      R.result = panel(t('3  Ergebnis'), note(t('Spiele jede Zeile ab, prüfe den Text und passe Start und Ende an. Fehlt etwas oder ist etwas falsch, ändere die Zeile oder füge eine hinzu. Zeilen, die nicht stimmen, kannst du löschen.')),
        R.media, h('div', { class: 'row' }, R.addBtn, R.sortBtn), R.list, h('div', { class: 'row' }, R.dlSrt, R.dlVtt, R.use), R.msg);
      R.result.hidden = true;

      const root = h('div', { class: 'mk-subs' },
        h('p', { class: 'lead mk-lead', text: t('Erzeuge Untertitel aus der Sprache in einem Video oder einer Audiodatei. Die Erkennung läuft mit dem Whisper-Modell von OpenAI direkt in deinem Browser, deine Datei wird nicht hochgeladen.') }),
        panel(t('1  Datei und Einstellungen'),
          h('div', { class: 'row' }, R.pick, R.file), R.fileInfo,
          h('div', { class: 'mk-two' }, field(t('Genauigkeit'), R.model), field(t('Sprache im Video'), R.lang)),
          note(t('Beim ersten Mal wird das Sprachmodell heruntergeladen und danach im Browser gespeichert. Das braucht Datenvolumen. Je genauer, desto größer und langsamer. Am Handy dauert es lange, am besten nimmst du einen Computer.'))),
        panel(t('2  Erkennen'), R.warn, h('div', { class: 'row' }, R.go, R.stop), R.meter, R.status),
        R.result,
        h('p', { class: 'muted mk-note', text: t('Whisper von OpenAI, Lizenz MIT. Ausgeführt mit Transformers.js und ONNX Runtime.') }));

      function pickFile(f) {
        if (S.url) URL.revokeObjectURL(S.url);
        S.file = f; S.segs = []; S.ran = false; R.result.hidden = true; warn(R.warn, ''); R.status.textContent = '';
        R.fileInfo.textContent = f.name;
        R.file.value = '';
        // Abspielbare Vorschau (Video oder Audio): Dauer anzeigen und später die Zeilen anhören
        S.url = URL.createObjectURL(f);
        const m = document.createElement(f.type.startsWith('video') || /\.(mp4|m4v|webm|ogv)$/i.test(f.name) ? 'video' : 'audio');
        m.className = 'mk-video'; m.controls = true; m.preload = 'metadata'; m.playsInline = true; m.src = S.url;
        m.onloadedmetadata = () => { if (isFinite(m.duration) && S.file === f) { S.dur = m.duration; R.fileInfo.textContent = f.name + ' · ' + t('Dauer {d} s', { d: Math.round(m.duration * 10) / 10 }); } };
        m.ontimeupdate = () => { updateAddLabel(); markActive(); if (S.stopAt != null && m.currentTime >= S.stopAt) { m.pause(); S.stopAt = null; } };
        m.onerror = () => { m.hidden = true; if (S.media === m) warn(R.warn, m.tagName === 'VIDEO' ? t('Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.') : t('Der Ton dieser Datei kann nicht gelesen werden.')); };
        S.media = m; S.dur = 0; S.stopAt = null;
        R.media.replaceChildren(m);
      }

      const setBusy = (b) => {
        S.running = b; R.go.disabled = b; R.pick.disabled = b; R.model.disabled = b; R.lang.disabled = b;
        R.stop.hidden = !b; if (!b) R.meter.hidden = true;
      };
      const setProg = (frac) => { R.meter.hidden = false; R.bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, frac)) + ')'; R.meter.setAttribute('aria-valuenow', String(Math.round(frac * 100))); };

      const CANCEL = { cancelled: true };
      function killWorker() { if (S.worker) { try { S.worker.terminate(); } catch { /* ignore */ } } S.worker = null; S.workerModel = ''; }

      /* Wartet auf Nachrichten des Arbeiters, bis fn true liefert (Fertig) oder ein Fehler kommt */
      function ensureModel(m) {
        return new Promise((resolve, reject) => {
          if (S.worker && S.workerModel === m.id) return resolve();
          killWorker();
          let w;
          try { w = new Worker(WORKER_URL, { type: 'module' }); } catch (e) { return reject(new Error(t('Dein Browser kann das nicht ausführen.'))); }
          S.worker = w; S.workerModel = m.id;
          S.abort = () => { killWorker(); reject(CANCEL); };
          w.onerror = (e) => { killWorker(); reject(new Error((e && e.message) || 'Worker')); };
          w.onmessage = (ev) => {
            const d = ev.data || {};
            if (d.type === 'progress') { setProg(d.pct / 100); R.status.textContent = t('Modell wird geladen … {p} %', { p: d.pct }); }
            else if (d.type === 'ready') { w.onmessage = null; S.abort = null; resolve(); }
            else if (d.type === 'error') { killWorker(); reject(new Error(d.message)); }
          };
          R.status.textContent = t('Modell wird geladen … {p} %', { p: 0 });
          w.postMessage({ type: 'load', model: { repos: m.repos, dtype: m.dtype } });
        });
      }

      function runRecognition(audio, language) {
        return new Promise((resolve, reject) => {
          const w = S.worker;
          S.abort = () => { killWorker(); resolve(true); };
          w.onerror = (e) => { killWorker(); reject(new Error((e && e.message) || 'Worker')); };
          w.onmessage = (ev) => {
            const d = ev.data || {};
            if (d.type === 'step') { const f = d.total ? d.done / d.total : 0; setProg(f); R.status.textContent = t('Sprache wird erkannt … {p} %', { p: Math.round(f * 100) }); }
            else if (d.type === 'segments') { S.segs = d.segments; renderResult(); }
            else if (d.type === 'done') { w.onmessage = null; S.abort = null; resolve(!!d.cancelled); }
            else if (d.type === 'error') { killWorker(); reject(new Error(d.message)); }
          };
          w.postMessage({ type: 'run', audio, language }, [audio.buffer]);
        });
      }

      async function start() {
        if (S.running) return;
        warn(R.warn, '');
        if (!S.file) return warn(R.warn, t('Bitte zuerst eine Datei wählen.'));
        const m = models.find((x) => x.id === R.model.value) || models[0];
        if (!m) return warn(R.warn, t('Dein Browser kann das nicht ausführen.'));
        S.cancelled = false; S.abort = null;
        setBusy(true); S.segs = []; R.result.hidden = true; R.msg.textContent = '';
        S.t0 = performance.now();
        let audio;
        try {
          R.status.textContent = t('Ton wird vorbereitet …'); setProg(0);
          try { audio = await prepareAudio(S.file); } catch (e) { throw Object.assign(new Error(t('Der Ton dieser Datei kann nicht gelesen werden.')), { plain: true }); }
          if (S.cancelled) throw CANCEL;
          try { await ensureModel(m); } catch (e) { if (e === CANCEL) throw e; throw Object.assign(new Error(t('Das Modell konnte nicht geladen werden. Prüfe die Internetverbindung. Technische Meldung: {e}', { e: e.message })), { plain: true }); }
          if (S.cancelled) throw CANCEL;
          setProg(0); R.status.textContent = t('Sprache wird erkannt … {p} %', { p: 0 });
          const cancelled = await runRecognition(audio, R.lang.value);
          const secs = Math.round((performance.now() - S.t0) / 100) / 10;
          if (cancelled) R.status.textContent = t('Abgebrochen.');
          else if (!S.segs.length) { R.status.textContent = ''; warn(R.warn, t('Es wurde keine Sprache erkannt.')); }
          else R.status.textContent = t('Fertig: {n} Zeilen in {s} Sekunden.', { n: S.segs.length, s: secs });
        } catch (e) {
          if (e === CANCEL) { R.status.textContent = t('Abgebrochen.'); return; }
          R.status.textContent = '';
          warn(R.warn, e.plain ? e.message : t('Die Erkennung ist fehlgeschlagen: {e}', { e: e.message }));
        } finally { S.ran = true; setBusy(false); renderResult(); }
      }

      /* Der Arbeiter ist während der Berechnung blockiert und könnte „Abbrechen“ erst nach dem Abschnitt lesen.
         Darum wird er sofort beendet; bereits erkannte Zeilen bleiben, das Modell lädt beim nächsten Start aus dem Browser-Speicher. */
      function stop() { if (!S.running) return; S.cancelled = true; if (S.abort) { const a = S.abort; S.abort = null; a(); } }

      /* ---------- Zeilen bearbeiten ---------- */
      const rnd = (x) => Math.round(x * 100) / 100;
      const fmt = (x) => String(rnd(x));
      const sortSegs = () => S.segs.sort((a, b) => a.start - b.start);
      const curTime = () => (S.media && S.media.currentTime) || 0;
      function updateAddLabel() { R.addBtn.textContent = '+ ' + t('Zeile bei {s} s hinzufügen', { s: fmt(curTime()) }); }
      function playSeg(sg) { const m = S.media; if (!m) return; m.currentTime = sg.start; S.stopAt = sg.end + 0.15; m.play().catch(() => {}); }
      function addLine() {
        const s0 = Math.max(0, curTime());
        let end = S.dur ? Math.min(S.dur, s0 + 2.5) : s0 + 2.5;
        const nxt = S.segs.filter((x) => x.start > s0).sort((a, b) => a.start - b.start)[0];
        if (nxt) end = Math.min(end, nxt.start);   // nicht in die nächste Zeile hineinragen
        const sg = { id: VD.uid(), start: rnd(s0), end: rnd(Math.max(end, s0 + 0.5)), text: '' };
        S.segs.push(sg); sortSegs(); S.focusId = sg.id; renderResult();
      }
      /* Die Zeile hervorheben, die gerade im Player läuft */
      function markActive() {
        const t0 = curTime();
        for (const [sg, el] of S.rows) el.classList.toggle('mk-line-on', t0 >= sg.start && t0 < sg.end);
      }

      function renderResult() {
        R.result.hidden = !S.segs.length && !S.running && !S.ran;
        S.rows = [];
        updateAddLabel();
        const busy = S.running;   // Während der Erkennung nur ansehen, sonst würden Änderungen überschrieben
        R.addBtn.disabled = R.sortBtn.disabled = R.dlSrt.disabled = R.dlVtt.disabled = R.use.disabled = busy;
        S.segs.forEach((sg) => { if (!sg.id) sg.id = VD.uid(); });
        if (!S.segs.length) { R.list.replaceChildren(h('p', { class: 'muted', text: t('Noch keine Zeilen. Importiere eine Untertitel-Datei oder füge Zeilen von Hand hinzu.') })); return; }
        const num = (val, label, onset) => {
          const inp = h('input', { class: 'inp mk-num', type: 'number', step: '0.01', min: '0', value: fmt(val), disabled: busy, 'aria-label': label, oninput: (e) => { const v = parseFloat(e.target.value); if (isFinite(v)) onset(Math.max(0, v)); } });
          const now = h('button', { class: 'icon-btn mk-now', type: 'button', disabled: busy, title: t('Auf die aktuelle Position im Video setzen'), 'aria-label': t('Auf die aktuelle Position im Video setzen'), onclick: () => { const v = rnd(curTime()); inp.value = fmt(v); onset(v); } }, '⏱');
          return h('div', { class: 'mk-numwrap' }, h('span', { class: 'field-l', text: label }), h('div', { class: 'mk-numrow' }, inp, now));
        };
        const rows = S.segs.map((sg, i) => {
          const row = h('div', { class: 'mk-line mk-sub-line' },
            h('span', { class: 'mk-n', text: String(i + 1) }),
            h('button', { class: 'icon-btn', type: 'button', disabled: busy, title: t('Zeile anhören'), 'aria-label': t('Zeile anhören'), onclick: () => playSeg(sg) }, '▶'),
            num(sg.start, t('Start'), (v) => { sg.start = v; markActive(); }), num(sg.end, t('Ende'), (v) => { sg.end = v; markActive(); }),
            h('label', { class: 'mk-text' }, h('span', { class: 'field-l', text: t('Text') }), h('input', { class: 'inp', value: sg.text, maxlength: 240, disabled: busy, 'data-id': sg.id, oninput: (e) => { sg.text = e.target.value; } })),
            h('button', { class: 'icon-btn', type: 'button', disabled: busy, title: t('Zeile löschen'), 'aria-label': t('Zeile löschen'), onclick: () => { S.segs = S.segs.filter((x) => x !== sg); renderResult(); } }, '✕'));
          S.rows.push([sg, row]);
          return row;
        });
        R.list.replaceChildren(...rows);
        markActive();
        if (S.focusId) { const inp = R.list.querySelector('input[data-id="' + S.focusId + '"]'); S.focusId = null; if (inp) { inp.focus(); inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
      }

      const clean = () => S.segs.map((s) => ({ start: s.start, end: s.end > s.start ? s.end : s.start + 0.5, text: String(s.text || '').trim() })).filter((s) => s.text).sort((a, b) => a.start - b.start);
      function save(kind) {
        const segs = clean(); if (!segs.length) return;
        const name = ((S.file && S.file.name) || 'untertitel').replace(/\.[^.]+$/, '') + '.' + kind;
        VD.Export.save(new Blob([kind === 'srt' ? toSrt(segs) : toVtt(segs)], { type: kind === 'srt' ? 'application/x-subrip' : 'text/vtt' }), name);
      }
      async function useInBuilder() {
        const segs = clean(); if (!segs.length) return;
        R.msg.textContent = (await hooks.use(S.file, segs)) || '';
      }

      root._cleanup = () => { killWorker(); try { S.media && S.media.pause(); } catch { /* ignore */ } if (S.url) URL.revokeObjectURL(S.url); };
      return root;
    }
  };
})();
