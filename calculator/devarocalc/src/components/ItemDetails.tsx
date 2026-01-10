import React from 'react';
import { Card, CardBody, Divider } from '@heroui/react';
import { m_Item } from '../data/items';
import { m_Card } from '../data/cards';
import { WeaponName, ITEM_TYPES } from '../data/equip_logic';
import { ItemDbData } from '../data/item_db_descriptions';

interface ItemDetailsProps {
  itemId: number;
  cardIds: number[];
}

export function ItemDetails({ itemId, cardIds }: ItemDetailsProps) {
  const item = m_Item[itemId];
  if (!item || itemId === 0) return null;

  const legacyId = item[0];
  const name = item[8];
  const type = item[1];
  const isWeapon = type >= ITEM_TYPES.WEAPON_START && type <= ITEM_TYPES.WEAPON_END;
  
  const val = item[3]; // Legacy ATK or DEF
  const weight = item[6];
  const reqLvl = item[7];
  
  // Use DB data if available, fallback to legacy
  const dbItem = ItemDbData[name.toLowerCase().trim()];
  const displayId = dbItem ? dbItem.id : legacyId;
  const dbDescription = dbItem ? dbItem.desc : "";
  const legacyDescription = item[10];
  const displayDescription = dbDescription || (legacyDescription !== "0" ? legacyDescription : "");

  // Stats from DB or legacy
  const displayAtk = dbItem ? dbItem.atk : (isWeapon ? val : 0);
  const displayMatk = dbItem ? dbItem.matk : 0;
  const displayDef = dbItem ? dbItem.def : (isWeapon ? 0 : val);
  const displayWeight = dbItem ? dbItem.weight : weight;
  const displayReqLvl = dbItem ? dbItem.minLvl : reqLvl;
  const displayWpnLvl = dbItem ? dbItem.wpnLvl : (isWeapon ? item[4] : 0);

  return (
    <Card className="border-small border-default-200 bg-background/60 shadow-none">
      <CardBody className="p-2 flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-bold text-primary flex items-center gap-1">
            <span className="text-default-400 font-mono text-[10px] shrink-0">#{displayId}</span>
            <span className="truncate">{name}</span>
          </h4>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          {isWeapon ? (
            <>
              <div className="flex justify-between border-b border-default-100 pb-0.5">
                <span className="text-default-500">ATK:</span>
                <span className="font-bold">{displayAtk}</span>
              </div>
              <div className="flex justify-between border-b border-default-100 pb-0.5">
                <span className="text-default-500">MATK:</span>
                <span className="font-bold">{displayMatk}</span>
              </div>
              <div className="flex justify-between border-b border-default-100 pb-0.5">
                <span className="text-default-500">Wpn Lvl:</span>
                <span className="font-bold">{displayWpnLvl}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between border-b border-default-100 pb-0.5">
                <span className="text-default-500">DEF:</span>
                <span className="font-bold">{displayDef}</span>
              </div>
              <div className="flex justify-between border-b border-default-100 pb-0.5">
                <span className="text-default-500">MDEF:</span>
                <span className="font-bold">0</span>
              </div>
            </>
          )}
          <div className="flex justify-between border-b border-default-100 pb-0.5">
            <span className="text-default-500">Weight:</span>
            <span className="font-bold">{displayWeight}</span>
          </div>
          <div className="flex justify-between border-b border-default-100 pb-0.5">
            <span className="text-default-500">Req. Lvl:</span>
            <span className="font-bold">{displayReqLvl}</span>
          </div>
        </div>

        {displayDescription && (
          <div className="text-[10px] text-default-600 bg-content2/40 p-1.5 rounded leading-tight italic" 
               dangerouslySetInnerHTML={{ __html: displayDescription }} />
        )}

        {/* Cards Section */}
        {cardIds.some(id => id !== 0) && (
          <div className="mt-1 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-default-400 px-1">Cards</span>
            <Divider className="opacity-50" />
            {cardIds.map((cid, i) => {
              if (cid === 0) return null;
              const card = m_Card.find(c => c[0] === cid);
              if (!card) return null;
              
              const cardName = card[2];
              let cardDbItem = ItemDbData[cardName.toLowerCase().trim()];
              if (!cardDbItem && !cardName.toLowerCase().endsWith(" card")) {
                  cardDbItem = ItemDbData[(cardName + " card").toLowerCase().trim()];
              }
              
              const cardDisplayId = cardDbItem ? cardDbItem.id : card[0];
              const cardDisplayDescription = cardDbItem ? cardDbItem.desc : (card[3] !== "0" ? card[3] : "");

              return (
                <div key={i} className="flex flex-col gap-0.5 px-1 border-l-2 border-primary/20 mb-1">
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <span className="text-[9px] text-default-400 font-mono">#{cardDisplayId}</span>
                    <span>{cardName}</span>
                  </div>
                  {cardDisplayDescription && (
                    <div className="text-[10px] text-default-500 leading-tight italic pl-2"
                         dangerouslySetInnerHTML={{ __html: cardDisplayDescription }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}