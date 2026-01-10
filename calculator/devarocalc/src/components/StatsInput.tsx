import React from 'react';
import { Stats } from '../types/character';

interface StatsInputProps {
  stats: Stats;
  bonuses: Stats;
  onChange: (stats: Stats) => void;
  baseLvl: number;
  jobId: number;
}

export function StatsInput({ stats, bonuses, onChange, baseLvl, jobId }: StatsInputProps) {
  
  const calculateTotalPoints = (level: number, id: number) => {
    const isTrans = (id >= 21 && id <= 33) || (id >= 34 && id <= 40);
    let points = isTrans ? 100 : 48;
    
    for (let i = 2; i <= level; i++) {
      points += Math.floor((i + 14) / 5);
    }
    return points;
  };

  const calculateStatCost = (statValue: number) => {
    let cost = 0;
    for (let i = 1; i < statValue; i++) {
      cost += Math.floor((i - 1) / 10) + 2;
    }
    return cost;
  };

  const totalUsed = Object.values(stats).reduce((acc, val) => acc + calculateStatCost(val), 0);
  const totalAvailable = calculateTotalPoints(baseLvl, jobId);
  const remaining = totalAvailable - totalUsed;

  const handleChange = (key: keyof Stats, value: string) => {
    onChange({ ...stats, [key]: Number(value) });
  };

  return (
    <div className="flex flex-col gap-0.5 p-1.5 border rounded-lg border-divider h-full bg-background/50">
      <div className={`text-center font-bold text-[10px] mb-1 py-0.5 px-1 rounded ${remaining < 0 ? 'bg-danger-100 text-danger' : 'bg-success-50 text-success-600'}`}>
        Points: {remaining}
      </div>

      <div className="flex flex-col gap-0.5">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="flex items-center justify-center gap-1 h-7">
            <span className="font-bold w-6 text-center uppercase text-[10px] shrink-0 text-default-600">{key}</span>
            <select 
              className="w-12 h-6 p-0 border rounded bg-default-100 text-[11px] text-foreground dark:bg-content1 border-default-200 text-center"
              value={value}
              onChange={(e) => handleChange(key as keyof Stats, e.target.value)}
            >
              {[...Array(99).keys()].map(i => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
            <span className="text-[9px] text-default-400 w-6 shrink-0">+{(bonuses as any)[key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}