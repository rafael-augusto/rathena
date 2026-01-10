import { Character, Stats } from '../types/character';
import tableData from '../data/tables.yml';
import { JobKeyMap } from '../data/jobs';
import { m_Item } from '../data/items';
import { m_Card } from '../data/cards';
import { WeaponTypeMap } from '../data/equip_logic';

// Map YML body to a usable structure
const body = tableData.Body;

// ... interface CalculatedStats ...

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
  // let equipASPD = 0; 

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
              // case 12: ASPD? 
              case 13: equipHPFlat += val; break; // HP Flat
              case 14: equipSPFlat += val; break; // SP Flat
              case 15: equipHPMul += val; break; // HP %
              case 16: equipSPMul += val; break; // SP %
              case 17: equipAtk += val; break; // ATK Flat? No, items.js says "ATK" (17) is usually Range Attack %? 
                       // Wait, Items.js L2000+: if (17 <= nC1 && nC1 <= 19) -> wNAME1.
                       // wNAME1 = [..., "ATK", "DEF", "MDEF"] (Indices 17, 18, 19).
                       // So 17=ATK, 18=DEF, 19=MDEF.
                       equipAtk += val; break;
              case 18: equipDef += val; break;
              case 19: equipMdef += val; break;
              
              // Refine bonuses? Usually scripted as "val * refine" in the loop if handled by legacy calc.
              // But here we might just get static values. 
              // Legacy calc iterates and evaluates. 
              // m_Item in items.js are static arrays.
              // Dynamic bonuses are usually hardcoded or special codes.
              // For MVP, we parse static bonuses.
              
              // 87: ATK %
              case 87: equipAtk += Math.floor(equipAtk * val / 100); break; // Rough approx
              // 88: MATK %
              case 88: equipMatkPercent += val; break;
              // 89: MATK Flat? Or %? 
              case 89: equipMatkPercent += val; break; 
              
              default: break;
          }
      }
  };

  const processItem = (slotItem: any) => {
      if (!slotItem || slotItem.id === 0) return;
      const data = m_Item[slotItem.id];
      if (!data) return;

      // Base stats from item (ATK/DEF)
      // data[3] = ATK (if weapon) or DEF (if armor)?
      // data[1] is Type. 1-21 Weapon. 50+ Armor/etc.
      if (data[1] <= 21) {
          equipAtk += data[3];
          // Weapon Level data[4]
      } else {
          equipDef += data[3]; // For armors, index 3 is usually DEF?
          // Check items.js: [293,60,...,120,... "Coat"] -> 120 is Weight? 
          // [293,60, 1, 5, 0, "0/1", 120, 1, "Coat"...]
          // Index 3 is 5? That seems low for Coat. Coat def is 5. Yes.
          // Weight is index 6 (120).
      }

      // Script
      applyScript(data, 11, slotItem.refine);

      // Cards
      slotItem.cards.forEach((cardId: number) => {
          if (cardId === 0) return;
          const cardData = m_Card.find((c: any) => c[0] === cardId);
          if (cardData) {
              applyScript(cardData, 4, 0);
          }
      });
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
  const isReborn = jobId >= 21; 
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
  let totalAtk = statusAtk + equipAtk; // Simplified

  // --- MATK ---
  let minMatk = totalStats.int + Math.floor(totalStats.int/7)**2;
  let maxMatk = totalStats.int + Math.floor(totalStats.int/5)**2;
  
  // Apply equipMatk (Flat)
  minMatk += equipMatk;
  maxMatk += equipMatk;

  // Apply equipMatkPercent
  if (equipMatkPercent > 0) {
      minMatk = Math.floor(minMatk * (1 + equipMatkPercent / 100));
      maxMatk = Math.floor(maxMatk * (1 + equipMatkPercent / 100));
  }

  // --- DEF ---
  const softDef = Math.floor(totalStats.vit * 0.5) + Math.floor(totalStats.vit * 0.3);
  const hardDef = equipDef; // + refine bonuses (todo)

  // --- MDEF ---
  const softMdef = totalStats.int + Math.floor(totalStats.vit / 2);
  const hardMdef = equipMdef;

  // --- HIT/FLEE/CRIT/P.Dodge ---
  const hit = baseLvl + totalStats.dex + equipHit;
  const flee = baseLvl + totalStats.agi + equipFlee;
  const crit = 1 + Math.floor(totalStats.luk / 3) + equipCrit;
  const perfectDodge = 1 + (totalStats.luk * 0.1) + equipPDodge;

  // --- ASPD ---
  // Determine Base ASPD factor based on Weapon
  const rightHandId = equipment.rightHand.id;
  const rightHandItem = m_Item[rightHandId];
  const weaponType = rightHandItem ? rightHandItem[1] : 0;
  
  let aspdFactor = jobEntry.BaseASPD?.Unarmed || 1; // Default
  
  if (weaponType > 0 && WeaponTypeMap[weaponType]) {
      const typeKey = WeaponTypeMap[weaponType];
      if (jobEntry.BaseASPD && jobEntry.BaseASPD[typeKey]) {
          aspdFactor = jobEntry.BaseASPD[typeKey];
      }
  }

  const wd = 50 * aspdFactor;
  const delay = (wd - (Math.round(wd*totalStats.agi/25) + Math.round(wd*totalStats.dex/100))/10);
  const aspd = 200 - delay; // Needs equipASPD modifier

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
    }
  };
}