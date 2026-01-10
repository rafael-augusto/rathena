import itemData from './items.yml';
import setData from './set_effects.yml';

// Transformation function to match the legacy m_Item format:
// [ id, type, job, val, wpnLvl, slots, weight, reqLvl, name, unknown, desc, ...script ]
export const m_Item: any[] = [];

itemData.forEach((item: any) => {
    const legacyItem = [
        item.id,
        item.type,
        item.job,
        item.val,
        item.wpnLvl,
        item.slots,
        item.weight,
        item.reqLvl,
        item.name,
        item.unknown,
        item.desc,
        ...item.script
    ];
    m_Item[item.id] = legacyItem;
});

// Legacy Set Effects Logic
export const w_SE = setData.map((set: any) => [
    set.bonusId,
    ...set.requiredItems,
    "NULL" // Add NULL back for legacy loop compatibility
]);

// Reproduce the auto-population of code 90 into items
w_SE.forEach((set: any, i: number) => {
    for (let k = 1; set[k] !== "NULL"; k++) {
        const itemId = set[k];
        if (m_Item[itemId]) {
            // Find end of script
            let j = 11;
            while (m_Item[itemId][j] !== undefined && m_Item[itemId][j] !== 0) {
                j += 2;
            }
            m_Item[itemId][j] = 90;
            m_Item[itemId][j + 1] = i;
            m_Item[itemId][j + 2] = 0;
        }
    }
});

export const v_Size = ["Small", "Medium", "Large"];
export const v_Race = [
    "<b style='color:#9F9E9B'>Formless</b>",
    "<b style='color:purple'>Undead</b>",
    "<b style='color brown'>Brute</b>",
    "<b style='color:#00DD00'>Plant</b>",
    "<b style='color:green'>Insect</b>",
    "<b style='color:blue'>Fish</b>",
    "<b style='color:#000000'>Demon</b>",
    "<b style='color:orange'>Demi-Human</b>",
    "<b style='color:#CDCD40'>Angel</b>",
    "<b style='color:red'>Dragon</b>"
];
export const v_Element = [
    "<b style='color:#A89682'>Neutral</b>",
    "<b style='color:blue'>Water</b>",
    "<b style='color:brown'>Earth</b>",
    "<b style='color:red'>Fire</b>",
    "<b style='color:#00CC00'>Wind</b>",
    "<b style='color:#bb24bb'>Poison</b>",
    "<b style='color:#CDCD00'>Holy</b>",
    "<b style='color:#000000'>Shadow</b>",
    "<b style='color:#BFBEBB'>Ghost</b>",
    "<b style='color:purple'>Undead</b>"
];

export const ItemMax = itemData.length - 1;