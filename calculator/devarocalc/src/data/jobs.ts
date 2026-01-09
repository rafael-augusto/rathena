export const JobNames = [
  "Novice", "Swordman", "Thief", "Acolyte", "Archer", "Magician", "Merchant",
  "Knight", "Assassin", "Priest", "Hunter", "Wizard", "Blacksmith", "Crusader",
  "Rogue", "Monk", "Bard", "Dancer", "Sage", "Alchemist", "Super Novice",
  "Lord Knight", "Assassin Cross", "High Priest", "Sniper", "High Wizard",
  "Whitesmith", "Paladin", "Stalker", "Champion", "Minstrel", "Gypsy",
  "Scholar", "Biochemist", "High Novice", "High Swordman", "High Thief",
  "High Acolyte", "High Archer", "High Magician", "High Merchant",
  "Taekwon Kid", "Taekwon Master", "Soul Linker", "Ninja", "Gunslinger"
];

// Mapping from UI Job ID (index) to rAthena YAML Key
export const JobKeyMap: Record<number, string> = {
  0: "Novice", 1: "Swordman", 2: "Thief", 3: "Acolyte", 4: "Archer", 5: "Magician", 6: "Merchant",
  7: "Knight", 8: "Assassin", 9: "Priest", 10: "Hunter", 11: "Wizard", 12: "Blacksmith", 13: "Crusader",
  14: "Rogue", 15: "Monk", 16: "Bard", 17: "Dancer", 18: "Sage", 19: "Alchemist", 20: "Super_Novice",
  21: "Lord_Knight", 22: "Assassin_Cross", 23: "High_Priest", 24: "Sniper", 25: "High_Wizard",
  26: "Whitesmith", 27: "Paladin", 28: "Stalker", 29: "Champion", 30: "Minstrel", 31: "Gypsy",
  32: "Scholar", 33: "Biochemist", 
  34: "Novice_High", 35: "Swordman_High", 36: "Thief_High", 37: "Acolyte_High", 
  38: "Archer_High", 39: "Magician_High", 40: "Merchant_High",
  41: "Taekwon_Kid", 42: "Taekwon_Master", 43: "Soul_Linker", 44: "Ninja", 45: "Gunslinger"
};

export const JobMap = JobNames.map((name, index) => ({ id: index, name }));