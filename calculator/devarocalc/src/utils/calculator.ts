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

function getJobData(jobId: number) {
    const jobKey = JobKeyMap[jobId];
    // Find the entry where the Jobs map contains the jobKey as true
    return body.find((entry: any) => entry.Jobs && entry.Jobs[jobKey] === true) || body[0];
}

function getJobBonus(jobId: number, jobLvl: number): Stats {
  const bonuses: Stats = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
  const jobEntry = getJobData(jobId);
  const bonusList = jobEntry.BonusStats; 
  
  if (!bonusList) return bonuses;

  for (const bonus of bonusList) {
    if (jobLvl >= bonus.Level) {
      if (bonus.Str) bonuses.str += bonus.Str;
      if (bonus.Agi) bonuses.agi += bonus.Agi;
      if (bonus.Vit) bonuses.vit += bonus.Vit;
      if (bonus.Int) bonuses.int += bonus.Int;
      if (bonus.Dex) bonuses.dex += bonus.Dex;
      if (bonus.Luk) bonuses.luk += bonus.Luk;
    }
  }
  return bonuses;
}

function getBaseHP(jobId: number, baseLvl: number): number {
  const jobEntry = getJobData(jobId);
  const hpFactor = jobEntry.HpFactor || 0;
  const hpIncrease = jobEntry.HpIncrease || 500; // Default 5.0
  
  let hpAdd = 0;
  for (let i = 2; i <= baseLvl; i++) {
    hpAdd += Math.round(hpFactor * i / 100);
  }
  
  return Math.floor((hpIncrease / 100) * baseLvl + 35 + hpAdd);
}

function getBaseSP(jobId: number, baseLvl: number): number {
  const jobEntry = getJobData(jobId);
  const spIncrease = jobEntry.SpIncrease || 100; // Default 1.0
  return Math.floor(10 + baseLvl * (spIncrease / 100));
}

