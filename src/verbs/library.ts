import type { PracticeItem } from '../practice/types';
import type { IrregularVerb, VerbExample, VerbGroup, VerbSource } from './types';

export const verbGroups: VerbGroup[] = [
  { id: 'foundations', title: 'Start here', description: 'Being, having, going and doing: six verbs for everyday sentences.' },
  { id: 'contact', title: 'People and information', description: 'Seeing, giving, receiving and saying what you know.' },
  { id: 'daily', title: 'Daily activities', description: 'Food, sleep, reading, writing and speaking.' },
  { id: 'changes', title: 'Actions and changes', description: 'Staying, becoming, thinking and getting things done.' },
];

export const sources: VerbSource[] = [
  { id: 'anw', title: 'Algemeen Nederlands Woordenboek · verb forms', url: 'https://anw.ivdnt.org/' },
  { id: 'auxiliaries', title: 'Taaladvies · completed tenses with hebben and zijn', url: 'https://taaladvies.net/vorming-van-voltooide-tijden-met-hebben-of-zijn-algemeen/' },
  { id: 'past-tenses', title: 'Taaladvies · simple and completed past tenses', url: 'https://taaladvies.net/werkwoordstijden-die-iets-over-het-verleden-zeggen-voltooide-versus-onvoltooide-tijden-algemeen/' },
];

const e = (dutch: string, english: string): VerbExample => ({ dutch, english });
type VerbDefinition = Omit<IrregularVerb, 'id' | 'priority'>;

