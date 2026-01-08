import React from 'react';
import { Card, CardBody } from '@heroui/react';

export function DerivedStats() {
  // Placeholder data - in a real app this would come from props calculated from stats/gear
  const stats = [
    { label: "Max HP", value: "0" },
    { label: "DEF", value: "0 + 0" },
    { label: "HIT", value: "0" },
    { label: "Max SP", value: "0" },
    { label: "MDEF", value: "0 + 0" },
    { label: "Perfect Hit", value: "0" },
    { label: "HP Regen", value: "0" },
    { label: "Real MDEF", value: "0" },
    { label: "Critical", value: "0" },
    { label: "SP Regen", value: "0" },
    { label: "ATK", value: "0 + 0" },
    { label: "Crit Shield", value: "0" },
    { label: "ASPD", value: "0" },
    { label: "Real ATK", value: "0" },
    { label: "Flee", value: "0" },
    { label: "Mov. Speed", value: "100%" },
    { label: "MATK", value: "0 ~ 0" },
    { label: "WOE Flee", value: "0" },
    { label: "Weight", value: "0" },
    { label: "Cast Time", value: "0%" },
    { label: "Perfect Dodge", value: "0" },
    { label: "", value: "" }, // Spacer
    { label: "Cast Delay", value: "0%" },
    { label: "", value: "" }, // Spacer
  ];

  return (
    <Card className="h-full border-default-200 border">
      <CardBody className="p-2">
        <div className="grid grid-cols-6 gap-x-2 gap-y-1 text-xs">
          {/* We mimic the 3-column pair layout of rocalc derived stats (Label Value | Label Value | Label Value) */}
          {/* Actually rocalc is a table with 6 columns (Label, Value, Label, Value, Label, Value) */}
          {stats.map((stat, i) => (
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
