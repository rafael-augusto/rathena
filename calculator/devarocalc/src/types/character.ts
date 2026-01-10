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
  enchant?: {
    attr: string;
    value: number;
  };
}

export interface Character {
  baseLvl: number;
  jobLvl: number;
  jobId: number;
  stats: Stats;
  equipment: {
    rightHand: EquippedItem;
    leftHand: EquippedItem;
    headUpper: EquippedItem;
    headMiddle: EquippedItem;
    headLower: EquippedItem;
    armor: EquippedItem;
    garment: EquippedItem;
    shoes: EquippedItem;
    accessory1: EquippedItem;
    accessory2: EquippedItem;
  };
}
