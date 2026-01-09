import { Character, Stats } from '../types/character';
import tableData from '../data/tables.yml';
import { JobKeyMap } from '../data/jobs';

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
  const { baseLvl, jobLvl, jobId, stats } = char;
  const jobEntry = getJobData(jobId);
  
  const jobBonuses = getJobBonus(jobId, jobLvl);
  const totalStats: Stats = {
    str: stats.str + jobBonuses.str,
    agi: stats.agi + jobBonuses.agi,
    vit: stats.vit + jobBonuses.vit,
    int: stats.int + jobBonuses.int,
    dex: stats.dex + jobBonuses.dex,
    luk: stats.luk + jobBonuses.luk,
  };

  // --- Max HP ---
  let maxHP = getBaseHP(jobId, baseLvl);
  // reborn logic based on name/id
  const isReborn = jobId >= 21; // Simple threshold for now
  if (isReborn) maxHP = Math.floor(maxHP * 1.25);
  maxHP = Math.floor(maxHP * (1 + totalStats.vit / 100));

  // --- Max SP ---
  let maxSP = getBaseSP(jobId, baseLvl);
  if (isReborn) maxSP = Math.floor(maxSP * 1.25);
  maxSP = Math.floor(maxSP * (1 + totalStats.int / 100));

  // --- ATK ---
  let statusAtk = totalStats.str + Math.floor(totalStats.str/10)**2 + Math.floor(totalStats.dex/5) + Math.floor(totalStats.luk/5);

  // --- MATK ---
  const minMatk = totalStats.int + Math.floor(totalStats.int/7)**2;
  const maxMatk = totalStats.int + Math.floor(totalStats.int/5)**2;

  // --- DEF ---
  const softDef = Math.floor(totalStats.vit * 0.5) + Math.floor(totalStats.vit * 0.3);

  // --- MDEF ---
  const softMdef = totalStats.int + Math.floor(totalStats.vit / 2);

  // --- HIT/FLEE/CRIT/P.Dodge ---
  const hit = baseLvl + totalStats.dex;
  const flee = baseLvl + totalStats.agi;
  const crit = 1 + Math.floor(totalStats.luk / 3);
  const perfectDodge = 1 + (totalStats.luk * 0.1);

  // --- ASPD ---
  const aspdFactor = jobEntry.BaseASPD?.Unarmed || 1;
  const wd = 50 * aspdFactor;
  const delay = (wd - (Math.round(wd*totalStats.agi/25) + Math.round(wd*totalStats.dex/100))/10);
  const aspd = 200 - delay;

  return {
    maxHP, maxSP,
    atk: { min: statusAtk, max: statusAtk },
    matk: { min: minMatk, max: maxMatk },
    def: 0, softDef,
    mdef: 0, softMdef,
    hit, flee, dodge: flee,
    crit, perfectDodge,
    aspd: parseFloat(aspd.toFixed(1)),
    castTime: Math.max(0, 1 - totalStats.dex / 150),
    hpRegen: Math.floor(totalStats.vit/5) + Math.floor(maxHP/200),
    spRegen: Math.floor(totalStats.int/6) + Math.floor(maxSP/100) + 1,
    weightLimit: 2000 + (totalStats.str * 30),
    statBonuses: jobBonuses
  };
}