// These examples are authored practice, checked against the grammar references above.
// They are separate from the teacher-document material in practice/library.ts.
const definitions: VerbDefinition[] = [
  {
    infinitive: 'zijn', english: 'to be', groupId: 'foundations',
    present: { ik: 'ben', wij: 'zijn' }, past: { singular: 'was', plural: 'waren' },
    perfect: { auxiliary: 'zijn', participle: 'geweest' },
    examples: {
      present: e('Ik ben thuis.', 'I am at home.'),
      pastSingular: e('Ik was gisteren thuis.', 'I was at home yesterday.'),
      pastPlural: e('Wij waren gisteren thuis.', 'We were at home yesterday.'),
      perfect: e('Ik ben de hele dag thuis geweest.', 'I have been at home all day.'),
    },
  },
  {
    infinitive: 'hebben', english: 'to have', groupId: 'foundations',
    present: { ik: 'heb', wij: 'hebben' }, past: { singular: 'had', plural: 'hadden' },
    perfect: { auxiliary: 'hebben', participle: 'gehad' },
    examples: {
      present: e('Ik heb tijd.', 'I have time.'),
      pastSingular: e('Ik had gisteren tijd.', 'I had time yesterday.'),
      pastPlural: e('Wij hadden gisteren tijd.', 'We had time yesterday.'),
      perfect: e('Ik heb genoeg tijd gehad.', 'I have had enough time.'),
    },
  },
  {
    infinitive: 'gaan', english: 'to go', groupId: 'foundations',
    present: { ik: 'ga', wij: 'gaan' }, past: { singular: 'ging', plural: 'gingen' },
    perfect: { auxiliary: 'zijn', participle: 'gegaan' },
    examples: {
      present: e('Ik ga naar school.', 'I go to school.'),
      pastSingular: e('Ik ging gisteren naar school.', 'I went to school yesterday.'),
      pastPlural: e('Wij gingen gisteren naar school.', 'We went to school yesterday.'),
      perfect: e('Ik ben naar school gegaan.', 'I went to school.'),
    },
  },
  {
    infinitive: 'komen', english: 'to come', groupId: 'foundations',
    present: { ik: 'kom', wij: 'komen' }, past: { singular: 'kwam', plural: 'kwamen' },
    perfect: { auxiliary: 'zijn', participle: 'gekomen' },
    examples: {
      present: e('Ik kom naar de les.', 'I come to the lesson.'),
      pastSingular: e('Ik kwam gisteren naar de les.', 'I came to the lesson yesterday.'),
      pastPlural: e('Wij kwamen gisteren naar de les.', 'We came to the lesson yesterday.'),
      perfect: e('Ik ben naar de les gekomen.', 'I came to the lesson.'),
    },
  },
  {
    infinitive: 'doen', english: 'to do', groupId: 'foundations',
    present: { ik: 'doe', wij: 'doen' }, past: { singular: 'deed', plural: 'deden' },
    perfect: { auxiliary: 'hebben', participle: 'gedaan' },
    examples: {
      present: e('Ik doe mijn huiswerk.', 'I do my homework.'),
      pastSingular: e('Ik deed gisteren mijn huiswerk.', 'I did my homework yesterday.'),
      pastPlural: e('Wij deden gisteren ons huiswerk.', 'We did our homework yesterday.'),
      perfect: e('Ik heb mijn huiswerk gedaan.', 'I have done my homework.'),
    },
  },
  {
    infinitive: 'nemen', english: 'to take', groupId: 'foundations',
    present: { ik: 'neem', wij: 'nemen' }, past: { singular: 'nam', plural: 'namen' },
    perfect: { auxiliary: 'hebben', participle: 'genomen' },
    examples: {
      present: e('Ik neem de trein.', 'I take the train.'),
      pastSingular: e('Ik nam gisteren de trein.', 'I took the train yesterday.'),
      pastPlural: e('Wij namen gisteren de trein.', 'We took the train yesterday.'),
      perfect: e('Ik heb de trein genomen.', 'I took the train.'),
    },
    note: 'Nemen and pakken can both mean take. This exercise practises the irregular verb nemen.',
  },
  {
    infinitive: 'zien', english: 'to see', groupId: 'contact',
    present: { ik: 'zie', wij: 'zien' }, past: { singular: 'zag', plural: 'zagen' },
    perfect: { auxiliary: 'hebben', participle: 'gezien' },
    examples: {
      present: e('Ik zie mijn vriend.', 'I see my friend.'),
      pastSingular: e('Ik zag gisteren mijn vriend.', 'I saw my friend yesterday.'),
      pastPlural: e('Wij zagen gisteren onze vriend.', 'We saw our friend yesterday.'),
      perfect: e('Ik heb mijn vriend gezien.', 'I have seen my friend.'),
    },
  },
  {
    infinitive: 'geven', english: 'to give', groupId: 'contact',
    present: { ik: 'geef', wij: 'geven' }, past: { singular: 'gaf', plural: 'gaven' },
    perfect: { auxiliary: 'hebben', participle: 'gegeven' },
    examples: {
      present: e('Ik geef haar een boek.', 'I give her a book.'),
      pastSingular: e('Ik gaf haar gisteren een boek.', 'I gave her a book yesterday.'),
      pastPlural: e('Wij gaven haar gisteren een boek.', 'We gave her a book yesterday.'),
      perfect: e('Ik heb haar een boek gegeven.', 'I have given her a book.'),
    },
  },
  {
    infinitive: 'krijgen', english: 'to receive', groupId: 'contact',
    present: { ik: 'krijg', wij: 'krijgen' }, past: { singular: 'kreeg', plural: 'kregen' },
    perfect: { auxiliary: 'hebben', participle: 'gekregen' },
    examples: {
      present: e('Ik krijg een bericht.', 'I receive a message.'),
      pastSingular: e('Ik kreeg gisteren een bericht.', 'I received a message yesterday.'),
      pastPlural: e('Wij kregen gisteren een bericht.', 'We received a message yesterday.'),
      perfect: e('Ik heb een bericht gekregen.', 'I have received a message.'),
    },
  },
  {
    infinitive: 'zeggen', english: 'to say', groupId: 'contact',
    present: { ik: 'zeg', wij: 'zeggen' }, past: { singular: 'zei', plural: 'zeiden' },
    perfect: { auxiliary: 'hebben', participle: 'gezegd' },
    examples: {
      present: e('Ik zeg het tegen haar.', 'I say it to her.'),
      pastSingular: e('Ik zei het gisteren tegen haar.', 'I said it to her yesterday.'),
      pastPlural: e('Wij zeiden het gisteren tegen haar.', 'We said it to her yesterday.'),
      perfect: e('Ik heb het tegen haar gezegd.', 'I have said it to her.'),
    },
  },
  {
    infinitive: 'vinden', english: 'to find', groupId: 'contact',
    present: { ik: 'vind', wij: 'vinden' }, past: { singular: 'vond', plural: 'vonden' },
    perfect: { auxiliary: 'hebben', participle: 'gevonden' },
    examples: {
      present: e('Ik vind mijn sleutel.', 'I find my key.'),
      pastSingular: e('Ik vond gisteren mijn sleutel.', 'I found my key yesterday.'),
      pastPlural: e('Wij vonden gisteren onze sleutels.', 'We found our keys yesterday.'),
      perfect: e('Ik heb mijn sleutel gevonden.', 'I have found my key.'),
    },
  },
  {
    infinitive: 'weten', english: 'to know a fact', groupId: 'contact',
    present: { ik: 'weet', wij: 'weten' }, past: { singular: 'wist', plural: 'wisten' },
    perfect: { auxiliary: 'hebben', participle: 'geweten' },
    examples: {
      present: e('Ik weet het antwoord.', 'I know the answer.'),
      pastSingular: e('Ik wist gisteren het antwoord.', 'I knew the answer yesterday.'),
      pastPlural: e('Wij wisten gisteren het antwoord.', 'We knew the answer yesterday.'),
      perfect: e('Ik heb dat altijd geweten.', 'I have always known that.'),
    },
    note: 'Weten concerns information. Kennen expresses familiarity with someone or something.',
  },
  {
    infinitive: 'eten', english: 'to eat', groupId: 'daily',
    present: { ik: 'eet', wij: 'eten' }, past: { singular: 'at', plural: 'aten' },
    perfect: { auxiliary: 'hebben', participle: 'gegeten' },
    examples: {
      present: e('Ik eet een appel.', 'I eat an apple.'),
      pastSingular: e('Ik at gisteren een appel.', 'I ate an apple yesterday.'),
      pastPlural: e('Wij aten gisteren appels.', 'We ate apples yesterday.'),
      perfect: e('Ik heb een appel gegeten.', 'I have eaten an apple.'),
    },
  },
  {
    infinitive: 'drinken', english: 'to drink', groupId: 'daily',
    present: { ik: 'drink', wij: 'drinken' }, past: { singular: 'dronk', plural: 'dronken' },
    perfect: { auxiliary: 'hebben', participle: 'gedronken' },
    examples: {
      present: e('Ik drink water.', 'I drink water.'),
      pastSingular: e('Ik dronk gisteren water.', 'I drank water yesterday.'),
      pastPlural: e('Wij dronken gisteren water.', 'We drank water yesterday.'),
      perfect: e('Ik heb water gedronken.', 'I have drunk water.'),
    },
  },
  {
    infinitive: 'slapen', english: 'to sleep', groupId: 'daily',
    present: { ik: 'slaap', wij: 'slapen' }, past: { singular: 'sliep', plural: 'sliepen' },
    perfect: { auxiliary: 'hebben', participle: 'geslapen' },
    examples: {
      present: e('Ik slaap goed.', 'I sleep well.'),
      pastSingular: e('Ik sliep gisteren goed.', 'I slept well yesterday.'),
      pastPlural: e('Wij sliepen gisteren goed.', 'We slept well yesterday.'),
      perfect: e('Ik heb goed geslapen.', 'I have slept well.'),
    },
  },
  {
    infinitive: 'lezen', english: 'to read', groupId: 'daily',
    present: { ik: 'lees', wij: 'lezen' }, past: { singular: 'las', plural: 'lazen' },
    perfect: { auxiliary: 'hebben', participle: 'gelezen' },
    examples: {
      present: e('Ik lees een boek.', 'I read a book.'),
      pastSingular: e('Ik las gisteren een boek.', 'I read a book yesterday.'),
      pastPlural: e('Wij lazen gisteren een boek.', 'We read a book yesterday.'),
      perfect: e('Ik heb een boek gelezen.', 'I have read a book.'),
    },
  },
  {
    infinitive: 'schrijven', english: 'to write', groupId: 'daily',
    present: { ik: 'schrijf', wij: 'schrijven' }, past: { singular: 'schreef', plural: 'schreven' },
    perfect: { auxiliary: 'hebben', participle: 'geschreven' },
    examples: {
      present: e('Ik schrijf een bericht.', 'I write a message.'),
      pastSingular: e('Ik schreef gisteren een bericht.', 'I wrote a message yesterday.'),
      pastPlural: e('Wij schreven gisteren een bericht.', 'We wrote a message yesterday.'),
      perfect: e('Ik heb een bericht geschreven.', 'I have written a message.'),
    },
  },
  {
    infinitive: 'spreken', english: 'to speak', groupId: 'daily',
    present: { ik: 'spreek', wij: 'spreken' }, past: { singular: 'sprak', plural: 'spraken' },
    perfect: { auxiliary: 'hebben', participle: 'gesproken' },
    examples: {
      present: e('Ik spreek Nederlands.', 'I speak Dutch.'),
      pastSingular: e('Ik sprak gisteren Nederlands.', 'I spoke Dutch yesterday.'),
      pastPlural: e('Wij spraken gisteren Nederlands.', 'We spoke Dutch yesterday.'),
      perfect: e('Ik heb Nederlands gesproken.', 'I have spoken Dutch.'),
    },
  },
  {
    infinitive: 'blijven', english: 'to stay', groupId: 'changes',
    present: { ik: 'blijf', wij: 'blijven' }, past: { singular: 'bleef', plural: 'bleven' },
    perfect: { auxiliary: 'zijn', participle: 'gebleven' },
    examples: {
      present: e('Ik blijf thuis.', 'I stay at home.'),
      pastSingular: e('Ik bleef gisteren thuis.', 'I stayed at home yesterday.'),
      pastPlural: e('Wij bleven gisteren thuis.', 'We stayed at home yesterday.'),
      perfect: e('Ik ben thuis gebleven.', 'I stayed at home.'),
    },
  },
  {
    infinitive: 'worden', english: 'to become', groupId: 'changes',
    present: { ik: 'word', wij: 'worden' }, past: { singular: 'werd', plural: 'werden' },
    perfect: { auxiliary: 'zijn', participle: 'geworden' },
    examples: {
      present: e('Ik word moe.', 'I am getting tired.'),
      pastSingular: e('Ik werd gisteren moe.', 'I got tired yesterday.'),
      pastPlural: e('Wij werden gisteren moe.', 'We got tired yesterday.'),
      perfect: e('Ik ben moe geworden.', 'I got tired.'),
    },
    note: 'These examples use worden for becoming something, rather than for a passive sentence.',
  },
  {
    infinitive: 'denken', english: 'to think', groupId: 'changes',
    present: { ik: 'denk', wij: 'denken' }, past: { singular: 'dacht', plural: 'dachten' },
    perfect: { auxiliary: 'hebben', participle: 'gedacht' },
    examples: {
      present: e('Ik denk aan de afspraak.', 'I think about the appointment.'),
      pastSingular: e('Ik dacht gisteren aan de afspraak.', 'I thought about the appointment yesterday.'),
      pastPlural: e('Wij dachten gisteren aan de afspraak.', 'We thought about the appointment yesterday.'),
      perfect: e('Ik heb aan de afspraak gedacht.', 'I have thought about the appointment.'),
    },
  },
  {
    infinitive: 'brengen', english: 'to bring', groupId: 'changes',
    present: { ik: 'breng', wij: 'brengen' }, past: { singular: 'bracht', plural: 'brachten' },
    perfect: { auxiliary: 'hebben', participle: 'gebracht' },
    examples: {
      present: e('Ik breng het pakketje naar de winkel.', 'I bring the parcel to the shop.'),
      pastSingular: e('Ik bracht gisteren het pakketje naar de winkel.', 'I brought the parcel to the shop yesterday.'),
      pastPlural: e('Wij brachten gisteren het pakketje naar de winkel.', 'We brought the parcel to the shop yesterday.'),
      perfect: e('Ik heb het pakketje naar de winkel gebracht.', 'I have brought the parcel to the shop.'),
    },
  },
  {
    infinitive: 'kopen', english: 'to buy', groupId: 'changes',
    present: { ik: 'koop', wij: 'kopen' }, past: { singular: 'kocht', plural: 'kochten' },
    perfect: { auxiliary: 'hebben', participle: 'gekocht' },
    examples: {
      present: e('Ik koop een brood.', 'I buy a loaf of bread.'),
      pastSingular: e('Ik kocht gisteren een brood.', 'I bought a loaf of bread yesterday.'),
      pastPlural: e('Wij kochten gisteren een brood.', 'We bought a loaf of bread yesterday.'),
      perfect: e('Ik heb een brood gekocht.', 'I have bought a loaf of bread.'),
    },
  },
  {
    infinitive: 'lopen', english: 'to walk', groupId: 'changes',
    present: { ik: 'loop', wij: 'lopen' }, past: { singular: 'liep', plural: 'liepen' },
    perfect: { auxiliary: 'hebben', participle: 'gelopen', note: 'Activity: Ik heb een uur gelopen. Destination: Ik ben naar huis gelopen.' },
    examples: {
      present: e('Ik loop een uur.', 'I walk for an hour.'),
      pastSingular: e('Ik liep gisteren een uur.', 'I walked for an hour yesterday.'),
      pastPlural: e('Wij liepen gisteren een uur.', 'We walked for an hour yesterday.'),
      perfect: e('Ik heb een uur gelopen.', 'I have walked for an hour.'),
    },
  },
];

