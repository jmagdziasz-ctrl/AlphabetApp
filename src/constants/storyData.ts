export interface StoryCharacterDef {
  key: string;
  defaultName: string;
  accentColor: string;
  bgColor: string;
}

// The 7 recurring characters in the story
export const STORY_CHARACTERS: StoryCharacterDef[] = [
  { key: 'benny',    defaultName: 'Benny',         accentColor: '#F57F17', bgColor: '#FFF9C4' },
  { key: 'mom',      defaultName: 'Mom',            accentColor: '#C62828', bgColor: '#FCE4EC' },
  { key: 'dad',      defaultName: 'Dad',            accentColor: '#1565C0', bgColor: '#E3F2FD' },
  { key: 'joey',     defaultName: 'Baby Joey',      accentColor: '#2E7D32', bgColor: '#E8F5E9' },
  { key: 'zara',     defaultName: 'Zara',           accentColor: '#7B1FA2', bgColor: '#F3E5F5' },
  { key: 'neighbor', defaultName: 'Mr. Henderson',  accentColor: '#33691E', bgColor: '#DCEDC8' },
  { key: 'granny',   defaultName: 'Granny',         accentColor: '#880E4F', bgColor: '#FCE4EC' },
  { key: 'waffles',  defaultName: 'Waffles',        accentColor: '#795548', bgColor: '#EFEBE9' },
];

export interface CharacterPosition {
  characterKey: string;
  defaultTop: number;   // 0–1 fraction of image height
  defaultLeft: number;  // 0–1 fraction of image width
  defaultSize: number;  // px
}

export interface StoryPage {
  page: number;
  text: string;
  bgColor: string;
  accentColor: string;
  image?: ReturnType<typeof require>;
  characterPositions?: CharacterPosition[];
}

export const STORY_COVER = require('../../assets/story/Cover.png');

