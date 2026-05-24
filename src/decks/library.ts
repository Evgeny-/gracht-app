import type { CardDirection, CardType, Deck, DeckExample, DeckNote, GeneratedCard } from './types';

const both: CardDirection[] = ['nl-en', 'en-nl'];

function note(
  deckId: string,
  localId: string,
  front: string,
  back: string,
  type: CardType,
  tags: string[],
  examples?: DeckExample[],
  notes?: string,
): DeckNote {
  return {
    id: `${deckId}:${localId}`,
    front,
    back,
    type,
    tags,
    examples,
    notes,
    directions: both,
  };
}

export const deckLibrary: Deck[] = [
  {
    id: 'nl-a0-survival-phrases',
    title: 'A0 Survival Phrases',
    shortTitle: 'Survival',
    level: 'A0',
    category: 'Phrases',
    description: 'Immediate greetings, politeness, and classroom survival lines.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: true,
    notes: [
      note('nl-a0-survival-phrases', 'hallo-hoi', 'hallo / hoi', 'hello / hi', 'phrase', [
        'survival',
      ]),
      note('nl-a0-survival-phrases', 'goedemorgen', 'goedemorgen', 'good morning', 'phrase', [
        'survival',
      ]),
      note('nl-a0-survival-phrases', 'dank-je-dank-u', 'dank je / dank u', 'thank you', 'phrase', [
        'survival',
      ]),
      note(
        'nl-a0-survival-phrases',
        'alsjeblieft-alstublieft',
        'alsjeblieft / alstublieft',
        'please / here you go',
        'phrase',
        ['survival'],
      ),
      note('nl-a0-survival-phrases', 'sorry', 'sorry', 'sorry', 'phrase', ['survival']),
      note('nl-a0-survival-phrases', 'tot-ziens-doei', 'tot ziens / doei', 'goodbye / bye', 'phrase', [
        'survival',
      ]),
      note(
        'nl-a0-survival-phrases',
        'ik-begrijp-het-niet',
        'Ik begrijp het niet.',
        'I do not understand.',
        'sentence',
        ['classroom'],
      ),
      note(
        'nl-a0-survival-phrases',
        'kunt-u-dat-herhalen',
        'Kunt u dat herhalen?',
        'Can you repeat that?',
        'sentence',
        ['classroom'],
      ),
      note(
        'nl-a0-survival-phrases',
        'hoe-zeg-je',
        'Hoe zeg je ...?',
        'How do you say ...?',
        'sentence',
        ['classroom'],
      ),
      note(
        'nl-a0-survival-phrases',
        'spreekt-u-engels',
        'Spreekt u Engels?',
        'Do you speak English?',
        'sentence',
        ['classroom'],
      ),
      note(
        'nl-a0-survival-phrases',
        'ik-leer-nederlands',
        'Ik leer Nederlands.',
        'I am learning Dutch.',
        'sentence',
        ['classroom'],
      ),
    ],
  },
  {
    id: 'nl-a0-numbers-time',
    title: 'A0 Numbers + Time',
    shortTitle: 'Numbers',
    level: 'A0',
    category: 'Core Words',
    description: 'Starter numbers and time words from the cheat sheet.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: true,
    notes: [
      note('nl-a0-numbers-time', 'nul', 'nul', 'zero', 'word', ['number']),
      note('nl-a0-numbers-time', 'een', 'een', 'one', 'word', ['number']),
      note('nl-a0-numbers-time', 'twee', 'twee', 'two', 'word', ['number']),
      note('nl-a0-numbers-time', 'drie', 'drie', 'three', 'word', ['number']),
      note('nl-a0-numbers-time', 'vier', 'vier', 'four', 'word', ['number']),
      note('nl-a0-numbers-time', 'vijf', 'vijf', 'five', 'word', ['number']),
      note('nl-a0-numbers-time', 'zes', 'zes', 'six', 'word', ['number']),
      note('nl-a0-numbers-time', 'zeven', 'zeven', 'seven', 'word', ['number']),
      note('nl-a0-numbers-time', 'acht', 'acht', 'eight', 'word', ['number']),
      note('nl-a0-numbers-time', 'negen', 'negen', 'nine', 'word', ['number']),
      note('nl-a0-numbers-time', 'tien', 'tien', 'ten', 'word', ['number']),
      note('nl-a0-numbers-time', 'elf', 'elf', 'eleven', 'word', ['number']),
      note('nl-a0-numbers-time', 'twaalf', 'twaalf', 'twelve', 'word', ['number']),
      note('nl-a0-numbers-time', 'twintig', 'twintig', 'twenty', 'word', ['number']),
      note('nl-a0-numbers-time', 'dertig', 'dertig', 'thirty', 'word', ['number']),
      note('nl-a0-numbers-time', 'vandaag', 'vandaag', 'today', 'word', ['time']),
      note('nl-a0-numbers-time', 'morgen', 'morgen', 'tomorrow', 'word', ['time']),
      note('nl-a0-numbers-time', 'gisteren', 'gisteren', 'yesterday', 'word', ['time']),
      note('nl-a0-numbers-time', 'nu', 'nu', 'now', 'word', ['time']),
    ],
  },
  {
    id: 'nl-a1-question-words',
    title: 'A1 Question Words',
    shortTitle: 'Questions',
    level: 'A1',
    category: 'Grammar Words',
    description: 'Core Dutch question words with short examples.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: true,
    notes: [
      note('nl-a1-question-words', 'wie', 'wie', 'who', 'word', ['question-word'], [
        { nl: 'Wie is dat?', en: 'Who is that?' },
      ]),
      note('nl-a1-question-words', 'wat', 'wat', 'what', 'word', ['question-word'], [
        { nl: 'Wat doe je?', en: 'What are you doing?' },
      ]),
      note('nl-a1-question-words', 'waar', 'waar', 'where', 'word', ['question-word'], [
        { nl: 'Waar woon je?', en: 'Where do you live?' },
      ]),
      note('nl-a1-question-words', 'wanneer', 'wanneer', 'when', 'word', ['question-word'], [
        { nl: 'Wanneer kom je?', en: 'When are you coming?' },
      ]),
      note('nl-a1-question-words', 'waarom', 'waarom', 'why', 'word', ['question-word'], [
        { nl: 'Waarom leer je Nederlands?', en: 'Why are you learning Dutch?' },
      ]),
      note('nl-a1-question-words', 'hoe', 'hoe', 'how', 'word', ['question-word'], [
        { nl: 'Hoe gaat het?', en: 'How is it going?' },
      ]),
      note('nl-a1-question-words', 'hoeveel', 'hoeveel', 'how much / how many', 'word', [
        'question-word',
      ], [{ nl: 'Hoeveel kost het?', en: 'How much is it?' }]),
      note('nl-a1-question-words', 'welk-welke', 'welk / welke', 'which', 'word', [
        'question-word',
      ], [{ nl: 'Welke bus? / Welk huis?', en: 'Which bus? / Which house?' }]),
      note('nl-a1-question-words', 'hoe-laat', 'hoe laat', 'what time', 'phrase', [
        'question-word',
      ], [{ nl: 'Hoe laat is het?', en: 'What time is it?' }]),
      note('nl-a1-question-words', 'wat-voor', 'wat voor', 'what kind of', 'phrase', [
        'question-word',
      ], [{ nl: 'Wat voor werk doe je?', en: 'What kind of work do you do?' }]),
      note('nl-a1-question-words', 'waarheen-waar-naartoe', 'waarheen / waar naartoe', 'where to', 'phrase', [
        'question-word',
      ], [{ nl: 'Waar ga je naartoe?', en: 'Where are you going?' }]),
      note('nl-a1-question-words', 'waarvandaan', 'waarvandaan', 'where from', 'word', [
        'question-word',
      ], [{ nl: 'Waar kom je vandaan?', en: 'Where are you from?' }]),
    ],
  },
  {
    id: 'nl-a1-pronouns',
    title: 'A1 Pronouns',
    shortTitle: 'Pronouns',
    level: 'A1',
    category: 'Grammar Words',
    description: 'Subject, object, and possessive pronouns.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: true,
    notes: [
      note('nl-a1-pronouns', 'ik', 'ik', 'I', 'word', ['subject']),
      note('nl-a1-pronouns', 'mij-me', 'mij / me', 'me', 'word', ['object']),
      note('nl-a1-pronouns', 'mijn', 'mijn', 'my', 'word', ['possessive']),
      note('nl-a1-pronouns', 'jij-je', 'jij / je', 'you', 'word', ['subject']),
      note('nl-a1-pronouns', 'jou-je', 'jou / je', 'you', 'word', ['object']),
      note('nl-a1-pronouns', 'jouw-je', 'jouw / je', 'your', 'word', ['possessive']),
      note('nl-a1-pronouns', 'u-subject', 'u', 'you formal', 'word', ['subject', 'formal']),
      note('nl-a1-pronouns', 'uw', 'uw', 'your formal', 'word', ['possessive', 'formal']),
      note('nl-a1-pronouns', 'hij', 'hij', 'he', 'word', ['subject']),
      note('nl-a1-pronouns', 'hem', 'hem', 'him', 'word', ['object']),
      note('nl-a1-pronouns', 'zijn', 'zijn', 'his / its', 'word', ['possessive']),
      note('nl-a1-pronouns', 'zij-ze-she', 'zij / ze', 'she', 'word', ['subject']),
      note('nl-a1-pronouns', 'haar-object', "haar / d'r", 'her', 'word', ['object']),
      note('nl-a1-pronouns', 'haar-possessive', 'haar', 'her', 'word', ['possessive']),
      note('nl-a1-pronouns', 'het', 'het', 'it', 'word', ['subject', 'object']),
      note('nl-a1-pronouns', 'wij-we', 'wij / we', 'we', 'word', ['subject']),
      note('nl-a1-pronouns', 'ons-object', 'ons', 'us', 'word', ['object']),
      note('nl-a1-pronouns', 'ons-onze', 'ons / onze', 'our', 'word', ['possessive']),
      note('nl-a1-pronouns', 'jullie-subject', 'jullie', 'you plural', 'word', ['subject']),
      note('nl-a1-pronouns', 'jullie-possessive', 'jullie', 'your plural', 'word', [
        'possessive',
      ]),
      note('nl-a1-pronouns', 'zij-ze-they', 'zij / ze', 'they', 'word', ['subject']),
      note('nl-a1-pronouns', 'hen-hun-ze', 'hen / hun / ze', 'them', 'word', ['object']),
      note('nl-a1-pronouns', 'hun', 'hun', 'their', 'word', ['possessive']),
    ],
  },
  {
    id: 'nl-a1-articles-demonstratives',
    title: 'A1 Articles + Demonstratives',
    shortTitle: 'Articles',
    level: 'A1',
    category: 'Grammar Words',
    description: 'de/het, een, this/that forms, and basic negation.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: true,
    notes: [
      note('nl-a1-articles-demonstratives', 'de', 'de', 'the for de words and plurals', 'grammar', [
        'article',
      ], [{ nl: 'de tafel / de huizen', en: 'the table / the houses' }]),
      note('nl-a1-articles-demonstratives', 'het', 'het', 'the for het words', 'grammar', [
        'article',
      ], [{ nl: 'het huis', en: 'the house' }]),
      note('nl-a1-articles-demonstratives', 'een', 'een', 'a / an', 'grammar', ['article'], [
        { nl: 'een tafel / een huis', en: 'a table / a house' },
      ]),
      note('nl-a1-articles-demonstratives', 'deze', 'deze', 'this / these with de words or plurals', 'grammar', [
        'demonstrative',
      ], [{ nl: 'deze tafel / deze huizen', en: 'this table / these houses' }]),
      note('nl-a1-articles-demonstratives', 'dit', 'dit', 'this with het words', 'grammar', [
        'demonstrative',
      ], [{ nl: 'dit huis', en: 'this house' }]),
      note('nl-a1-articles-demonstratives', 'die', 'die', 'that / those with de words or plurals', 'grammar', [
        'demonstrative',
      ], [{ nl: 'die tafel / die huizen', en: 'that table / those houses' }]),
      note('nl-a1-articles-demonstratives', 'dat', 'dat', 'that with het words', 'grammar', [
        'demonstrative',
      ], [{ nl: 'dat huis', en: 'that house' }]),
      note('nl-a1-articles-demonstratives', 'geen', 'geen', 'no / not a before indefinite nouns', 'grammar', [
        'negation',
      ], [{ nl: 'Ik heb geen fiets.', en: 'I do not have a bike.' }]),
      note('nl-a1-articles-demonstratives', 'niet', 'niet', 'not for verbs, adjectives, definite nouns, and phrases', 'grammar', [
        'negation',
      ], [
        { nl: 'Ik kom niet.', en: 'I am not coming.' },
        { nl: 'Het is niet duur.', en: 'It is not expensive.' },
      ]),
    ],
  },
  {
    id: 'nl-a1-common-regular-verbs',
    title: 'A1 Common Regular Verbs',
    shortTitle: 'Regular Verbs',
    level: 'A1',
    category: 'Verbs',
    description: 'Everyday regular verbs from the cheat sheet.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: false,
    notes: [
      note('nl-a1-common-regular-verbs', 'werken', 'werken', 'to work', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'leren', 'leren', 'to learn', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'wonen', 'wonen', 'to live', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'maken', 'maken', 'to make', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'spelen', 'spelen', 'to play', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'praten', 'praten', 'to talk', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'luisteren', 'luisteren', 'to listen', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'betalen', 'betalen', 'to pay', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'fietsen', 'fietsen', 'to cycle', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'reizen', 'reizen', 'to travel', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'wachten', 'wachten', 'to wait', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'openen', 'openen', 'to open', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'koken', 'koken', 'to cook', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'proberen', 'proberen', 'to try', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'gebruiken', 'gebruiken', 'to use', 'word', ['verb']),
      note('nl-a1-common-regular-verbs', 'wandelen', 'wandelen', 'to walk / stroll', 'word', [
        'verb',
      ]),
    ],
  },
  {
    id: 'nl-a1-irregular-verbs',
    title: 'A1 Irregular Verbs',
    shortTitle: 'Irregular Verbs',
    level: 'A1',
    category: 'Verbs',
    description: 'Must-know present forms plus high-frequency strong verbs.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: false,
    notes: [
      note('nl-a1-irregular-verbs', 'zijn', 'zijn', 'to be; ik ben, jij bent, hij is, wij zijn; past was', 'word', ['verb', 'irregular'], [
        { nl: 'Ik ben thuis.', en: 'I am home.' },
      ]),
      note('nl-a1-irregular-verbs', 'hebben', 'hebben', 'to have; ik heb, jij hebt, hij heeft; past had', 'word', ['verb', 'irregular'], [
        { nl: 'Ik heb tijd.', en: 'I have time.' },
      ]),
      note('nl-a1-irregular-verbs', 'gaan', 'gaan', 'to go; ik ga, jij gaat; past ging', 'word', ['verb', 'irregular'], [
        { nl: 'Ik ga naar huis.', en: 'I go home.' },
      ]),
      note('nl-a1-irregular-verbs', 'doen', 'doen', 'to do; ik doe, jij doet; past deed', 'word', ['verb', 'irregular'], [
        { nl: 'Wat doe je?', en: 'What are you doing?' },
      ]),
      note('nl-a1-irregular-verbs', 'zien', 'zien', 'to see; ik zie, jij ziet; past zag', 'word', ['verb', 'irregular'], [
        { nl: 'Ik zie de bus.', en: 'I see the bus.' },
      ]),
      note('nl-a1-irregular-verbs', 'kunnen', 'kunnen', 'can / be able to; ik kan, jij kunt/kan; past kon', 'word', ['verb', 'modal']),
      note('nl-a1-irregular-verbs', 'mogen', 'mogen', 'may / be allowed to; ik mag; past mocht', 'word', ['verb', 'modal']),
      note('nl-a1-irregular-verbs', 'moeten', 'moeten', 'must / have to; ik moet; past moest', 'word', ['verb', 'modal']),
      note('nl-a1-irregular-verbs', 'willen', 'willen', 'to want; ik wil, jij wilt/wil; past wilde/wou', 'word', ['verb', 'modal']),
      note('nl-a1-irregular-verbs', 'zullen', 'zullen', 'shall / will; ik zal, jij zult/zal', 'word', ['verb', 'modal']),
      note('nl-a1-irregular-verbs', 'worden', 'worden', 'to become; past werd', 'word', ['verb', 'strong'], [
        { nl: 'Het wordt koud.', en: 'It gets cold.' },
      ]),
      note('nl-a1-irregular-verbs', 'komen', 'komen', 'to come; past kwam', 'word', ['verb', 'strong'], [
        { nl: 'Kom je morgen?', en: 'Are you coming tomorrow?' },
      ]),
      note('nl-a1-irregular-verbs', 'geven', 'geven', 'to give; past gaf', 'word', ['verb', 'strong'], [
        { nl: 'Geef mij water.', en: 'Give me water.' },
      ]),
      note('nl-a1-irregular-verbs', 'nemen', 'nemen', 'to take; past nam', 'word', ['verb', 'strong'], [
        { nl: 'Ik neem koffie.', en: 'I take coffee.' },
      ]),
      note('nl-a1-irregular-verbs', 'eten', 'eten', 'to eat; past at', 'word', ['verb', 'strong'], [
        { nl: 'Ik eet brood.', en: 'I eat bread.' },
      ]),
      note('nl-a1-irregular-verbs', 'drinken', 'drinken', 'to drink; past dronk', 'word', ['verb', 'strong'], [
        { nl: 'Ik drink water.', en: 'I drink water.' },
      ]),
      note('nl-a1-irregular-verbs', 'lezen', 'lezen', 'to read; past las', 'word', ['verb', 'strong'], [
        { nl: 'Ik lees een boek.', en: 'I read a book.' },
      ]),
      note('nl-a1-irregular-verbs', 'schrijven', 'schrijven', 'to write; past schreef', 'word', [
        'verb',
        'strong',
      ], [{ nl: 'Ik schrijf mijn naam.', en: 'I write my name.' }]),
      note('nl-a1-irregular-verbs', 'spreken', 'spreken', 'to speak; past sprak', 'word', ['verb', 'strong'], [
        { nl: 'Ik spreek Engels.', en: 'I speak English.' },
      ]),
      note('nl-a1-irregular-verbs', 'krijgen', 'krijgen', 'to get; past kreeg', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'blijven', 'blijven', 'to stay; past bleef', 'word', ['verb', 'strong'], [
        { nl: 'Ik blijf thuis.', en: 'I stay home.' },
      ]),
      note('nl-a1-irregular-verbs', 'vinden', 'vinden', 'to find / think; past vond', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'weten', 'weten', 'to know; past wist', 'word', ['verb', 'strong'], [
        { nl: 'Ik weet het niet.', en: 'I do not know.' },
      ]),
      note('nl-a1-irregular-verbs', 'denken', 'denken', 'to think; past dacht', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'brengen', 'brengen', 'to bring; past bracht', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'kopen', 'kopen', 'to buy; past kocht', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'lopen', 'lopen', 'to walk; past liep', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'staan', 'staan', 'to stand; past stond', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'zitten', 'zitten', 'to sit; past zat', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'liggen', 'liggen', 'to lie / be located; past lag', 'word', [
        'verb',
        'strong',
      ]),
      note('nl-a1-irregular-verbs', 'slapen', 'slapen', 'to sleep; past sliep', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'zeggen', 'zeggen', 'to say; past zei', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'vragen', 'vragen', 'to ask; past vroeg', 'word', ['verb', 'strong']),
      note('nl-a1-irregular-verbs', 'houden', 'houden', 'to hold / like; past hield', 'word', ['verb', 'strong']),
    ],
  },
  {
    id: 'nl-a1-core-nouns',
    title: 'A1 Core Nouns',
    shortTitle: 'Nouns',
    level: 'A1',
    category: 'Core Words',
    description: 'High-use beginner nouns learned with their articles.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: false,
    notes: [
      note('nl-a1-core-nouns', 'de-mens', 'de mens', 'the person', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'de-man', 'de man', 'the man', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'de-vrouw', 'de vrouw', 'the woman', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'het-kind', 'het kind', 'the child', 'word', ['noun', 'het']),
      note('nl-a1-core-nouns', 'de-vriend', 'de vriend', 'the friend', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'de-familie', 'de familie', 'the family', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'de-dag', 'de dag', 'the day', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'de-week', 'de week', 'the week', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'het-jaar', 'het jaar', 'the year', 'word', ['noun', 'het']),
      note('nl-a1-core-nouns', 'de-tijd', 'de tijd', 'the time', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'het-huis', 'het huis', 'the house', 'word', ['noun', 'het']),
      note('nl-a1-core-nouns', 'de-kamer', 'de kamer', 'the room', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'de-stad', 'de stad', 'the city', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'de-straat', 'de straat', 'the street', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'de-winkel', 'de winkel', 'the shop', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'het-station', 'het station', 'the station', 'word', ['noun', 'het']),
      note('nl-a1-core-nouns', 'de-fiets', 'de fiets', 'the bike', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'het-boek', 'het boek', 'the book', 'word', ['noun', 'het']),
      note('nl-a1-core-nouns', 'de-trein', 'de trein', 'the train', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'het-kaartje', 'het kaartje', 'the ticket', 'word', ['noun', 'het']),
      note('nl-a1-core-nouns', 'het-water', 'het water', 'the water', 'word', ['noun', 'het']),
      note('nl-a1-core-nouns', 'het-brood', 'het brood', 'the bread', 'word', ['noun', 'het']),
      note('nl-a1-core-nouns', 'de-koffie', 'de koffie', 'the coffee', 'word', ['noun', 'de']),
      note('nl-a1-core-nouns', 'het-werk', 'het werk', 'the work', 'word', ['noun', 'het']),
    ],
  },
  {
    id: 'nl-a1-adjectives-chunks',
    title: 'A1 Adjectives + Chunks',
    shortTitle: 'Adjectives',
    level: 'A1',
    category: 'Core Words',
    description: 'Common adjectives and short adjective-noun chunks.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: false,
    notes: [
      note('nl-a1-adjectives-chunks', 'goed', 'goed', 'good', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'slecht', 'slecht', 'bad', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'groot', 'groot', 'big', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'klein', 'klein', 'small', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'nieuw', 'nieuw', 'new', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'oud', 'oud', 'old', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'jong', 'jong', 'young', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'mooi', 'mooi', 'beautiful / nice', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'makkelijk', 'makkelijk', 'easy', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'moeilijk', 'moeilijk', 'difficult', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'duur', 'duur', 'expensive', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'goedkoop', 'goedkoop', 'cheap', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'snel', 'snel', 'fast', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'langzaam', 'langzaam', 'slow', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'warm', 'warm', 'warm', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'koud', 'koud', 'cold', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'open', 'open', 'open', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'dicht', 'dicht', 'closed', 'word', ['adjective']),
      note('nl-a1-adjectives-chunks', 'een-kleine-kamer', 'een kleine kamer', 'a small room', 'phrase', [
        'chunk',
      ]),
      note('nl-a1-adjectives-chunks', 'een-goed-idee', 'een goed idee', 'a good idea', 'phrase', [
        'chunk',
      ]),
      note('nl-a1-adjectives-chunks', 'mooi-weer', 'mooi weer', 'nice weather', 'phrase', ['chunk']),
      note('nl-a1-adjectives-chunks', 'een-duur-kaartje', 'een duur kaartje', 'an expensive ticket', 'phrase', [
        'chunk',
      ]),
    ],
  },
  {
    id: 'nl-a1-adverbs-connectors',
    title: 'A1 Adverbs + Connectors',
    shortTitle: 'Adverbs',
    level: 'A1',
    category: 'Core Words',
    description: 'Location, frequency, quantity, and connector words.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: false,
    notes: [
      note('nl-a1-adverbs-connectors', 'hier', 'hier', 'here', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'daar', 'daar', 'there', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'thuis', 'thuis', 'at home', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'altijd', 'altijd', 'always', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'soms', 'soms', 'sometimes', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'nooit', 'nooit', 'never', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'ook', 'ook', 'also', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'heel', 'heel', 'very', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'veel', 'veel', 'much / many', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'weinig', 'weinig', 'little / few', 'word', ['adverb']),
      note('nl-a1-adverbs-connectors', 'en', 'en', 'and', 'word', ['connector']),
      note('nl-a1-adverbs-connectors', 'maar', 'maar', 'but', 'word', ['connector']),
      note('nl-a1-adverbs-connectors', 'of', 'of', 'or', 'word', ['connector']),
      note('nl-a1-adverbs-connectors', 'want', 'want', 'because', 'word', ['connector']),
      note('nl-a1-adverbs-connectors', 'omdat', 'omdat', 'because', 'word', ['connector']),
      note('nl-a1-adverbs-connectors', 'als', 'als', 'if / when', 'word', ['connector']),
      note('nl-a1-adverbs-connectors', 'dan', 'dan', 'then', 'word', ['connector']),
      note('nl-a1-adverbs-connectors', 'dus', 'dus', 'so', 'word', ['connector']),
      note('nl-a1-adverbs-connectors', 'ook-goed', 'ook goed', 'also good', 'phrase', ['chunk']),
      note('nl-a1-adverbs-connectors', 'niet-hier', 'niet hier', 'not here', 'phrase', ['chunk']),
      note('nl-a1-adverbs-connectors', 'maar-vandaag', 'maar vandaag', 'but today', 'phrase', [
        'chunk',
      ]),
      note('nl-a1-adverbs-connectors', 'omdat-ik-werk', 'omdat ik werk', 'because I work', 'phrase', [
        'chunk',
      ]),
    ],
  },
  {
    id: 'nl-a1-mini-sentences',
    title: 'A1 Mini Sentences',
    shortTitle: 'Sentences',
    level: 'A1',
    category: 'Sentences',
    description: 'Short starter sentences for recall in both directions.',
    source: 'Dutch A1 Starter Sheet',
    version: 1,
    defaultEnabled: false,
    notes: [
      note('nl-a1-mini-sentences', 'wie-is-dat', 'Wie is dat?', 'Who is that?', 'sentence', ['question']),
      note('nl-a1-mini-sentences', 'wat-doe-je', 'Wat doe je?', 'What are you doing?', 'sentence', [
        'question',
      ]),
      note('nl-a1-mini-sentences', 'waar-woon-je', 'Waar woon je?', 'Where do you live?', 'sentence', [
        'question',
      ]),
      note('nl-a1-mini-sentences', 'wanneer-kom-je', 'Wanneer kom je?', 'When are you coming?', 'sentence', [
        'question',
      ]),
      note('nl-a1-mini-sentences', 'waarom-leer-je-nederlands', 'Waarom leer je Nederlands?', 'Why are you learning Dutch?', 'sentence', [
        'question',
      ]),
      note('nl-a1-mini-sentences', 'hoe-gaat-het', 'Hoe gaat het?', 'How is it going?', 'sentence', [
        'question',
      ]),
      note('nl-a1-mini-sentences', 'hoeveel-kost-het', 'Hoeveel kost het?', 'How much is it?', 'sentence', [
        'question',
      ]),
      note('nl-a1-mini-sentences', 'hoe-laat-is-het', 'Hoe laat is het?', 'What time is it?', 'sentence', [
        'question',
      ]),
      note('nl-a1-mini-sentences', 'waar-ga-je-naartoe', 'Waar ga je naartoe?', 'Where are you going?', 'sentence', [
        'question',
      ]),
      note('nl-a1-mini-sentences', 'waar-kom-je-vandaan', 'Waar kom je vandaan?', 'Where are you from?', 'sentence', [
        'question',
      ]),
      note('nl-a1-mini-sentences', 'ik-wil-vandaag-nederlands-leren', 'Ik wil vandaag Nederlands leren.', 'I want to learn Dutch today.', 'sentence', [
        'word-order',
      ]),
      note('nl-a1-mini-sentences', 'leer-jij-nederlands', 'Leer jij Nederlands?', 'Are you learning Dutch?', 'sentence', [
        'word-order',
      ]),
      note('nl-a1-mini-sentences', 'ik-kom-omdat-ik-nederlands-leer', 'Ik kom omdat ik Nederlands leer.', 'I come because I learn Dutch.', 'sentence', [
        'word-order',
      ]),
      note('nl-a1-mini-sentences', 'ik-heb-geen-fiets', 'Ik heb geen fiets.', 'I do not have a bike.', 'sentence', [
        'negation',
      ]),
      note('nl-a1-mini-sentences', 'ik-kom-niet', 'Ik kom niet.', 'I am not coming.', 'sentence', [
        'negation',
      ]),
      note('nl-a1-mini-sentences', 'het-is-niet-duur', 'Het is niet duur.', 'It is not expensive.', 'sentence', [
        'negation',
      ]),
      note('nl-a1-mini-sentences', 'ik-ben-thuis', 'Ik ben thuis.', 'I am home.', 'sentence', ['verb']),
      note('nl-a1-mini-sentences', 'ik-heb-tijd', 'Ik heb tijd.', 'I have time.', 'sentence', ['verb']),
      note('nl-a1-mini-sentences', 'het-wordt-koud', 'Het wordt koud.', 'It gets cold.', 'sentence', [
        'verb',
      ]),
      note('nl-a1-mini-sentences', 'ik-ga-naar-huis', 'Ik ga naar huis.', 'I go home.', 'sentence', [
        'verb',
      ]),
      note('nl-a1-mini-sentences', 'ik-zie-de-bus', 'Ik zie de bus.', 'I see the bus.', 'sentence', [
        'verb',
      ]),
      note('nl-a1-mini-sentences', 'geef-mij-water', 'Geef mij water.', 'Give me water.', 'sentence', [
        'verb',
      ]),
      note('nl-a1-mini-sentences', 'ik-lees-een-boek', 'Ik lees een boek.', 'I read a book.', 'sentence', [
        'verb',
      ]),
      note('nl-a1-mini-sentences', 'ik-spreek-engels', 'Ik spreek Engels.', 'I speak English.', 'sentence', [
        'verb',
      ]),
      note('nl-a1-mini-sentences', 'ik-weet-het-niet', 'Ik weet het niet.', 'I do not know.', 'sentence', [
        'verb',
      ]),
    ],
  },
];

export const allCards: GeneratedCard[] = deckLibrary.flatMap((deck) =>
  deck.notes.flatMap((deckNote) =>
    deckNote.directions.map((direction) => ({
      ...deckNote,
      id: `${deckNote.id}:${direction}`,
      noteId: deckNote.id,
      deckId: deck.id,
      deckTitle: deck.title,
      deckShortTitle: deck.shortTitle,
      direction,
      prompt: direction === 'nl-en' ? deckNote.front : deckNote.back,
      answer: direction === 'nl-en' ? deckNote.back : deckNote.front,
      dutchText: deckNote.front,
      englishText: deckNote.back,
    })),
  ),
);

export type LibraryCard = (typeof allCards)[number];

export function getDeckById(deckId: string) {
  return deckLibrary.find((deck) => deck.id === deckId);
}

export function getCardById(cardId: string) {
  return allCards.find((deckCard) => deckCard.id === cardId);
}
