import React from 'react';
import { Select, SelectItem, Input } from '@heroui/react';
import { JobMap } from '../data/jobs';

interface JobSelectionProps {
  jobId: number;
  baseLvl: number;
  jobLvl: number;
  onChangeJob: (id: number) => void;
  onChangeBaseLvl: (lvl: number) => void;
  onChangeJobLvl: (lvl: number) => void;
}

export function JobSelection({ jobId, baseLvl, jobLvl, onChangeJob, onChangeBaseLvl, onChangeJobLvl }: JobSelectionProps) {
  return (
    <div className="flex flex-col gap-2 p-2 border rounded-lg border-divider h-full">
      {/* Base Level Row */}
      <div className="flex items-center gap-2 h-10">
        <span className="text-small font-bold w-20 text-right shrink-0">Base Lvl</span>
        <Input 
          type="number" 
          size="sm"
          value={baseLvl.toString()} 
          onValueChange={(v) => onChangeBaseLvl(Number(v))}
          className="w-20"
          classNames={{ inputWrapper: "h-8" }}
        />
        <div className="flex items-center gap-1 text-tiny text-default-500 shrink-0">
          <span>(auto-adjust</span>
          <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" aria-label="Auto-adjust level" />
          <span>)</span>
        </div>
      </div>
      
      {/* Job Level Row */}
      <div className="flex items-center gap-2 h-10">
        <span className="text-small font-bold w-20 text-right shrink-0">Job Lvl</span>
        <Input 
          type="number" 
          size="sm"
          value={jobLvl.toString()} 
          onValueChange={(v) => onChangeJobLvl(Number(v))}
          className="w-20"
          classNames={{ inputWrapper: "h-8" }}
        />
      </div>

      {/* Class Selection Row */}
      <div className="flex items-center gap-2 min-h-10">
        <span className="text-small font-bold w-20 text-right shrink-0">Class</span>
        <Select 
          size="sm"
          variant="bordered"
          selectedKeys={[jobId.toString()]}
          onChange={(e) => onChangeJob(Number(e.target.value))}
          className="flex-1"
          aria-label="Class Selection"
          classNames={{ 
            trigger: "border-1 flex items-center !h-8 !min-h-8 py-0",
            innerWrapper: "flex flex-row items-center justify-between w-full",
            value: "text-small !text-foreground",
            popoverContent: "dark bg-content1 text-foreground !overflow-hidden"
          }}
          scrollShadowProps={{ 
            isEnabled: true,
            className: "max-h-[400px]"
          }}
          disableAnimation={true}
        >
          {JobMap.map((job) => (
            <SelectItem key={job.id} textValue={job.name}>
              {job.name}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Adopted Checkbox Row */}
      <div className="flex items-center gap-2 h-10">
        <span className="text-small font-bold w-20 text-right shrink-0">Adopted</span>
        <div className="flex-1 flex items-center">
            <input type="checkbox" className="w-4 h-4 cursor-pointer" aria-label="Adopted" />
        </div>
      </div>
      
      {/* Race & Size Display */}
      <div className="flex items-center gap-2 h-10">
        <span className="text-small font-bold w-20 text-right shrink-0">Race & Size</span>
        <span className="text-small text-default-600 flex-1">Demi-Human & Medium</span>
      </div>

      {/* Body Element Display */}
      <div className="flex items-center gap-2 h-10">
        <span className="text-small font-bold w-20 text-right shrink-0">Body Ele.</span>
        <span className="text-small text-default-600 flex-1">Neutral 1</span>
      </div>
    </div>
  );
}