export const STORY_DATA: StoryPage[] = [
  {
    page: 1,
    text: "It was a bright Saturday morning.\n\nLittle Benny jumped out of bed so fast that one sock flew off and landed on the dog.\n\n\"Woof!\" said Waffles the dog, shaking the sock off his nose.\n\n\"Sorry, Waffles!\" laughed Benny. \"I need to go wake EVERYONE UP!\"",
    bgColor: '#FFF9C4', accentColor: '#F57F17',
    image: require('../../assets/story/Page01.png'),
    characterPositions: [
      { characterKey: 'benny', defaultTop: 0.40, defaultLeft: 0.43, defaultSize: 59 },
    ],
  },
  {
    page: 2,
    text: "Benny had the MOST wonderful idea in the whole wide world.\n\n\"I am going to make pancakes for EVERYBODY!\" he said.\n\nThere was just one tiny problem.\n\nBenny had never made pancakes before. Not even once.",
    bgColor: '#FCE4EC', accentColor: '#C62828',
    image: require('../../assets/story/Page02.png'),
    characterPositions: [
      { characterKey: 'benny', defaultTop: 0.405, defaultLeft: 0.45, defaultSize: 59 },
    ],
  },
  {
    page: 3,
    text: "Benny ran to his parents' room to wake them up.\n\n\"MAMA! DADDY! I need the flour!\" he shouted.\n\nMama blinked. \"The... flour?\"\n\nDaddy pulled the pillow over his head.\n\n\"Benny, it is six o'clock in the morning,\" said Mama.\n\n\"I know,\" said Benny cheerfully. \"That is why we need to hurry!\"",
    bgColor: '#E3F2FD', accentColor: '#1565C0',
    image: require('../../assets/story/Page03.png'),
    characterPositions: [
      { characterKey: 'benny', defaultTop: 0.485, defaultLeft: 0.505, defaultSize: 58 },
      { characterKey: 'mom',   defaultTop: 0.425, defaultLeft: 0.275, defaultSize: 40 },
      { characterKey: 'dad',   defaultTop: 0.404, defaultLeft: 0.416, defaultSize: 35 },
    ],
  },
  {
    page: 4,
    text: "All the noise woke up Baby Joey in the next room.\n\n\"Bah! Bah! Bah!\" said Joey, which meant: I want pancakes too, please.\n\nMama scooped Joey up.\n\n\"Joey says he wants to help,\" said Benny.\n\n\"Joey is nine months old,\" said Daddy.\n\n\"He can stir,\" said Benny firmly.",
    bgColor: '#E8F5E9', accentColor: '#2E7D32',
    image: require('../../assets/story/Page04.png'),
    characterPositions: [
      { characterKey: 'benny',   defaultTop: 0.52, defaultLeft: 0.795, defaultSize: 40 },
      { characterKey: 'mom',     defaultTop: 0.415, defaultLeft: 0.375, defaultSize: 45 },
      { characterKey: 'dad',     defaultTop: 0.40, defaultLeft: 0.645, defaultSize: 40 },
      { characterKey: 'waffles', defaultTop: 0.55, defaultLeft: 0.55, defaultSize: 40 },
    ],
  },
  {
    page: 5,
    text: "Benny called his best friend Zara on Daddy's phone.\n\n\"Zara! I am making pancakes. You have to come over RIGHT NOW.\"\n\nZara lived just next door. She arrived in four minutes. She was still wearing her pajamas with the little tigers on them.\n\n\"I brought my apron,\" she announced proudly.\n\n\"Perfect,\" said Benny. \"You are in charge of the bowl.\"",
    bgColor: '#FFF3E0', accentColor: '#E65100',
    image: require('../../assets/story/Page05.png'),
    characterPositions: [
      { characterKey: 'benny', defaultTop: 0.48, defaultLeft: 0.433, defaultSize: 53 },
      { characterKey: 'zara',  defaultTop: 0.50, defaultLeft: 0.745, defaultSize: 39 },
      { characterKey: 'dad',   defaultTop: 0.40, defaultLeft: 0.323, defaultSize: 59 },
    ],
  },
  {
    page: 6,
    text: "RING RING! The phone rang.\n\nIt was Granny Rose, calling to say good morning.\n\n\"We are making pancakes, Granny!\" said Benny.\n\n\"Oh my goodness! Do you have the recipe?\" asked Granny.\n\nThere was a long silence.\n\n\"...What is a recipe?\" Benny whispered to Zara.\n\nZara shrugged. Granny laughed so hard she snorted. Then she read them the recipe, one step at a time.",
    bgColor: '#E0F7FA', accentColor: '#006064',
    image: require('../../assets/story/Page06.png'),
    characterPositions: [
      { characterKey: 'benny',   defaultTop: 0.51, defaultLeft: 0.75, defaultSize: 45 },
      { characterKey: 'zara',    defaultTop: 0.48, defaultLeft: 0.48, defaultSize: 53 },
      { characterKey: 'granny',  defaultTop: 0.441, defaultLeft: 0.853, defaultSize: 43 },
      { characterKey: 'waffles', defaultTop: 0.58, defaultLeft: 0.852, defaultSize: 60 },
      { characterKey: 'dad',     defaultTop: 0.40, defaultLeft: 0.32, defaultSize: 61 },
    ],
  },
  {
    page: 7,
    text: "Step one: measure the flour.\n\nBenny picked up the big bag. Zara held the bowl. Baby Joey reached out his tiny hands… and SQUEEZED.\n\nPOOF!\n\nA great white cloud of flour exploded into the kitchen.\n\nWaffles sneezed three times. Mama gasped. Daddy laughed.\n\nEveryone looked like ghosts.",
    bgColor: '#F3E5F5', accentColor: '#7B1FA2',
    image: require('../../assets/story/Page07.png'),
    characterPositions: [
      { characterKey: 'benny', defaultTop: 0.53, defaultLeft: 0.833, defaultSize: 53 },
      { characterKey: 'zara',  defaultTop: 0.48, defaultLeft: 0.47, defaultSize: 53 },
      { characterKey: 'joey',  defaultTop: 0.45, defaultLeft: 0.732, defaultSize: 43 },
      { characterKey: 'mom',   defaultTop: 0.42, defaultLeft: 0.63, defaultSize: 53 },
      { characterKey: 'dad',   defaultTop: 0.40, defaultLeft: 0.33, defaultSize: 60 },
    ],
  },
  {
    page: 8,
    text: "KNOCK KNOCK!\n\nIt was Mr. Henderson from next door. He was very kind.\n\n\"I heard a bang,\" he said. \"Is everyone all—\"\n\nHe looked at the flour-covered kitchen. He looked at the flour-covered family. He looked at Waffles, who now looked like a tiny white polar bear.\n\n\"Well,\" said Mr. Henderson slowly. \"I see you need eggs.\"\n\nHe went back to his house and returned with a whole carton. \"I was a chef once,\" he said with a wink. \"I know a thing or two.\"",
    bgColor: '#DCEDC8', accentColor: '#33691E',
    image: require('../../assets/story/Page08.png'),
    characterPositions: [
      { characterKey: 'benny',    defaultTop: 0.525, defaultLeft: 0.82, defaultSize: 50 },
      { characterKey: 'neighbor', defaultTop: 0.40, defaultLeft: 0.70, defaultSize: 40 },
      { characterKey: 'mom',      defaultTop: 0.422, defaultLeft: 0.554, defaultSize: 40 },
      { characterKey: 'dad',      defaultTop: 0.405, defaultLeft: 0.325, defaultSize: 63 },
      { characterKey: 'zara',     defaultTop: 0.48, defaultLeft: 0.48, defaultSize: 56 },
      { characterKey: 'joey',     defaultTop: 0.45, defaultLeft: 0.630, defaultSize: 40 },
    ],
  },
  {
    page: 9,
    text: "Now everyone had an important job.\n\nDaddy measured. Mama stirred. Benny poured the milk.\n\nZara cracked the eggs — only one tiny shell got in.\n\nMr. Henderson watched carefully and said \"just a little more\" and \"perfect!\"\n\nBaby Joey banged a spoon on the counter and sang: \"Bah bah bah!\"\n\nGranny Rose stayed on the phone the whole time, cheering.\n\nWaffles sat by the stove, wagging his tail hopefully.",
    bgColor: '#E8EAF6', accentColor: '#283593',
    image: require('../../assets/story/Page09.png'),
    characterPositions: [
      { characterKey: 'benny',    defaultTop: 0.52, defaultLeft: 0.723, defaultSize: 61 },
      { characterKey: 'zara',     defaultTop: 0.485, defaultLeft: 0.51, defaultSize: 44 },
      { characterKey: 'mom',      defaultTop: 0.438, defaultLeft: 0.392, defaultSize: 50 },
      { characterKey: 'dad',      defaultTop: 0.40, defaultLeft: 0.63, defaultSize: 50 },
      { characterKey: 'neighbor', defaultTop: 0.402, defaultLeft: 0.795, defaultSize: 44 },
      { characterKey: 'joey',     defaultTop: 0.535, defaultLeft: 0.175, defaultSize: 38 },
    ],
  },
  {
    page: 10,
    text: "The first pancake landed... a little sideways. It was shaped like a boot.\n\n\"It is a boot-cake,\" announced Benny. \"It is a new thing.\"\n\nThe second pancake was shaped like a cloud. The third one looked exactly like Waffles.\n\nMr. Henderson flipped the fourth one perfectly. It was round and golden and absolutely beautiful.\n\nEveryone cheered!",
    bgColor: '#EDE7F6', accentColor: '#4527A0',
    image: require('../../assets/story/Page10.png'),
    characterPositions: [
      { characterKey: 'benny',    defaultTop: 0.53, defaultLeft: 0.752, defaultSize: 53 },
      { characterKey: 'neighbor', defaultTop: 0.412, defaultLeft: 0.35, defaultSize: 39 },
      { characterKey: 'mom',      defaultTop: 0.46, defaultLeft: 0.550, defaultSize: 53 },
      { characterKey: 'dad',      defaultTop: 0.45, defaultLeft: 0.81, defaultSize: 46 },
      { characterKey: 'zara',     defaultTop: 0.51, defaultLeft: 0.635, defaultSize: 53 },
      { characterKey: 'joey',     defaultTop: 0.53, defaultLeft: 0.18, defaultSize: 53 },
    ],
  },
  {
    page: 11,
    text: "They carried the big plate of pancakes to the table. There were twenty-three pancakes in all, in every shape you can imagine.\n\nDaddy poured the maple syrup. Mama sliced the strawberries. Zara made a syrup smiley face on her pancake.\n\nMr. Henderson ate three and said they were the finest he had tasted in years.\n\nBaby Joey mashed his pancake into a perfect pancake hat for Waffles. Waffles did not mind at all.",
    bgColor: '#E3F2FD', accentColor: '#0D47A1',
    image: require('../../assets/story/Page11.png'),
    characterPositions: [
      { characterKey: 'benny',    defaultTop: 0.52, defaultLeft: 0.73, defaultSize: 54 },
      { characterKey: 'zara',     defaultTop: 0.50, defaultLeft: 0.41, defaultSize: 54 },
      { characterKey: 'mom',      defaultTop: 0.46, defaultLeft: 0.57, defaultSize: 54 },
      { characterKey: 'dad',      defaultTop: 0.46, defaultLeft: 0.722, defaultSize: 54 },
      { characterKey: 'neighbor', defaultTop: 0.46, defaultLeft: 0.27, defaultSize: 54 },
      { characterKey: 'joey',     defaultTop: 0.53, defaultLeft: 0.19, defaultSize: 60 },
    ],
  },
  {
    page: 12,
    text: "Mama put the phone on the table so Granny could join them.\n\n\"Tell me everything!\" said Granny.\n\nSo they did — all talking at the same time.\n\nBenny told about the flour cloud. Zara told about the eggshell. Daddy told about the boot-cake. Mama told about Waffles the polar bear. Mr. Henderson told about the perfect flip.\n\nGranny laughed and laughed until she said her tummy hurt.",
    bgColor: '#E8F5E9', accentColor: '#1B5E20',
    image: require('../../assets/story/Page12.png'),
    characterPositions: [
      { characterKey: 'benny',    defaultTop: 0.53, defaultLeft: 0.75, defaultSize: 56 },
      { characterKey: 'zara',     defaultTop: 0.49, defaultLeft: 0.42, defaultSize: 56 },
      { characterKey: 'mom',      defaultTop: 0.465, defaultLeft: 0.580, defaultSize: 49 },
      { characterKey: 'dad',      defaultTop: 0.457, defaultLeft: 0.733, defaultSize: 37 },
      { characterKey: 'waffles',  defaultTop: 0.58, defaultLeft: 0.86, defaultSize: 53 },
      { characterKey: 'neighbor', defaultTop: 0.462, defaultLeft: 0.265, defaultSize: 42 },
      { characterKey: 'joey',     defaultTop: 0.53, defaultLeft: 0.17, defaultSize: 49 },
    ],
  },
  {
    page: 13,
    text: "After breakfast, the kitchen needed a LOT of cleaning.\n\nThere was flour on the ceiling. There was batter on the dog. There was syrup on Zara's tiger pajamas.\n\nBut everyone helped.\n\nBenny swept. Zara wiped. Mama mopped. Daddy scrubbed.\n\nMr. Henderson washed Waffles in the backyard with the garden hose.\n\nWaffles sneezed one more time, and everyone giggled.",
    bgColor: '#FFF9C4', accentColor: '#F9A825',
    image: require('../../assets/story/Page13.png'),
    characterPositions: [
      { characterKey: 'benny',    defaultTop: 0.48, defaultLeft: 0.70, defaultSize: 38 },
      { characterKey: 'zara',     defaultTop: 0.50, defaultLeft: 0.452, defaultSize: 38 },
      { characterKey: 'mom',      defaultTop: 0.415, defaultLeft: 0.455, defaultSize: 38 },
      { characterKey: 'dad',      defaultTop: 0.412, defaultLeft: 0.181, defaultSize: 38 },
      { characterKey: 'neighbor', defaultTop: 0.40, defaultLeft: 0.84, defaultSize: 38 },
    ],
  },
  {
    page: 14,
    text: "When everything was clean and cozy again, Benny sat in the big armchair.\n\nMama and Daddy sat on either side. Joey fell asleep in Mama's lap.\n\nZara sat on the floor with Waffles, who smelled of shampoo and maple syrup.\n\nMr. Henderson sat in the good chair by the window, looking very happy.\n\n\"That,\" said Benny proudly, \"was the best breakfast in the history of the world.\"\n\n\"It was,\" agreed Daddy. \"Even the boot-cake.\"",
    bgColor: '#FCE4EC', accentColor: '#880E4F',
    image: require('../../assets/story/Page14.png'),
    characterPositions: [
      { characterKey: 'benny',    defaultTop: 0.48, defaultLeft: 0.44, defaultSize: 41 },
      { characterKey: 'zara',     defaultTop: 0.54, defaultLeft: 0.581, defaultSize: 47 },
      { characterKey: 'mom',      defaultTop: 0.46, defaultLeft: 0.18, defaultSize: 47 },
      { characterKey: 'dad',      defaultTop: 0.474, defaultLeft: 0.906, defaultSize: 41 },
      { characterKey: 'neighbor', defaultTop: 0.45, defaultLeft: 0.811, defaultSize: 41 },
      { characterKey: 'joey',     defaultTop: 0.492, defaultLeft: 0.239, defaultSize: 39 },
    ],
  },
  {
    page: 15,
    text: "The End. ❤️",
    bgColor: '#FFF3E0', accentColor: '#BF360C',
  },
];

export const STORY_TITLE = "The Great Pancake Morning Mix-Up!";