export const verbs: IrregularVerb[] = definitions.map((verb, index) => ({ ...verb, id: verb.infinitive, priority: index + 1 }));

const pastMeanings: Record<string, string> = {
  zijn: 'was / were', hebben: 'had', gaan: 'went', komen: 'came', doen: 'did', nemen: 'took',
  zien: 'saw', geven: 'gave', krijgen: 'received / got', zeggen: 'said', vinden: 'found', weten: 'knew',
  eten: 'ate', drinken: 'drank', slapen: 'slept', lezen: 'read (past tense)', schrijven: 'wrote', spreken: 'spoke',
  blijven: 'stayed', worden: 'became / got', denken: 'thought', brengen: 'brought', kopen: 'bought', lopen: 'walked',
};

const gap = (sentence: string, form: string) => sentence.split(' ').map((word) =>
  word.replace(/[.,!?;:]/g, '') === form ? word.replace(form, '…') : word,
).join(' ');

function sentenceOrders(verb: IrregularVerb): string[] {
  const model = verb.examples.pastSingular.dutch;
  const words = model.replace(/\.$/, '').split(' ');
  const yesterday = words.indexOf('gisteren');
  if (words[0] !== 'Ik' || yesterday < 0) return [model];
  const rest = words.slice(2).filter((word) => word !== 'gisteren');
  return [model, `Gisteren ${verb.past.singular} ik ${rest.join(' ')}.`];
}

