import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, Divider } from '@heroui/react';
import { JobSelection } from './components/JobSelection';
import { StatsInput } from './components/StatsInput';
import { DerivedStats } from './components/DerivedStats';
import { Character } from './types/character';
import { calculateStats, CalculatedStats } from './utils/calculator';

const initialCharacter: Character = {
  baseLvl: 99,
  jobLvl: 50,
  jobId: 0, // Novice
  stats: {
    str: 1,
    agi: 1,
    vit: 1,
    int: 1,
    dex: 1,
    luk: 1,
  },
  equipment: {}
};

function App() {
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [calculatedStats, setCalculatedStats] = useState<CalculatedStats | null>(null);

  // Recalculate stats whenever character changes
  useEffect(() => {
    const stats = calculateStats(character);
    setCalculatedStats(stats);
  }, [character]);

  return (
    <div className="p-4 text-foreground w-full">
        {/* Header / Save Load Section would go here */}
        <div className="mb-4 text-center">
            <h1 className="text-2xl font-bold">DevaRO Calc (Pre-Renewal)</h1>
        </div>

        {/* Main "Your Character" Table-like Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[350px_250px_1fr] gap-2 mb-4">
            {/* Column 1: Basic Info */}
            <JobSelection
              jobId={character.jobId}
              baseLvl={character.baseLvl}
              jobLvl={character.jobLvl}
              onChangeJob={(id) => setCharacter({ ...character, jobId: id })}
              onChangeBaseLvl={(lvl) => setCharacter({ ...character, baseLvl: lvl })}
              onChangeJobLvl={(lvl) => setCharacter({ ...character, jobLvl: lvl })}
            />

            {/* Column 2: Stats */}
            <StatsInput
              stats={character.stats}
              bonuses={calculatedStats?.statBonuses || { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 }}
              onChange={(stats) => setCharacter({ ...character, stats })}
            />

            {/* Column 3: Derived Stats */}
            {calculatedStats && <DerivedStats stats={calculatedStats} />}
        </div>

        {/* Equipment Section */}
        <Card className="w-full mb-4 border border-default-200">
            <CardBody>
                <h3 className="text-lg font-bold mb-2">Equipment & Cards</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="border p-2 rounded border-default-200">
                        <div className="text-center font-bold mb-2">Right Hand</div>
                        <div className="h-32 flex items-center justify-center text-default-500 bg-content2 rounded">
                            Weapon 1 Select
                        </div>
                    </div>
                    <div className="border p-2 rounded border-default-200">
                        <div className="text-center font-bold mb-2">Left Hand</div>
                        <div className="h-32 flex items-center justify-center text-default-500 bg-content2 rounded">
                            Shield / Weapon 2 Select
                        </div>
                    </div>
                    <div className="border p-2 rounded border-default-200">
                        <div className="text-center font-bold mb-2">Armor & Accessories</div>
                        <div className="h-32 flex items-center justify-center text-default-500 bg-content2 rounded">
                            Armor/Garment/Shoes/Acc Selects
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-content1 border-t border-divider flex justify-center gap-4 shadow-lg z-50">
          <Button color="primary" size="lg" className="font-bold">Calculate</Button>
          <Button color="secondary" size="lg">Save</Button>
        </div>
        
        {/* Spacer for fixed bottom bar */}
        <div className="h-20"></div>
    </div>
  )
}

export default App
