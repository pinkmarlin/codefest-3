export const drTriageArt = `
.     |___________________________________
|-----|- - -|''''|''''|''''|''''|''''|'##\|__
|- -  |  cc 6    5    4    3    2    1 ### __]==----------------------
|-----|________________________________##/|
'     |""""""""""""""""""""""
`;

export const asciiDoctor = `
_____             _             
|  __ \           | |            
| |  | | ___   ___| |_ ___  _ __ 
| |  | |/ _ \ / __| __/ _ \| '__|
| |__| | (_) | (__| || (_) | |   
|_____/ \___/ \___|\__\___/|_|   
`;

export const asciiTriage = `
/$$$$$$$$        /$$                              
|__  $$__/       |__/                              
   | $$  /$$$$$$  /$$  /$$$$$$   /$$$$$$   /$$$$$$ 
   | $$ /$$__  $$| $$ |____  $$ /$$__  $$ /$$__  $$
   | $$| $$  \__/| $$  /$$$$$$$| $$  \ $$| $$$$$$$$
   | $$| $$      | $$ /$$__  $$| $$  | $$| $$_____/
   | $$| $$      | $$|  $$$$$$$|  $$$$$$$|  $$$$$$$
   |__/|__/      |__/ \_______/ \____  $$ \_______/
                                /$$  \ $$          
                               |  $$$$$$/          
                                \______/           

`;

export function getRandomGenieLine() {
  const genieDefectHelperLines = [
    "Ooh! Trouble in the code kingdom? Tell me what’s broken, baby, and I’ll bring the bug zapper!",
    "You got a glitch? A hiccup? A full-blown digital disaster? I'm all ears — and eyebrows!",
    "Alright, Sparky — hit me with the defect details. Is it crashing, thrashing, or just sassin’ back?",
    "You've got three wishes — or better yet, one fix! What seems to be the problem in paradise?",
    "Did your app turn into a pumpkin after midnight? Lay it on me, and I’ll work some Genie magic!",
    "System acting like it’s had too much coffee? Tell ol’ Genie what's acting up!",
    "Give me the who, what, when, where, and *oh-no-it-happened-again* of your defect — we’ll squash it!",
    "Cue the dramatic music! There’s a defect in distress! Don’t worry — I got this cape and debugger!",
    "Let me guess… something’s looping, crashing, or ghosting you like a bad date. Spill it!",
    "I live to serve! What defect dares disturb your software serenity today?",
    "Ah-ha! A mystery bug appears! Time to put on my monocle and inspect the unexpected.",
    "Tell me what’s wrong, and I promise not to turn the bug into a tap-dancing camel. Unless you want that.",
    "Is it a frontend fumble or a backend blunder? Either way, I’m on it like Jasmine on a flying carpet.",
    "Did your code go 'poof'? Let’s reverse that spell and restore the magic.",
    "Come on, hit me with your best error — I eat stack traces for breakfast!",
    "Need a miracle with your middleware? Genie’s got middleware-acle powers, baby!",
    "If your app’s throwing errors, I’m throwing solutions — fast, flashy, and probably with jazz hands.",
    "Tell me what happened — the logs, the feels, the heartbreak — and we’ll debug this drama together.",
    "Cranky component? Rogue API? Haunted database? Call me, maybe.",
    "No strings, no fees, just unlimited tech support with a touch of fabulous!"
  ];

  const randomIndex = Math.floor(Math.random() * genieDefectHelperLines.length);
  return genieDefectHelperLines[randomIndex];
}

const genieThinkingLines = [
  "Thinking, boss...",
  "Rubbing the lamp...",
  "Summoning answers...",
  "One sec...",
  "Buffering magic...",
  "Grant in progress...",
  "Fetching stardust...",
  "Cooking a fix...",
  "Abraca-loading...",
  "Hold that wish..."
];

const genieResponseLines = [
  "Wish granted!",
  "Boom, done!",
  "Here it is!",
  "Poof — fixed!",
  "Right on cue!",
  "Magic delivered!",
  "Solved and sealed!",
  "Alakazam!",
  "Voila!",
  "Fixed it!"
];

export function getRandomThinkingLine() {
  return genieThinkingLines[Math.floor(Math.random() * genieThinkingLines.length)];
}

export function getRandomResponseLine() {
  return genieResponseLines[Math.floor(Math.random() * genieResponseLines.length)];
}