import { Character, Stats } from '../types/character';
import tableData from '../data/tables.yml';
import { JobKeyMap } from '../data/jobs';
import { m_Item } from '../data/items';
import { m_Card } from '../data/cards';
import { WeaponTypeMap } from '../data/equip_logic';
import { ItemDbData } from '../data/item_db_descriptions';

// Map YML body to a usable structure
const body = tableData.Body;

export interface CalculatedStats {
  maxHP: number;
  maxSP: number;
  atk: { min: number; max: number };
  matk: { min: number; max: number };
  def: number;
  softDef: number;
  mdef: number;
  softMdef: number;
  hit: number;
  flee: number;
  dodge: number;
  crit: number;
  perfectDodge: number;
  aspd: number;
  castTime: number;
  hpRegen: number;
  spRegen: number;
  weightLimit: number;
  statBonuses: Stats;
  bodyElement: string;
}

const ELEMENT_NAMES = [
  "Neutral", "Water", "Earth", "Fire", "Wind",
  "Poison", "Holy", "Shadow", "Ghost", "Undead"
];

function getElementName(id: number): string {
  return ELEMENT_NAMES[id] || "Neutral";
}

function getJobData(jobId: number) {
  const jobKey = JobKeyMap[jobId];
  // Find the entry where the Jobs map contains the jobKey as true
  return body.find((entry: any) => entry.Jobs && entry.Jobs[jobKey] === true) || body[0];
}

function getJobBonus(jobId: number, jobLvl: number): Stats {
  const bonuses: Stats = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
  const jobEntry = getJobData(jobId);
  const bonusList = jobEntry.BonusStats;

  if (bonusList) {
    bonusList.forEach((bonus: any) => {
      if (jobLvl >= bonus.Level) {
        if (bonus.Str) bonuses.str += bonus.Str;
        if (bonus.Agi) bonuses.agi += bonus.Agi;
        if (bonus.Vit) bonuses.vit += bonus.Vit;
        if (bonus.Int) bonuses.int += bonus.Int;
        if (bonus.Dex) bonuses.dex += bonus.Dex;
        if (bonus.Luk) bonuses.luk += bonus.Luk;
      }
    });
  }
  return bonuses;
}

