export interface NumberData {
  number: number;
  label: string;        // e.g. "One"
  characterName: string;// e.g. "Katie"
  sentence: string;     // e.g. "kicks 1 ball"
  bgColor: string;
  accentColor: string;
  image: ReturnType<typeof require>;
  facePosition: { top: number; left: number; size?: number };
}

export const NUMBER_DATA: NumberData[] = [
  {
    number: 1, label: 'One',
    characterName: 'Katie', sentence: 'kicks 1 ball',
    bgColor: '#FFF9C4', accentColor: '#F57F17',
    image: require('../../assets/numbers/1_Katie-kicks-1-ball.png'),
    facePosition: { top: 0.47,  left: 0.500, size: 40 },
  },
  {
    number: 2, label: 'Two',
    characterName: 'Mom', sentence: 'walks 2 dogs',
    bgColor: '#FCE4EC', accentColor: '#C62828',
    image: require('../../assets/numbers/2_Mom-walks-2-dogs.png'),
    facePosition: { top: 0.25,  left: 0.500, size: 32 },
  },
  {
    number: 3, label: 'Three',
    characterName: 'Kyle', sentence: 'sees 3 fish',
    bgColor: '#E8F5E9', accentColor: '#2E7D32',
    image: require('../../assets/numbers/3_Kyle-sees-3-fish.png'),
    facePosition: { top: 0.30,  left: 0.13,  size: 31 },
  },
  {
    number: 4, label: 'Four',
    characterName: 'Hannah', sentence: 'flies 4 kites',
    bgColor: '#E3F2FD', accentColor: '#1565C0',
    image: require('../../assets/numbers/4_Hannah-flies-4-kites.png'),
    facePosition: { top: 0.65,  left: 0.49,  size: 20 },
  },
  {
    number: 5, label: 'Five',
    characterName: 'Dad', sentence: 'holds 5 books',
    bgColor: '#FFF3E0', accentColor: '#E65100',
    image: require('../../assets/numbers/5_Dad-carries-5-books.png'),
    facePosition: { top: 0.34,  left: 0.500, size: 31 },
  },
  {
    number: 6, label: 'Six',
    characterName: 'Grandma', sentence: 'bakes 6 apples',
    bgColor: '#F3E5F5', accentColor: '#7B1FA2',
    image: require('../../assets/numbers/6_Grandma-bakes-6-apples.png'),
    facePosition: { top: 0.34,  left: 0.31,  size: 61 },
  },
  {
    number: 7, label: 'Seven',
    characterName: 'Mikey', sentence: 'stands by 7 trees',
    bgColor: '#E0F7FA', accentColor: '#006064',
    image: require('../../assets/numbers/7_Mikey-stands-by-7-trees.png'),
    facePosition: { top: 0.525, left: 0.494, size: 20 },
  },
  {
    number: 8, label: 'Eight',
    characterName: 'Sara', sentence: 'plants 8 flowers',
    bgColor: '#DCEDC8', accentColor: '#33691E',
    image: require('../../assets/numbers/8_Sara-plants-8-flowers.png'),
    facePosition: { top: 0.35,  left: 0.70,  size: 46 },
  },
  {
    number: 9, label: 'Nine',
    characterName: 'Casey', sentence: 'counts 9 coins',
    bgColor: '#EDE7F6', accentColor: '#4527A0',
    image: require('../../assets/numbers/9_Casey-counts-9-coins.png'),
    facePosition: { top: 0.29,  left: 0.60,  size: 51 },
  },
  {
    number: 10, label: 'Ten',
    characterName: 'Kevin', sentence: 'counts 10 ants',
    bgColor: '#E8EAF6', accentColor: '#283593',
    image: require('../../assets/numbers/10_Kevin-sees-10-ants.png'),
    facePosition: { top: 0.22,  left: 0.47,  size: 34 },
  },
];