export function calculateStats(char: Character): CalculatedStats {
  const { baseLvl, jobLvl, jobId, stats, equipment } = char;
  const jobEntry = getJobData(jobId);
  
  const jobBonuses = getJobBonus(jobId, jobLvl);
  
  // Equipment Bonuses
  let equipStats = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
  let equipAtk = 0;
  let equipMatk = 0; // Flat MATK
  let equipMatkPercent = 0;
  let equipDef = 0;
  let equipMdef = 0;
  let equipFlee = 0;
  let equipHit = 0;
  let equipCrit = 0;
  let equipPDodge = 0;
  let equipHPMul = 0;
  let equipSPMul = 0;
  let equipHPFlat = 0;
  let equipSPFlat = 0;
  let bodyElementIdx = 0; // Default Neutral

  const applyScript = (data: any[], startIndex: number, refine: number) => {
      for (let i = startIndex; i < data.length; i += 2) {
          const code = data[i];
          const val = data[i+1];
          if (code === 0) break; // End of script

          switch(code) {
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
              case 198: bodyElementIdx = val; break; // Armor Element
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

  Object.values(equipment).forEach(item => processItem(item));

  const totalStats: Stats = {
    str: stats.str + jobBonuses.str + equipStats.str,
    agi: stats.agi + jobBonuses.agi + equipStats.agi,
    vit: stats.vit + jobBonuses.vit + equipStats.vit,
    int: stats.int + jobBonuses.int + equipStats.int,
    dex: stats.dex + jobBonuses.dex + equipStats.dex,
    luk: stats.luk + jobBonuses.luk + equipStats.luk,
  };

  // --- Max HP ---
  let maxHP = getBaseHP(jobId, baseLvl);
  const isReborn = (jobId >= 21 && jobId <= 33) || (jobId >= 34 && jobId <= 40);
  if (isReborn) maxHP = Math.floor(maxHP * 1.25);
  
  maxHP = Math.floor(maxHP * (1 + totalStats.vit / 100));
  maxHP += equipHPFlat;
  maxHP = Math.floor(maxHP * (1 + equipHPMul/100));

  // --- Max SP ---
  let maxSP = getBaseSP(jobId, baseLvl);
  if (isReborn) maxSP = Math.floor(maxSP * 1.25);
  maxSP = Math.floor(maxSP * (1 + totalStats.int / 100));
  maxSP += equipSPFlat;
  maxSP = Math.floor(maxSP * (1 + equipSPMul/100));

  // --- ATK ---
  let statusAtk = totalStats.str + Math.floor(totalStats.str/10)**2 + Math.floor(totalStats.dex/5) + Math.floor(totalStats.luk/5);
  let totalAtk = statusAtk + equipAtk;

  // --- MATK ---
  let minMatk = totalStats.int + Math.floor(totalStats.int/7)**2;
  let maxMatk = totalStats.int + Math.floor(totalStats.int/5)**2;
  minMatk += equipMatk;
  maxMatk += equipMatk;
  if (equipMatkPercent > 0) {
      minMatk = Math.floor(minMatk * (1 + equipMatkPercent / 100));
      maxMatk = Math.floor(maxMatk * (1 + equipMatkPercent / 100));
  }

  // --- DEF ---
  const softDef = Math.floor(totalStats.vit * 0.5) + Math.floor(totalStats.vit * 0.3);
  const hardDef = equipDef;

  // --- MDEF ---
  const softMdef = totalStats.int + Math.floor(totalStats.vit / 2);
  const hardMdef = equipMdef;

  // --- HIT/FLEE/CRIT/P.Dodge ---
  const hit = baseLvl + totalStats.dex + equipHit;
  const flee = baseLvl + totalStats.agi + equipFlee;
  const crit = 1 + Math.floor(totalStats.luk / 3) + equipCrit;
  const perfectDodge = 1 + (totalStats.luk * 0.1) + equipPDodge;

  // --- ASPD ---
  const rightHandId = equipment.rightHand?.id || 0;
  const rightHandItem = m_Item[rightHandId];
  const weaponType = rightHandItem ? rightHandItem[1] : 0;
  
  let aspdFactor = jobEntry.BaseASPD?.Unarmed || 1;
  if (weaponType > 0 && WeaponTypeMap[weaponType]) {
      const typeKey = WeaponTypeMap[weaponType];
      if (jobEntry.BaseASPD && jobEntry.BaseASPD[typeKey]) {
          aspdFactor = jobEntry.BaseASPD[typeKey];
      }
  }
  const wd = 50 * aspdFactor;
  const delay = (wd - (Math.round(wd*totalStats.agi/25) + Math.round(wd*totalStats.dex/100))/10);
  const aspd = 200 - delay;

  return {
    maxHP, maxSP,
    atk: { min: totalAtk, max: totalAtk },
    matk: { min: minMatk, max: maxMatk },
    def: hardDef, softDef,
    mdef: hardMdef, softMdef,
    hit, flee, dodge: flee,
    crit, perfectDodge,
    aspd: parseFloat(aspd.toFixed(1)),
    castTime: Math.max(0, 1 - totalStats.dex / 150),
    hpRegen: Math.floor(totalStats.vit/5) + Math.floor(maxHP/200),
    spRegen: Math.floor(totalStats.int/6) + Math.floor(maxSP/100) + 1,
    weightLimit: 2000 + (totalStats.str * 30),
    statBonuses: {
        str: jobBonuses.str + equipStats.str,
        agi: jobBonuses.agi + equipStats.agi,
        vit: jobBonuses.vit + equipStats.vit,
        int: jobBonuses.int + equipStats.int,
        dex: jobBonuses.dex + equipStats.dex,
        luk: jobBonuses.luk + equipStats.luk,
    },
    bodyElement: `${ELEMENT_NAMES[bodyElementIdx]} 1`
  };
}