export function calculateStats(char: Character): CalculatedStats {
  const { baseLvl, jobLvl, jobId, stats: baseStats, equipment } = char;
  const jobEntry = getJobData(jobId);
  const jobBonuses = getJobBonus(jobId, jobLvl);

  // 1. Calculate Total Stats (Base + Job + Equipment + PassiveSkills)
  // Determine equipped item bonuses first
  const equipStats: Stats = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
  let equipAtk = 0;
  let equipMatk = 0;
  let equipDef = 0;
  let equipMdef = 0;
  let equipHit = 0;
  let equipFlee = 0;
  let equipCrit = 0;
  let equipPDodge = 0;
  let equipHPMul = 0;
  let equipSPMul = 0;
  let equipHPFlat = 0;
  let equipSPFlat = 0;
  let equipMatkPercent = 0;
  let equipAspdPercent = 0;
  let bodyElementIdx = 0;

  const applyScript = (data: any[], startIndex: number, _refine: number) => {
    for (let i = startIndex; i < data.length; i += 2) {
      const code = data[i];
      const val = data[i + 1];
      if (code === 0) break;

      switch (code) {
        case 1: equipStats.str += val; break;
        case 2: equipStats.agi += val; break;
        case 3: equipStats.vit += val; break;
        case 4: equipStats.int += val; break;
        case 5: equipStats.dex += val; break;
        case 6: equipStats.luk += val; break;
        case 7:
          equipStats.str += val; equipStats.agi += val; equipStats.vit += val;
          equipStats.int += val; equipStats.dex += val; equipStats.luk += val;
          break;
        case 8: equipHit += val; break;
        case 9: equipFlee += val; break;
        case 10: equipCrit += val; break;
        case 11: equipPDodge += val; break;
        case 13: equipHPFlat += val; break;
        case 14: equipSPFlat += val; break;
        case 15: equipHPMul += val; break;
        case 16: equipSPMul += val; break;
        case 17: equipAtk += val; break;
        case 18: equipDef += val; break;
        case 19: equipMdef += val; break;
        case 87: equipAtk += Math.floor(equipAtk * val / 100); break;
        case 88: equipMatkPercent += val; break;
        case 89: equipMatkPercent += val; break;
        case 198: bodyElementIdx = val; break;
        default: break;
      }
    }
  };

  const processItem = (slotItem: any) => {
    if (!slotItem || slotItem.id === 0) return;
    const legacyData = m_Item[slotItem.id];
    if (!legacyData) return;

    const itemName = legacyData[8].toLowerCase().trim();
    const dbItem = ItemDbData[itemName];

    // Base stats from item (ATK/DEF)
    if (dbItem) {
      if (legacyData[1] <= 21) {
        equipAtk += dbItem.atk;
        equipMatk += dbItem.matk;
      } else {
        equipDef += dbItem.def;
      }
    } else {
      if (legacyData[1] <= 21) {
        equipAtk += legacyData[3];
      } else {
        equipDef += legacyData[3];
      }
    }

    // Script
    applyScript(legacyData, 11, slotItem.refine);

    // Cards
    slotItem.cards.forEach((cardId: number) => {
      if (cardId === 0) return;
      const cardData = m_Card.find((c: any) => c[0] === cardId);
      if (cardData) {
        applyScript(cardData, 4, 0);
      }
    });

    // Enchants
    if (slotItem.enchant) {
      const { attr, value } = slotItem.enchant;
      if (attr === 'str') equipStats.str += value;
      else if (attr === 'agi') equipStats.agi += value;
      else if (attr === 'vit') equipStats.vit += value;
      else if (attr === 'int') equipStats.int += value;
      else if (attr === 'dex') equipStats.dex += value;
      else if (attr === 'luk') equipStats.luk += value;
    }
  };



  if (equipment) {
    Object.values(equipment).forEach(item => processItem(item));
  }

  // Calculate Final Stats
  const totalStats: Stats = {
    str: baseStats.str + jobBonuses.str + equipStats.str,
    agi: baseStats.agi + jobBonuses.agi + equipStats.agi,
    vit: baseStats.vit + jobBonuses.vit + equipStats.vit,
    int: baseStats.int + jobBonuses.int + equipStats.int,
    dex: baseStats.dex + jobBonuses.dex + equipStats.dex,
    luk: baseStats.luk + jobBonuses.luk + equipStats.luk,
  };

  // 2. Base Stats Calculations (HP, SP, Weight)
  const hpFactor = jobEntry.HpFactor || 0;
  // Formula: (35 + BaseLvl * HpFactor) * (1 + Vit/100)
  let maxHP = Math.floor((35 + baseLvl * hpFactor) * (1 + totalStats.vit / 100));
  if (baseLvl >= 99) maxHP += 2000;

  const spIncrease = jobEntry.SpIncrease || 10;
  // SpIncrease in tables.yml is 200 for swordman. 
  // We assume 200 means 2.0 * 100.
  let spFactor = spIncrease / 100;
  let maxSP = Math.floor((10 + baseLvl * spFactor) * (1 + totalStats.int / 100));

  let weightLimit = 2000 + baseLvl * 600 + (totalStats.str * 300);

  // 3. Combat Stats

  // ATK (Pre-RE)
  // StatusATK = STR + (STR/10)^2 + DEX/5 + LUK/5
  const statusAtk = totalStats.str + Math.floor(Math.pow(Math.floor(totalStats.str / 10), 2)) + Math.floor(totalStats.dex / 5) + Math.floor(totalStats.luk / 5);
  // BaseAtk = StatusAtk + EquipAtk
  const minAtk = statusAtk + equipAtk;
  const maxAtk = statusAtk + equipAtk;

  // MATK
  // MinMATK = INT + Floor(INT/7)^2
  // MaxMATK = INT + Floor(INT/5)^2
  const minMatk = totalStats.int + Math.floor(Math.pow(Math.floor(totalStats.int / 7), 2)) + equipMatk;
  const maxMatk = totalStats.int + Math.floor(Math.pow(Math.floor(totalStats.int / 5), 2)) + equipMatk;

  // DEF
  const softDef = totalStats.vit;
  const hardDef = equipDef;

  // MDEF
  const softMdef = totalStats.int + Math.floor(totalStats.vit / 2);
  const hardMdef = equipMdef;

  // HIT
  const hit = baseLvl + totalStats.dex + equipHit;

  // FLEE
  const flee = baseLvl + totalStats.agi + equipFlee;
  const dodge = flee;

  // CRIT
  const crit = 1 + Math.floor(totalStats.luk * 0.3) + equipCrit;

  // Perfect Dodge
  const perfectDodge = 1 + Math.floor(totalStats.luk / 10) + 0;

  // ASPD
  const rightHandId = equipment?.rightHand?.id || 0;
  const rightHandItem = m_Item[rightHandId];
  const weaponType = rightHandItem ? rightHandItem[1] : 0;

  // BaseDelay calculation
  const weaponTypeStr = WeaponTypeMap[weaponType] || "Unarmed";
  const baseDelayVal = jobEntry.BaseASPD ? (jobEntry.BaseASPD[weaponTypeStr] || jobEntry.BaseASPD["Unarmed"] || 1.0) : 1.0;
  // Convert Table Value to Delay. Table value 1.0 = 50 delay.
  const baseDelay = baseDelayVal * 50;

  // ASPD Formula: 200 - (WeaponDelay - ([WeaponDelay*Agi/25] + [WeaponDelay*Dex/100])/10 * (1 - SpeedMod))
  const statReduction = (baseDelay * totalStats.agi / 25) + (baseDelay * totalStats.dex / 100);
  const afterStatDelay = baseDelay - (statReduction / 10);
  const totalSpeedMod = equipAspdPercent / 100; // Potion logic is separate task
  const finalDelayWithGear = afterStatDelay * (1 - totalSpeedMod);
  let aspd = 200 - finalDelayWithGear;

  // Cap ASPD
  if (aspd > 190) aspd = 190;
  if (aspd < 0) aspd = 0;

  // Cast Time (Variable)
  // Pre-RE: Reduced by DEX. CastTime = Base * (1 - DEX/150).
  const castReduction = Math.max(0, 1 - (totalStats.dex / 150));
  const castTime = castReduction;

  // Regen (Basic)
  const hpRegen = Math.floor(Math.max(1, maxHP / 200)) + Math.floor(totalStats.vit / 5);
  let spRegen = 1 + Math.floor(maxSP / 100) + Math.floor(totalStats.int / 6);
  if (totalStats.int >= 120) spRegen += 4;

  return {
    maxHP,
    maxSP,
    atk: { min: minAtk, max: maxAtk },
    matk: { min: minMatk, max: maxMatk },
    def: hardDef,
    softDef,
    mdef: hardMdef,
    softMdef,
    hit,
    flee,
    dodge,
    crit,
    perfectDodge,
    aspd: parseFloat(aspd.toFixed(2)),
    castTime,
    hpRegen,
    spRegen,
    weightLimit,
    statBonuses: {
      str: jobBonuses.str + equipStats.str,
      agi: jobBonuses.agi + equipStats.agi,
      vit: jobBonuses.vit + equipStats.vit,
      int: jobBonuses.int + equipStats.int,
      dex: jobBonuses.dex + equipStats.dex,
      luk: jobBonuses.luk + equipStats.luk
    },
    bodyElement: getElementName(bodyElementIdx)
  };
}
