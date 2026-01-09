import React from 'react';
import { Input } from '@heroui/react';
import { Stats } from '../types/character';

interface StatsInputProps {
  stats: Stats;
  bonuses: Stats;
  onChange: (stats: Stats) => void;
}

export function StatsInput({ stats, bonuses, onChange }: StatsInputProps) {
  const handleChange = (key: keyof Stats, value: string) => {
    onChange({ ...stats, [key]: Number(value) });
  };

  return (
    <div className="flex flex-col gap-1 p-2 border rounded-lg border-divider h-full">
      {Object.entries(stats).map(([key, value]) => (
        <div key={key} className="flex items-center justify-center gap-2 h-10">
          <span className="font-bold w-8 text-center uppercase text-sm shrink-0">{key}</span>
          <Input
            type="number"
            size="sm"
            value={value.toString()}
            onValueChange={(v) => handleChange(key as keyof Stats, v)}
            className="w-16"
            classNames={{ inputWrapper: "h-8" }}
          />
          <span className="text-small text-default-500 w-8 shrink-0">+ {bonuses[key as keyof Stats] || 0}</span>
        </div>
      ))}
    </div>
  );
}