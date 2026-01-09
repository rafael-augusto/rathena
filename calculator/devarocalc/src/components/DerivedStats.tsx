import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { CalculatedStats } from '../utils/calculator';

interface DerivedStatsProps {
  stats: CalculatedStats;
}

export function DerivedStats({ stats }: DerivedStatsProps) {
  const displayStats = [
    { label: "Max HP", value: stats.maxHP.toLocaleString() },
    { label: "DEF", value: `${stats.def} + ${stats.softDef}` },
    { label: "HIT", value: stats.hit },
    { label: "Max SP", value: stats.maxSP.toLocaleString() },
    { label: "MDEF", value: `${stats.mdef} + ${stats.softMdef}` },
    { label: "Perfect Hit", value: "0" }, // TODO
    { label: "HP Regen", value: stats.hpRegen },
    { label: "Real MDEF", value: stats.mdef + stats.softMdef }, // Simplification
    { label: "Critical", value: stats.crit },
    { label: "SP Regen", value: stats.spRegen },
    { label: "ATK", value: `${stats.atk.min} ~ ${stats.atk.max}` }, // Display StatusATK for now
    { label: "Crit Shield", value: "0" }, // TODO
    { label: "ASPD", value: stats.aspd },
    { label: "Real ATK", value: `${stats.atk.min} ~ ${stats.atk.max}` },
    { label: "Flee", value: stats.flee },
    { label: "Mov. Speed", value: "100%" }, // TODO
    { label: "MATK", value: `${stats.matk.min} ~ ${stats.matk.max}` },
    { label: "WOE Flee", value: Math.floor(stats.flee * 0.8) },
    { label: "Weight", value: stats.weightLimit },
    { label: "Cast Time", value: `${Math.round(stats.castTime * 100)}%` },
    { label: "Perfect Dodge", value: stats.perfectDodge.toFixed(1) },
    { label: "", value: "" }, 
    { label: "Cast Delay", value: "100%" }, // Default
    { label: "", value: "" }, 
  ];

  return (
    <Card className="h-full border-default-200 border">
      <CardBody className="p-2">
        <div className="grid grid-cols-6 gap-x-2 gap-y-1 text-xs">
          {displayStats.map((stat, i) => (
            <React.Fragment key={i}>
              <div className="text-right font-semibold text-default-600 truncate">{stat.label}</div>
              <div className="text-left font-mono">{stat.value}</div>
            </React.Fragment>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}