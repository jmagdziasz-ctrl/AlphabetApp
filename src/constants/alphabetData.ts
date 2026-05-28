export interface LetterData {
  letter: string;
  defaultName: string;  // e.g. "Annie" or "Tucker and Tate"
  sentence: string;     // everything after the name, e.g. "picks Apples"
  bgColor: string;
  accentColor: string;
  image: ReturnType<typeof require>;
  // Where the character's face is in the illustration.
  // top/left are 0–1 fractions of the image height/width (center of face circle).
  // size (optional) overrides the default 96px circle diameter.
  facePosition: { top: number; left: number; size?: number };
  // Second face position for letters with two characters (e.g. T).
  secondFacePosition?: { top: number; left: number; size?: number };
  // Shift the scene illustration downward so a head at the top of the image
  // isn't clipped. Value is a 0–1 fraction of IMAGE_HEIGHT.
  imageShiftY?: number;
  // Where to render the name/sentence banner — default is 'top'.
  // Use 'bottom' when the character's face is near the top of the illustration.
  textPosition?: 'top' | 'bottom';
}

export const ALPHABET_DATA: LetterData[] = [
  {
    letter: 'A', defaultName: 'Annie', sentence: 'picks Apples',
    bgColor: '#C8E6C9', accentColor: '#2E7D32',
    image: require('../../assets/scenes/A-Annie-picks-Apples.png'),
    facePosition: { top: 0.27, left: 0.45, size: 55 },
  },
  {
    letter: 'B', defaultName: 'Brian', sentence: 'reads a Book',
    bgColor: '#BBDEFB', accentColor: '#1565C0',
    image: require('../../assets/scenes/B-Brian-reads-a-Book.png'),
    facePosition: { top: 0.35, left: 0.5, size: 85 },
  },
  {
    letter: 'C', defaultName: 'Charlie', sentence: 'Climbs',
    bgColor: '#FCE4EC', accentColor: '#C62828',
    image: require('../../assets/scenes/C-Charlie-Climbs.png'),
    facePosition: { top: 0.22, left: 0.59, size: 47 },
  },
  {
    letter: 'D', defaultName: 'Dad', sentence: 'Dances',
    bgColor: '#E3F2FD', accentColor: '#0D47A1',
    image: require('../../assets/scenes/D-Dad-Dances.png'),
    facePosition: { top: 0.24, left: 0.4, size: 48 },
  },
  {
    letter: 'E', defaultName: 'Emma', sentence: 'Eats',
    bgColor: '#FFF9C4', accentColor: '#F57F17',
    image: require('../../assets/scenes/E-Emma-Eats.png'),
    facePosition: { top: 0.28, left: 0.55, size: 55 },
  },
  {
    letter: 'F', defaultName: 'Fido', sentence: 'Fetches',
    bgColor: '#E0F7FA', accentColor: '#006064',
    image: require('../../assets/scenes/F-Fido-Fetches.png'),
    facePosition: { top: 0.36, left: 0.7, size: 90 },
  },
  {
    letter: 'G', defaultName: 'Gavin', sentence: 'Golfs',
    bgColor: '#DCEDC8', accentColor: '#33691E',
    image: require('../../assets/scenes/G-Gavin-Golfs-v2.png'),
    facePosition: { top: 0.30, left: 0.43, size: 48 },
    textPosition: 'bottom',
  },
  {
    letter: 'H', defaultName: 'Hailey', sentence: 'Hops',
    bgColor: '#F3E5F5', accentColor: '#6A1B9A',
    image: require('../../assets/scenes/H-Hailey-Hops.png'),
    facePosition: { top: 0.19, left: 0.5, size: 63 },
  },
  {
    letter: 'I', defaultName: 'Ian', sentence: 'Ice skates',
    bgColor: '#FFF3E0', accentColor: '#E65100',
    image: require('../../assets/scenes/I-Ian-Ice-skates.png'),
    facePosition: { top: 0.44, left: 0.5, size: 72 },
  },
  {
    letter: 'J', defaultName: 'Julie', sentence: 'Jumps',
    bgColor: '#E8F5E9', accentColor: '#1B5E20',
    image: require('../../assets/scenes/J-Julie-Jumps.png'),
    facePosition: { top: 0.24, left: 0.51, size: 51 },
  },
  {
    letter: 'K', defaultName: 'Kyle', sentence: 'Kicks the ball',
    bgColor: '#E1F5FE', accentColor: '#01579B',
    image: require('../../assets/scenes/K-Kyle-Kicks-the-ball.png'),
    facePosition: { top: 0.23, left: 0.50, size: 63 },
  },
  {
    letter: 'L', defaultName: 'Lisa', sentence: 'Laughs',
    bgColor: '#FCE4EC', accentColor: '#880E4F',
    image: require('../../assets/scenes/L-Lisa-Laughs.png'),
    facePosition: { top: 0.21, left: 0.5, size: 55 },
  },
  {
    letter: 'M', defaultName: 'Mom', sentence: 'Makes it better',
    bgColor: '#EDE7F6', accentColor: '#4527A0',
    image: require('../../assets/scenes/M-Mom-Makes-it-better.png'),
    facePosition: { top: 0.19, left: 0.43, size: 81 },
  },
  {
    letter: 'N', defaultName: 'Nathan', sentence: 'Naps',
    bgColor: '#E8EAF6', accentColor: '#283593',
    image: require('../../assets/scenes/N-Nathan-Naps.png'),
    facePosition: { top: 0.30, left: 0.38, size: 113 },
  },
  {
    letter: 'O', defaultName: 'Uncle Oliver', sentence: 'Opens the door',
    bgColor: '#FFF3E0', accentColor: '#BF360C',
    image: require('../../assets/scenes/O-Uncle-Oliver-Opens-the-door.png'),
    facePosition: { top: 0.22, left: 0.55, size: 72 },
  },
  {
    letter: 'P', defaultName: 'Patty', sentence: 'Plays Piano',
    bgColor: '#F9FBE7', accentColor: '#558B2F',
    image: require('../../assets/scenes/P-Patty-Plays-Piano.png'),
    facePosition: { top: 0.14, left: 0.41, size: 68 },
  },
  {
    letter: 'Q', defaultName: 'Quinn', sentence: 'Quietly Quilts',
    bgColor: '#EDE7F6', accentColor: '#7B1FA2',
    image: require('../../assets/scenes/Q-Quinn-Quietly-Quilts-v2.png'),
    facePosition: { top: 0.17, left: 0.53, size: 67 },
  },
  {
    letter: 'R', defaultName: 'Ryan', sentence: 'Rides the bike',
    bgColor: '#FFEBEE', accentColor: '#B71C1C',
    image: require('../../assets/scenes/R-Ryan-Rides-the-bike.png'),
    facePosition: { top: 0.20, left: 0.5, size: 84 },
  },
  {
    letter: 'S', defaultName: 'Sam', sentence: 'Sits',
    bgColor: '#E0F7FA', accentColor: '#004D40',
    image: require('../../assets/scenes/S-Sam-Sits.png'),
    facePosition: { top: 0.19, left: 0.52, size: 90 },
  },
  {
    letter: 'T', defaultName: 'Tucker and Tate', sentence: 'Take Turns',
    bgColor: '#E8F5E9', accentColor: '#2E7D32',
    image: require('../../assets/scenes/T-Tucker-and-Tate-Take-Turns.png'),
    facePosition:       { top: 0.46, left: 0.66, size: 63 },
    secondFacePosition: { top: 0.18, left: 0.67 },
  },
  {
    letter: 'U', defaultName: 'Uma', sentence: 'Unloads',
    bgColor: '#E3F2FD', accentColor: '#1A237E',
    image: require('../../assets/scenes/U-Uma-Unloads.png'),
    facePosition: { top: 0.28, left: 0.42, size: 63 },
  },
  {
    letter: 'V', defaultName: 'Victor', sentence: 'Vacuums',
    bgColor: '#FFF8E1', accentColor: '#F57F17',
    image: require('../../assets/scenes/V-Victor-Vacuums.png'),
    facePosition: { top: 0.22, left: 0.45, size: 48 },
  },
  {
    letter: 'W', defaultName: 'Willow', sentence: 'Writes',
    bgColor: '#E1F5FE', accentColor: '#01579B',
    image: require('../../assets/scenes/W-Willow-Writes-v3.png'),
    facePosition: { top: 0.18, left: 0.495 },
  },
  {
    letter: 'X', defaultName: 'Xavier', sentence: 'reads the X-ray',
    bgColor: '#F3E5F5', accentColor: '#4A148C',
    image: require('../../assets/scenes/X-Xavier-reads-the-X-ray.png'),
    facePosition: { top: 0.21, left: 0.48, size: 72 },
  },
  {
    letter: 'Y', defaultName: 'Yvette', sentence: 'Yo-yos',
    bgColor: '#FFFDE7', accentColor: '#F9A825',
    image: require('../../assets/scenes/Y-Yvette-Yo-yos.png'),
    facePosition: { top: 0.19, left: 0.5, size: 68 },
  },
  {
    letter: 'Z', defaultName: 'Zoe', sentence: 'Zig-zags',
    bgColor: '#E8F5E9', accentColor: '#1B5E20',
    image: require('../../assets/scenes/Z-Zoe-Zig-zags.png'),
    facePosition: { top: 0.16, left: 0.560, size: 42 },
  },
];
