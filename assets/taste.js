/* Movie-taste classifier for stage 2's favorite-movies field.
   Taste.classify(title) -> 'art' (Anna-core cinema, boosts compatibility),
   'normie' (basic picks, tanks it), or 'unknown' (no points either way).
   Titles are matched after normalization: lowercase, no punctuation/diacritics,
   "&" -> "and", leading "the " stripped. ART is checked before NORMIE so e.g.
   "After Hours" (Scorsese) never trips the After-franchise patterns. */
(function () {
  function norm(t) {
    return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ').trim().replace(/^the /, '');
  }

  /* Anna's shelf, its directors' filmographies, and the broader canon. */
  var ART_TITLES = [
    // the shelf itself
    'holy mountain', 'wild at heart', 'paris texas', 'vertigo', 'three colours red',
    'woman under the influence', 'jeanne dielman', 'jeanne dielman 23 quai du commerce 1080 bruxelles',
    'stalker', 'whats eating gilbert grape', 'cook the thief his wife and her lover', 'persona', 'brutalist',
    // shelf directors, deeper cuts
    'el topo', 'santa sangre', 'fando y lis', 'endless poem',
    'eraserhead', 'blue velvet', 'mulholland drive', 'mulholland dr', 'lost highway', 'inland empire', 'elephant man',
    'wings of desire', 'alice in the cities', 'kings of the road', 'american friend', 'perfect days',
    'rear window', 'psycho', 'north by northwest', 'notorious', 'rope', 'birds', 'rebecca',
    'strangers on a train', 'shadow of a doubt', 'dial m for murder',
    'three colours blue', 'three colours white', 'double life of veronique', 'dekalog', 'blind chance',
    'faces', 'opening night', 'killing of a chinese bookie', 'shadows', 'husbands', 'love streams',
    'news from home', 'je tu il elle', 'meetings of anna',
    'solaris', 'mirror', 'andrei rublev', 'nostalghia', 'sacrifice', 'ivans childhood',
    'seventh seal', 'wild strawberries', 'fanny and alexander', 'cries and whispers',
    'scenes from a marriage', 'autumn sonata', 'winter light', 'through a glass darkly',
    'drowning by numbers', 'prosperos books', 'zed and two noughts', 'belly of an architect',
    'vox lux', 'childhood of a leader',
    // european canon
    'la dolce vita', 'la strada', 'nights of cabiria', 'amarcord', 'bicycle thieves', 'umberto d',
    'breathless', '400 blows', 'jules and jim', 'pierrot le fou', 'contempt', 'band of outsiders',
    'vivre sa vie', 'alphaville', 'weekend', 'masculin feminin', 'cleo from 5 to 7', 'vagabond', 'gleaners and i',
    'la haine', 'lavventura', 'la notte', 'leclisse', 'red desert', 'blow up', 'conformist',
    'umbrellas of cherbourg', 'young girls of rochefort', 'playtime', 'mon oncle', 'monsieur hulots holiday',
    'mother and the whore', 'celine and julie go boating', 'mouchette', 'au hasard balthazar', 'pickpocket',
    'a man escaped', 'diary of a country priest', 'lancelot du lac', 'army of shadows', 'le samourai',
    'le cercle rouge', 'elevator to the gallows', 'purple noon', 'la piscine', 'la ceremonie',
    'piano teacher', 'cache', 'hidden', 'amour', 'white ribbon', 'funny games', 'code unknown',
    'le trou', 'rififi', 'children of paradise', 'la grande illusion', 'rules of the game', 'latalante',
    'port of shadows', 'beauty and the beast', 'orpheus', 'blood of a poet', 'diabolique', 'wages of fear',
    'eyes without a face', 'la jetee', 'sans soleil', 'possession', 'suspiria', 'deep red',
    'valerie and her week of wonders', 'daisies', 'marketa lazarova', 'closely watched trains',
    'loves of a blonde', 'firemens ball', 'cremator',
    'satantango', 'werckmeister harmonies', 'turin horse', 'come and see', 'battleship potemkin',
    'man with a movie camera', 'passion of joan of arc', 'ordet', 'gertrud', 'day of wrath',
    'dogtooth', 'lobster', 'killing of a sacred deer', 'poor things', 'favourite', 'alps',
    'melancholia', 'antichrist', 'dancer in the dark', 'breaking the waves', 'dogville', 'europa', 'idiots',
    'hunt', 'another round', 'celebration',
    'portrait of a lady on fire', 'raw', 'titane', 'holy motors', 'beau travail', '35 shots of rum',
    'high life', 'white material', 'blue is the warmest colour', 'delicatessen', 'city of lost children',
    'lovers on the bridge', 'boy meets girl', 'mauvais sang',
    // asian canon
    'in the mood for love', 'chungking express', 'happy together', 'fallen angels', 'days of being wild', '2046',
    'yi yi', 'brighter summer day', 'taipei story', 'terrorizers',
    'tokyo story', 'late spring', 'early summer', 'rashomon', 'seven samurai', 'ikiru', 'ran',
    'yojimbo', 'high and low', 'harakiri', 'woman in the dunes', 'house', 'hausu',
    'close up', 'taste of cherry', 'where is the friends house', 'a separation', 'salesman', 'certified copy',
    'oldboy', 'handmaiden', 'burning', 'parasite', 'memories of murder', 'mother', 'decision to leave',
    'lady vengeance', 'sympathy for mr vengeance',
    'drive my car', 'shoplifters', 'still walking', 'after life', 'nobody knows', 'broker',
    'cure', 'pulse', 'audition', 'tetsuo the iron man',
    'perfect blue', 'paprika', 'millennium actress', 'angels egg', 'akira', 'ghost in the shell',
    'spirited away', 'princess mononoke', 'my neighbor totoro', 'howls moving castle',
    'nausicaa of the valley of the wind', 'grave of the fireflies', 'porco rosso', 'kikis delivery service',
    'uncle boonmee who can recall his past lives', 'tropical malady', 'memoria', 'cemetery of splendour',
    'syndromes and a century', 'goodbye dragon inn', 'what time is it there', 'vive lamour', 'rebels of the neon god',
    // american arthouse
    'there will be blood', 'master', 'phantom thread', 'punch drunk love', 'magnolia', 'boogie nights',
    'inherent vice', 'licorice pizza', 'hard eight',
    'synecdoche new york', 'being john malkovich', 'adaptation', 'eternal sunshine of the spotless mind',
    'anomalisa', 'im thinking of ending things',
    'first reformed', 'mishima a life in four chapters',
    'taxi driver', 'raging bull', 'king of comedy', 'after hours', 'mean streets', 'goodfellas',
    'badlands', 'days of heaven', 'tree of life', 'thin red line', 'new world', 'a hidden life',
    '2001 a space odyssey', 'barry lyndon', 'clockwork orange', 'shining', 'dr strangelove',
    'paths of glory', 'killing', 'eyes wide shut', 'full metal jacket',
    'no country for old men', 'blood simple', 'fargo', 'barton fink', 'millers crossing',
    'a serious man', 'inside llewyn davis', 'man who wasnt there', 'big lebowski',
    'dead man', 'down by law', 'stranger than paradise', 'mystery train', 'only lovers left alive',
    'paterson', 'ghost dog the way of the samurai', 'coffee and cigarettes', 'night on earth', 'broken flowers',
    'gummo', 'julien donkey boy', 'spring breakers', 'kids',
    'moonlight', 'if beale street could talk', 'aftersun', 'past lives', 'columbus', 'after yang',
    'first cow', 'certain women', 'meeks cutoff', 'old joy', 'wendy and lucy', 'showing up',
    'uncut gems', 'good time', 'heaven knows what', 'daddy longlegs',
    'pi', 'requiem for a dream', 'black swan', 'fountain', 'wrestler',
    'under the skin', 'birth', 'zone of interest', 'midsommar', 'hereditary', 'witch', 'lighthouse',
    'saint maud', 'ex machina', 'enemy', 'incendies', 'blue ruin', 'green room', 'a ghost story', 'green knight',
    'cmon cmon', 'beginners', '20th century women', 'lady bird', 'frances ha', 'marriage story',
    'squid and the whale', 'meyerowitz stories', 'her', 'lost in translation', 'somewhere',
    'marie antoinette', 'virgin suicides', 'bling ring', 'american honey', 'fish tank',
    'ratcatcher', 'morvern callar', 'we need to talk about kevin', 'you were never really here',
    'under the silver lake', 'it follows',
    // classic hollywood + noir
    'seconds', 'swimmer', 'ace in the hole', 'sunset boulevard', 'double indemnity', 'apartment',
    'network', 'dog day afternoon', '12 angry men', 'on the waterfront', 'a face in the crowd',
    'sweet smell of success', 'night of the hunter', 'touch of evil', 'citizen kane', 'third man',
    'brief encounter', 'in a lonely place', 'johnny guitar', 'all that heaven allows', 'imitation of life',
    'written on the wind', 'bigger than life', 'rebel without a cause', 'east of eden', 'searchers',
    'once upon a time in the west'
  ];

  /* The basic-answer hall of shame. */
  var NORMIE_TITLES = [
    'shawshank redemption', 'forrest gump', 'titanic', 'joker',
    'dark knight', 'dark knight rises', 'batman begins', 'inception', 'interstellar', 'tenet',
    'avatar', 'avatar the way of water',
    'grown ups', 'grown ups 2', 'paul blart mall cop', 'pixels', 'jack and jill', 'blended', 'murder mystery',
    'ride along', 'central intelligence', 'uncharted', 'red notice', 'gray man', '6 underground',
    '365 days', 'hes all that', 'tall girl',
    'emoji movie', 'super mario bros movie', 'minecraft movie', 'sonic the hedgehog',
    'frozen', 'frozen 2', 'frozen ii', 'moana', 'moana 2', 'encanto', 'sing', 'sing 2',
    'secret life of pets', 'trolls',
    'godzilla vs kong', 'godzilla x kong the new empire'
  ];

  /* Franchise patterns, tested against the normalized title (ART wins first). */
  var NORMIE_RX = [
    /^avengers/, /spider ?man/, /^iron man/, /^captain (america|marvel)/, /^thor( |$)/,
    /guardians of the galaxy/, /^ant man/, /doctor strange/, /^venom/, /deadpool/, /^x ?men/,
    /wolverine/, /^black (panther|widow|adam)/, /eternals/, /shang chi/, /morbius/, /madame web/,
    /suicide squad/, /justice league/, /man of steel/, /batman v superman/, /wonder woman/,
    /aquaman/, /^shazam/, /blue beetle/,
    /^transformers/, /minions/, /despicable me/, /boss baby/,
    /^fast (and furious|five|x)/, /furious (6|7|seven)/, /^f9/, /fate of the furious/,
    /jurassic world/, /fifty shades/, /^twilight/, /kissing booth/,
    /^after (we collided|we fell|ever happy)$/, /^harry potter/, /fantastic beasts/, /space jam/
  ];

  var ART = {}, NORMIE = {};
  ART_TITLES.forEach(function (t) { ART[t] = 1; });
  NORMIE_TITLES.forEach(function (t) { NORMIE[t] = 1; });

  function classify(title) {
    var t = norm(title);
    if (!t) return 'unknown';
    if (ART[t]) return 'art';
    if (NORMIE[t]) return 'normie';
    for (var i = 0; i < NORMIE_RX.length; i++) if (NORMIE_RX[i].test(t)) return 'normie';
    return 'unknown';
  }

  window.Taste = { classify: classify, norm: norm };
})();