function tasks(verb: IrregularVerb): PracticeItem[] {
  const reference = [
    { label: 'Present', dutch: verb.examples.present.dutch },
    { label: 'Past · ik', dutch: verb.examples.pastSingular.dutch },
    { label: 'Past · wij', dutch: verb.examples.pastPlural.dutch },
    { label: 'Perfect', dutch: verb.examples.perfect.dutch },
  ];
  const base = {
    revision: 1,
    lessonId: 'irregular-verbs',
    topicIds: ['irregular-verbs'],
    verbId: verb.id,
    reference,
    source: { label: 'Authored verb practice', quote: verb.examples.pastSingular.dutch, adapted: true },
  };
  const auxiliary = verb.perfect.auxiliary === 'zijn' ? 'ben' : 'heb';
  return [
    {
      ...base, id: `irregular-${verb.id}-meaning`, kind: 'recall', verbTask: 'meaning',
      label: 'English → Dutch', promptLanguage: 'en', answerLanguage: 'nl',
      title: verb.english, prompt: verb.english, cue: 'Say the irregular Dutch infinitive.',
      answer: verb.infinitive, explanation: verb.id === 'nemen' || verb.id === 'weten' ? verb.note! : '',
      dutch: verb.examples.present.dutch, english: verb.examples.present.english,
    },
    {
      ...base, id: `irregular-${verb.id}-recognize`, kind: 'recall', verbTask: 'recognize',
      label: 'Dutch → English', promptLanguage: 'nl', answerLanguage: 'en',
      title: verb.past.singular, prompt: verb.past.singular, cue: 'What does this Dutch past form mean?',
      answer: pastMeanings[verb.id], explanation: `${verb.past.singular} is the singular past form of ${verb.infinitive} (${verb.english}).`,
      dutch: verb.examples.pastSingular.dutch, english: verb.examples.pastSingular.english,
    },
    {
      ...base, id: `irregular-${verb.id}-past-singular`, kind: 'verb', verbTask: 'past-singular',
      label: 'Past · ik', promptLanguage: 'nl', answerLanguage: 'nl',
      title: `${verb.infinitive} · singular past`, cue: 'Complete the sentence in the simple past (OVT).',
      prompt: `${gap(verb.examples.pastSingular.dutch, verb.past.singular)} (${verb.infinitive})`,
      answer: verb.examples.pastSingular.dutch, explanation: `With ik, the past form is ${verb.past.singular}.`,
      dutch: verb.examples.pastSingular.dutch, english: verb.examples.pastSingular.english,
    },
    {
      ...base, id: `irregular-${verb.id}-past-plural`, kind: 'verb', verbTask: 'past-plural',
      label: 'Past · wij', promptLanguage: 'nl', answerLanguage: 'nl',
      title: `${verb.infinitive} · plural past`, cue: 'Complete the sentence in the simple past (OVT).',
      prompt: `${gap(verb.examples.pastPlural.dutch, verb.past.plural)} (${verb.infinitive})`,
      answer: verb.examples.pastPlural.dutch, explanation: `With wij, the past form is ${verb.past.plural}.`,
      dutch: verb.examples.pastPlural.dutch, english: verb.examples.pastPlural.english,
    },
    {
      ...base, id: `irregular-${verb.id}-perfect`, kind: 'verb', verbTask: 'perfect',
      label: 'Perfect · hebben / zijn', promptLanguage: 'nl', answerLanguage: 'nl',
      title: `${verb.infinitive} · perfect`, cue: 'Fill both gaps: the auxiliary and the past participle.',
      prompt: `${gap(gap(verb.examples.perfect.dutch, auxiliary), verb.perfect.participle)} (${verb.infinitive})`,
      answer: verb.examples.perfect.dutch,
      explanation: verb.perfect.note ?? `Use ${auxiliary} with ik and the past participle ${verb.perfect.participle}.`,
      dutch: verb.examples.perfect.dutch, english: verb.examples.perfect.english,
    },
    {
      ...base, id: `irregular-${verb.id}-sentence`, kind: 'build', verbTask: 'sentence',
      label: 'Build · simple past', promptLanguage: 'en', answerLanguage: 'nl',
      title: `${verb.infinitive} in a sentence`, cue: 'Use the simple past (OVT) and the words below.',
      prompt: verb.examples.pastSingular.english, answer: verb.examples.pastSingular.dutch,
      explanation: `The past form is ${verb.past.singular}. The finite verb comes second in these statements.`,
      tokens: verb.examples.pastSingular.dutch.split(' '), acceptedAnswers: sentenceOrders(verb),
      dutch: verb.examples.pastSingular.dutch, english: verb.examples.pastSingular.english,
    },
  ];
}

export const verbItems: PracticeItem[] = verbs.flatMap(tasks);
