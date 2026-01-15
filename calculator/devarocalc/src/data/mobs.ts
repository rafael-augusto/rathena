import mobData from './mobs.yml';

export interface Mob {
    id: number;
    name: string;
    race: number;
    element: number;
    size: number;
    lvl: number;
    hp: number;
    vit: number;
    agi: number;
    int: number;
    dex: number;
    luk: number;
    atkMin: number;
    atkMax: number;
    def: number;
    mdef: number;
    baseExp: number;
    jobExp: number;
    boss: boolean;
    range: boolean;
}

export const m_Monster: Mob[] = mobData as Mob[];

// Create a map for fast lookup if needed
export const m_MonsterMap: Record<number, Mob> = {};
m_Monster.forEach(m => {
    m_MonsterMap[m.id] = m;
});
