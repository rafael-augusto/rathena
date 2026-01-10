import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { JobSelection } from './components/JobSelection';
import { StatsInput } from './components/StatsInput';
import { DerivedStats } from './components/DerivedStats';
import { EquipmentSelect } from './components/EquipmentSelect';
import { Character, EquippedItem } from './types/character';
import { calculateStats, CalculatedStats } from './utils/calculator';
import { m_Item } from './data/items';
import { canEquip, ITEM_TYPES, CARD_SLOTS } from './data/equip_logic';

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
  equipment: {
    rightHand: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
    leftHand: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
    headUpper: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
    headMiddle: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
    headLower: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
    armor: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
    garment: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
    shoes: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
    accessory1: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
    accessory2: { id: 0, refine: 0, cards: [0, 0, 0, 0] },
  }
};

const DUAL_WIELD_JOBS = [8, 22, 44]; // Assassin, Ass. Cross, Ninja (Check data/jobs.ts for indices)
const TWO_HANDED_TYPES = [3, 5, 7, 10, 11, 16, 18, 19, 20, 21];

function App() {
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [calculatedStats, setCalculatedStats] = useState<CalculatedStats | null>(null);
  const [leftHandMode, setLeftHandMode] = useState<'Weapon' | 'Shield'>('Shield');

  // Recalculate stats whenever character changes
  useEffect(() => {
    const stats = calculateStats(character);
    setCalculatedStats(stats);
  }, [character]);

  // Ensure leftHandMode is reset if not dual wield
  // And clamp Job Level based on class max
  useEffect(() => {
      const job = character.jobId;
      if (!DUAL_WIELD_JOBS.includes(job) && leftHandMode === 'Weapon') {
          setLeftHandMode('Shield');
      }

      // Clamp Job Level
      const getMaxJobLvl = (id: number) => {
        if (id === 0 || id === 34) return 10;
        if (id >= 21 && id <= 33) return 70;
        if (id === 20) return 99;
        return 50;
      };
      
      const max = getMaxJobLvl(job);
      if (character.jobLvl > max) {
          setCharacter(prev => ({ ...prev, jobLvl: max }));
      }
  }, [character.jobId]);

  // Unequip invalid left hand item when mode changes
  useEffect(() => {
      const leftHand = character.equipment.leftHand;
      if (leftHand.id === 0) return;
      
      const item = m_Item[leftHand.id];
      if (!item) return;
      
      const isShield = item[1] === ITEM_TYPES.SHIELD;
      const isWeapon = item[1] >= ITEM_TYPES.WEAPON_START && item[1] <= ITEM_TYPES.WEAPON_END;
      
      if (leftHandMode === 'Shield' && !isShield) {
           updateEquipment('leftHand', { id: 0, refine: 0, cards: [0, 0, 0, 0] });
      } else if (leftHandMode === 'Weapon' && !isWeapon) {
           updateEquipment('leftHand', { id: 0, refine: 0, cards: [0, 0, 0, 0] });
      }
  }, [leftHandMode]);

  // Validate Equipment when Job or dependencies change
  useEffect(() => {
      const job = character.jobId;
      const rightHandId = character.equipment.rightHand.id;
      const rightHandItem = m_Item[rightHandId];
      const is2H = rightHandItem && TWO_HANDED_TYPES.includes(rightHandItem[1]);
      const isDualWield = DUAL_WIELD_JOBS.includes(job);

      let newEquipment = { ...character.equipment };
      let changed = false;

      // Helper to check validity
      const validate = (slot: keyof Character['equipment'], allowedTypes: number[] | 'WEAPONS' | 'LEFT_HAND') => {
          const item = m_Item[newEquipment[slot].id];
          if (!item || newEquipment[slot].id === 0) return; // Empty is always valid

          // 1. Job Check
          if (!canEquip(job, item[2])) {
              newEquipment[slot] = { id: 0, refine: 0, cards: [0, 0, 0, 0] };
              changed = true;
              return;
          }

          // 2. Type Check
          const type = item[1];
          if (allowedTypes === 'WEAPONS') {
               if (type < ITEM_TYPES.WEAPON_START || type > ITEM_TYPES.WEAPON_END) {
                   newEquipment[slot] = { id: 0, refine: 0, cards: [0, 0, 0, 0] };
                   changed = true;
               }
          } else if (allowedTypes === 'LEFT_HAND') {
              if (is2H) {
                  // If 2H, must be empty
                  newEquipment[slot] = { id: 0, refine: 0, cards: [0, 0, 0, 0] };
                  changed = true;
              } else {
                  // Must be Shield OR (Dual Wield AND Weapon)
                  const isShield = type === ITEM_TYPES.SHIELD;
                  const isWeapon = type >= ITEM_TYPES.WEAPON_START && type <= ITEM_TYPES.WEAPON_END;
                  
                  if (!isShield && !(isDualWield && isWeapon)) {
                      newEquipment[slot] = { id: 0, refine: 0, cards: [0, 0, 0, 0] };
                      changed = true;
                  }
              }
          } else if (Array.isArray(allowedTypes)) {
              if (!allowedTypes.includes(type)) {
                  newEquipment[slot] = { id: 0, refine: 0, cards: [0, 0, 0, 0] };
                  changed = true;
              }
          }
      };

      validate('rightHand', 'WEAPONS');
      validate('leftHand', 'LEFT_HAND');
      validate('headUpper', [ITEM_TYPES.HEAD_UPPER]);
      validate('headMiddle', [ITEM_TYPES.HEAD_MIDDLE]);
      validate('headLower', [ITEM_TYPES.HEAD_LOWER]);
      validate('armor', [ITEM_TYPES.ARMOR]);
      validate('garment', [ITEM_TYPES.GARMENT]);
      validate('shoes', [ITEM_TYPES.SHOES]);
      validate('accessory1', [ITEM_TYPES.ACCESSORY]);
      validate('accessory2', [ITEM_TYPES.ACCESSORY]);

      if (changed) {
          setCharacter(prev => ({ ...prev, equipment: newEquipment }));
      }

  }, [character.jobId, character.equipment.rightHand.id]); // Dependencies: Job and Right Hand (for 2H check)


  const getAvailableItems = (typeIds: number[] | 'WEAPONS' | 'LEFT_HAND') => {
      const list: number[] = [];
      const job = character.jobId;
      
      const isDualWield = DUAL_WIELD_JOBS.includes(job);
      const rightHandId = character.equipment.rightHand.id;
      const rightHandItem = m_Item[rightHandId];
      const is2H = rightHandItem && TWO_HANDED_TYPES.includes(rightHandItem[1]);

      m_Item.forEach((item: any, index: number) => {
          if (!item) return;
          if (index === 0) { list.push(0); return; }

          const type = item[1];
          const jobCode = item[2];
          
          if (!canEquip(job, jobCode)) return;

          let include = false;

          if (typeIds === 'WEAPONS') {
              if (type >= ITEM_TYPES.WEAPON_START && type <= ITEM_TYPES.WEAPON_END) include = true;
          } else if (typeIds === 'LEFT_HAND') {
              if (is2H && index !== 0) {
                  // If 2H weapon equipped, Left Hand only allows "No Item" (which is index 0)
                  include = false;
              } else {
                  if (type === ITEM_TYPES.SHIELD) {
                      if (isDualWield && leftHandMode === 'Weapon') include = false;
                      else include = true;
                  }
                  
                  if (isDualWield && type >= ITEM_TYPES.WEAPON_START && type <= ITEM_TYPES.WEAPON_END) {
                      if (leftHandMode === 'Shield') include = false;
                      else if (!TWO_HANDED_TYPES.includes(type)) include = true;
                  }
              }
          } else if (Array.isArray(typeIds)) {
              if (typeIds.includes(type)) include = true;
          }

          if (include) list.push(index);
      });
      return list;
  };

  // Memoize lists to avoid expensive recalculations on every render
  const availableWeapons = useMemo(() => getAvailableItems('WEAPONS'), [character.jobId]);
  
  const availableLeftHand = useMemo(() => getAvailableItems('LEFT_HAND'), 
    [character.jobId, character.equipment.rightHand.id, leftHandMode]); // Depends on RH for 2H check and mode

  const availableHeadUpper = useMemo(() => getAvailableItems([ITEM_TYPES.HEAD_UPPER]), [character.jobId]);
  const availableHeadMiddle = useMemo(() => getAvailableItems([ITEM_TYPES.HEAD_MIDDLE]), [character.jobId]);
  const availableHeadLower = useMemo(() => getAvailableItems([ITEM_TYPES.HEAD_LOWER]), [character.jobId]);
  
  const availableArmor = useMemo(() => getAvailableItems([ITEM_TYPES.ARMOR]), [character.jobId]);
  const availableGarment = useMemo(() => getAvailableItems([ITEM_TYPES.GARMENT]), [character.jobId]);
  const availableShoes = useMemo(() => getAvailableItems([ITEM_TYPES.SHOES]), [character.jobId]);
  const availableAccessory = useMemo(() => getAvailableItems([ITEM_TYPES.ACCESSORY]), [character.jobId]);


  const updateEquipment = (slot: keyof Character['equipment'], item: EquippedItem) => {
      setCharacter(prev => ({
          ...prev,
          equipment: {
              ...prev.equipment,
              [slot]: item
          }
      }));
  };

  return (
    <div className="p-2 text-foreground w-full max-w-[1280px] mx-auto">
        <div className="mb-2 text-center">
            <h1 className="text-xl font-bold">DevaRO Calc (Pre-Renewal)</h1>
        </div>

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_220px_1fr] gap-2 mb-2">
            <JobSelection
              jobId={character.jobId}
              baseLvl={character.baseLvl}
              jobLvl={character.jobLvl}
              onChangeJob={(id) => setCharacter({ ...character, jobId: id })}
              onChangeBaseLvl={(lvl) => setCharacter({ ...character, baseLvl: lvl })}
              onChangeJobLvl={(lvl) => setCharacter({ ...character, jobLvl: lvl })}
            />

            <StatsInput
              stats={character.stats}
              bonuses={calculatedStats?.statBonuses || { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 }}
              onChange={(stats) => setCharacter({ ...character, stats })}
              baseLvl={character.baseLvl}
              jobId={character.jobId}
            />

            {calculatedStats && <DerivedStats stats={calculatedStats} />}
        </div>

        {/* Equipment Grid */}
        <Card className="w-full mb-2 border border-default-200 shadow-sm">
            <CardBody className="p-2">
                <h3 className="text-md font-bold mb-2 px-1">Equipment & Cards</h3>
                <div className="grid grid-cols-1 lg:grid-cols-[280px_280px_1fr] gap-x-2 gap-y-2">
                    {/* Column 1: Right Hand */}
                    <div className="flex flex-col gap-2">
                        <EquipmentSelect 
                            label="Right Hand"
                            placeholder="(No Weapon)"
                            equipped={character.equipment.rightHand}
                            onChange={(item) => updateEquipment('rightHand', item)}
                            availableItems={availableWeapons}
                            cardSlotType={CARD_SLOTS.WEAPON}
                            refinePlacement="left"
                            containerClassName="min-h-[210px]"
                        />
                    </div>

                    {/* Column 2: Left Hand */}
                    <div className="flex flex-col gap-2">
                        <EquipmentSelect 
                            label="Left Hand"
                            placeholder={leftHandMode === 'Weapon' ? "(No Weapon)" : "(No Shield)"}
                            topRightContent={DUAL_WIELD_JOBS.includes(character.jobId) && (
                                <div className="flex gap-2 text-xs items-center">
                                    <label className="flex items-center gap-1 cursor-pointer scale-90 origin-right">
                                        <input 
                                            type="radio" 
                                            checked={leftHandMode === 'Shield'} 
                                            onChange={() => setLeftHandMode('Shield')} 
                                            className="w-3 h-3 accent-primary"
                                        />
                                        Shield
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer scale-90 origin-right">
                                        <input 
                                            type="radio" 
                                            checked={leftHandMode === 'Weapon'} 
                                            onChange={() => setLeftHandMode('Weapon')} 
                                            className="w-3 h-3 accent-primary"
                                        />
                                        Weapon
                                    </label>
                                </div>
                            )}
                            equipped={character.equipment.leftHand}
                            onChange={(item) => updateEquipment('leftHand', item)}
                            availableItems={availableLeftHand}
                            cardSlotType={(character.equipment.leftHand.id && m_Item[character.equipment.leftHand.id]) ? (m_Item[character.equipment.leftHand.id][1] === ITEM_TYPES.SHIELD ? CARD_SLOTS.SHIELD : CARD_SLOTS.WEAPON) : (leftHandMode === 'Shield' ? CARD_SLOTS.SHIELD : CARD_SLOTS.WEAPON)}
                            refinePlacement="left"
                            containerClassName="min-h-[210px]"
                        />
                    </div>

                    {/* Column 3: Equipment Panel */}
                    <div className="flex flex-col gap-1.5 p-2 border rounded-lg border-default-200 bg-content2/20">
                        <EquipmentSelect 
                            placeholder="(No Upper Headgear)"
                            equipped={character.equipment.headUpper}
                            onChange={(item) => updateEquipment('headUpper', item)}
                            availableItems={availableHeadUpper}
                            cardSlotType={CARD_SLOTS.HEAD}
                            refinePlacement="left"
                            cardsPlacement="right"
                            variant="minimal"
                        />
                        <EquipmentSelect 
                            placeholder="(No Middle Headgear)"
                            equipped={character.equipment.headMiddle}
                            onChange={(item) => updateEquipment('headMiddle', item)}
                            availableItems={availableHeadMiddle}
                            cardSlotType={CARD_SLOTS.HEAD}
                            cardsPlacement="right"
                            variant="minimal"
                        />
                        <EquipmentSelect 
                            placeholder="(No Lower Headgear)"
                            equipped={character.equipment.headLower}
                            onChange={(item) => updateEquipment('headLower', item)}
                            availableItems={availableHeadLower}
                            cardSlotType={CARD_SLOTS.HEAD}
                            cardsPlacement="right"
                            variant="minimal"
                        />
                        <EquipmentSelect 
                            placeholder="(No Armor)"
                            equipped={character.equipment.armor}
                            onChange={(item) => updateEquipment('armor', item)}
                            availableItems={availableArmor}
                            cardSlotType={CARD_SLOTS.ARMOR}
                            refinePlacement="left"
                            cardsPlacement="right"
                            variant="minimal"
                        />
                        <EquipmentSelect 
                            placeholder="(No Garment)"
                            equipped={character.equipment.garment}
                            onChange={(item) => updateEquipment('garment', item)}
                            availableItems={availableGarment}
                            cardSlotType={CARD_SLOTS.GARMENT}
                            refinePlacement="left"
                            cardsPlacement="right"
                            variant="minimal"
                        />
                        <EquipmentSelect 
                            placeholder="(No Shoes)"
                            equipped={character.equipment.shoes}
                            onChange={(item) => updateEquipment('shoes', item)}
                            availableItems={availableShoes}
                            cardSlotType={CARD_SLOTS.SHOES}
                            refinePlacement="left"
                            cardsPlacement="right"
                            variant="minimal"
                        />
                        <EquipmentSelect 
                            placeholder="(No Accessory)"
                            equipped={character.equipment.accessory1}
                            onChange={(item) => updateEquipment('accessory1', item)}
                            availableItems={availableAccessory}
                            cardSlotType={CARD_SLOTS.ACCESSORY}
                            cardsPlacement="right"
                            variant="minimal"
                        />
                        <EquipmentSelect 
                            placeholder="(No Accessory)"
                            equipped={character.equipment.accessory2}
                            onChange={(item) => updateEquipment('accessory2', item)}
                            availableItems={availableAccessory}
                            cardSlotType={CARD_SLOTS.ACCESSORY}
                            cardsPlacement="right"
                            variant="minimal"
                        />
                    </div>
                </div>
            </CardBody>
        </Card>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-2 bg-content1 border-t border-divider flex justify-center gap-4 shadow-lg z-50">
          <Button color="primary" size="md" className="font-bold">Calculate</Button>
          <Button color="secondary" size="md">Save</Button>
        </div>
        
        {/* Spacer for fixed bottom bar */}
        <div className="h-16"></div>
    </div>
  )
}

export default App