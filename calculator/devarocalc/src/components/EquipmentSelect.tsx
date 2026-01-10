import React, { useMemo } from 'react';
import { m_Item } from '../data/items';
import { m_Card } from '../data/cards';
import { WeaponName, ITEM_TYPES, CARD_SLOTS } from '../data/equip_logic';
import { EquippedItem } from '../types/character';

interface EquipmentSelectProps {
  label?: string;
  placeholder?: string;
  topRightContent?: React.ReactNode;
  equipped: EquippedItem;
  onChange: (item: EquippedItem) => void;
  availableItems: number[]; // List of Item IDs
  cardSlotType: number; // 1=Wpn, 2=Head, 3=Shield, 4=Armor, 5=Garment, 6=Shoes, 7=Acc
  refinePlacement?: 'left' | 'bottom';
  cardsPlacement?: 'bottom' | 'right';
  containerClassName?: string;
  variant?: 'default' | 'minimal';
}

export const EquipmentSelect: React.FC<EquipmentSelectProps> = ({
  label,
  placeholder = "(No Item)",
  topRightContent,
  equipped,
  onChange,
  availableItems,
  cardSlotType,
  refinePlacement = 'bottom',
  cardsPlacement = 'bottom',
  containerClassName = "",
  variant = 'default',
}) => {
  const items = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    availableItems.forEach(id => {
      if (id === 0) return;
      const item = m_Item[id];
      if (!item) return;
      
      let typeName = "Armor/Shield/Etc";
      if (item[1] <= 21) {
          typeName = WeaponName[item[1]];
      } else if (item[1] === ITEM_TYPES.SHIELD) {
          typeName = "Shield";
      } else if (item[1] === ITEM_TYPES.HEAD_UPPER) {
          typeName = "Headgear (Upper)";
      } else if (item[1] === ITEM_TYPES.HEAD_MIDDLE) {
          typeName = "Headgear (Middle)";
      } else if (item[1] === ITEM_TYPES.HEAD_LOWER) {
          typeName = "Headgear (Lower)";
      } else if (item[1] === ITEM_TYPES.ARMOR) {
          typeName = "Armor";
      } else if (item[1] === ITEM_TYPES.GARMENT) {
          typeName = "Garment";
      } else if (item[1] === ITEM_TYPES.SHOES) {
          typeName = "Shoes";
      } else if (item[1] === ITEM_TYPES.ACCESSORY) {
          typeName = "Accessory";
      }

      if (!groups[typeName]) groups[typeName] = [];
      groups[typeName].push({
        id: id,
        name: item[8],
        slots: item[5]
      });
    });
    
    return groups;
  }, [availableItems]);

  const maxSlots = cardSlotType === 1 ? 4 : 1;

  const availableCards = useMemo(() => {
    return m_Card.filter((card: any) => card[1] === cardSlotType || card[0] === 0)
      .map((card: any) => ({ id: card[0], name: card[2] }));
  }, [cardSlotType]);

  const handleItemChange = (val: string) => {
    const newId = parseInt(val, 10);
    onChange({
      id: newId,
      refine: 0,
      cards: [0, 0, 0, 0],
      enchant: equipped.enchant // keep enchant if possible, or reset? Resetting is safer for non-armors.
    });
  };

  const handleRefineChange = (val: string) => {
    onChange({ ...equipped, refine: parseInt(val, 10) });
  };

  const handleCardChange = (index: number, val: string) => {
    const newCards = [...equipped.cards];
    newCards[index] = parseInt(val, 10);
    onChange({ ...equipped, cards: newCards });
  };

  const handleEnchantChange = (val: string) => {
    if (val === "0") {
      onChange({ ...equipped, enchant: undefined });
      return;
    }
    const [attr, value] = val.split(':');
    onChange({ ...equipped, enchant: { attr, value: parseInt(value, 10) } });
  };

  const renderRefineSelect = (isLeft: boolean) => (
    <select
      className={`${isLeft ? "w-full" : "w-16"} h-6 p-0 border rounded bg-default-100 text-[11px] text-foreground dark:bg-content1 border-default-200 text-center`}
      value={equipped.refine}
      onChange={(e) => handleRefineChange(e.target.value)}
      disabled={equipped.id === 0}
    >
      {[...Array(21).keys()].map(i => (
        <option key={i} value={i}>+{i}</option>
      ))}
    </select>
  );

  const renderItemSelect = () => (
    <select
      className="w-full h-6 p-0 px-1 border rounded bg-default-100 text-[11px] text-foreground dark:bg-content1 border-default-200 min-w-0"
      value={equipped.id}
      onChange={(e) => handleItemChange(e.target.value)}
    >
      <option value={0}>{placeholder}</option>
      {Object.entries(items).map(([group, groupItems]) => (
        <optgroup key={group} label={group}>
          {groupItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} {item.slots > 0 ? `[${item.slots}]` : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  const renderCardSelect = (index: number) => (
    <select
      key={index}
      className="w-full p-0 px-1 border rounded bg-default-100 text-[10px] h-6 text-foreground dark:bg-content1 border-default-200 min-w-0"
      value={equipped.cards[index] || 0}
      onChange={(e) => handleCardChange(index, e.target.value)}
      disabled={equipped.id === 0}
    >
      <option value={0}>(No Card)</option>
      {availableCards.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );

  const renderEnchantSelect = () => {
    const stats = ["str", "agi", "vit", "int", "dex", "luk"];
    const currentValue = equipped.enchant ? `${equipped.enchant.attr}:${equipped.enchant.value}` : "0";
    
    return (
      <select
        className="w-full p-0 px-1 border rounded bg-default-100 text-[10px] h-6 text-foreground dark:bg-content1 border-default-200 min-w-0"
        value={currentValue}
        onChange={(e) => handleEnchantChange(e.target.value)}
        disabled={equipped.id === 0}
      >
        <option value="0">(No Enchant)</option>
        {stats.map(stat => (
          <optgroup key={stat} label={stat.toUpperCase()}>
            <option value={`${stat}:1`}>{stat.toUpperCase()} +1</option>
            <option value={`${stat}:2`}>{stat.toUpperCase()} +2</option>
            <option value={`${stat}:3`}>{stat.toUpperCase()} +3</option>
          </optgroup>
        ))}
      </select>
    );
  };

  const containerStyle = variant === 'minimal' 
    ? "p-0 bg-transparent border-none" 
    : "p-1.5 border rounded border-default-200 bg-background/50";

  if (cardsPlacement === 'right') {
    const hasEnchant = cardSlotType === CARD_SLOTS.ARMOR;
    // Standardized Card width to 120px for all, flexible Item width
    const gridCols = hasEnchant ? "grid-cols-[45px_1fr_120px_90px]" : "grid-cols-[45px_1fr_120px_90px]";

    return (
      <div className={`flex flex-col gap-0.5 overflow-hidden w-full ${containerStyle} ${containerClassName}`}>
        {(label || topRightContent) && (
            <div className="flex justify-between items-center h-4 mb-0.5">
                <span className="text-[11px] font-bold">{label}</span>
                {topRightContent}
            </div>
        )}
        <div className={`grid ${gridCols} gap-1 items-center w-full`}>
            <div className="min-w-0">
                {refinePlacement === 'left' ? renderRefineSelect(true) : <div className="w-full" />}
            </div>
            <div className="min-w-0">
                {renderItemSelect()}
            </div>
            <div className="min-w-0">
                {renderCardSelect(0)}
            </div>
            {hasEnchant ? (
              <div className="min-w-0">
                {renderEnchantSelect()}
              </div>
            ) : <div className="w-full" />}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 overflow-hidden w-full ${containerStyle} ${containerClassName}`}>
      {(label || topRightContent) && (
          <div className="flex justify-between items-center h-4 mb-0.5">
              <span className="text-[11px] font-bold">{label}</span>
              {topRightContent}
          </div>
      )}
      
      <div className="flex flex-col gap-0.5">
          <div className="flex gap-1 items-center">
              <div className="w-12 shrink-0">
                {renderRefineSelect(true)}
              </div>
              <div className="flex-1 min-w-0">
                {renderItemSelect()}
              </div>
          </div>

          <div className="flex flex-col gap-0.5">
            {[...Array(maxSlots)].map((_, i) => (
              <div key={i} className="flex gap-1">
                <div className="w-12 shrink-0" />
                <div className="flex-1 min-w-0">
                  {renderCardSelect(i)}
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};