export interface Stats {
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
}

export interface Character {
  baseLvl: number;
  jobLvl: number;
  jobId: number;
  stats: Stats;
  equipment: {
    weapon?: number;
    shield?: number;
    headUpper?: number;
    headMiddle?: number;
    headLower?: number;
    armor?: number;
    garment?: number;
    shoes?: number;
    accessory1?: number;
    accessory2?: number;
  };
}
