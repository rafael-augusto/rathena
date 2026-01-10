export interface Stats {
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
}

export interface EquippedItem {
  id: number;
  refine: number;
  cards: number[];
}

export interface Character {
  baseLvl: number;
  jobLvl: number;
  jobId: number;
  stats: Stats;
  equipment: {
    rightHand?: EquippedItem; // Weapon
    leftHand?: EquippedItem;  // Shield or 2nd Weapon (if dual wield)
    headUpper?: EquippedItem;
    headMiddle?: EquippedItem;
    headLower?: EquippedItem;
    armor?: EquippedItem;
    garment?: EquippedItem;
    shoes?: EquippedItem;
    accessory1?: EquippedItem;
    accessory2?: EquippedItem;
  };
}