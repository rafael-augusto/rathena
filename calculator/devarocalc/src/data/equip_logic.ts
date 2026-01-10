export const WeaponName = ["Bare Hand","Dagger","Sword","Two-handed Sword","Spear","Two-handed Spear","Axe","Two-handed Axe","Mace","Rod / Staff","Bow","Katar","Book","Knuckle","Instrument","Whip","Huuma Shuriken","Handgun","Rifle","Shotgun","Gatling Gun","Grenade Launcher"];

export const WeaponTypeMap: Record<number, string> = {
    0: "Unarmed",
    1: "Dagger",
    2: "1H_Sword",
    3: "2H_Sword",
    4: "1H_Spear",
    5: "2H_Spear",
    6: "1H_Axe",
    7: "2H_Axe",
    8: "Mace",
    9: "Rod",
    10: "Bow",
    11: "Katar",
    12: "Book",
    13: "Knuckle",
    14: "Instrument",
    15: "Whip",
    16: "Huuma",
    17: "Handgun",
    18: "Rifle",
    19: "Shotgun",
    20: "Gatling",
    21: "Grenade"
};

export const ITEM_TYPES = {
    WEAPON_START: 1,
    WEAPON_END: 21,
    HEAD_UPPER: 50,
    HEAD_MIDDLE: 51,
    HEAD_LOWER: 52,
    ARMOR: 60,
    SHIELD: 61,
    GARMENT: 62,
    SHOES: 63,
    ACCESSORY: 64,
};

export const CARD_SLOTS = {
    WEAPON: 1,
    HEAD: 2,
    SHIELD: 3,
    ARMOR: 4,
    GARMENT: 5,
    SHOES: 6,
    ACCESSORY: 7,
};

export const m_JobEquip = [
[0,50,90,100,999]
,[0, 1, 51,101, 70, 71, 72, 74, 75, 78,83,84,85,86,87,90,91,999]
,[0, 1, 52,102, 72, 74, 75, 78, 80, 83,84,85,91,999]
,[0, 1, 53,103, 71, 73, 74, 77, 78, 85,89,57,999]
,[0, 1, 54,104, 75, 76, 83, 89,999]
,[0, 1, 55,105, 71, 77, 89, 57,999]
,[0, 1, 56,106, 70, 71, 72, 73, 74, 75,78,83,84,85,86,90,91,999]
,[0, 1, 51, 61,107, 70, 71, 72, 74, 75,78,79,83,84,85,86,87,90,91,999]  //knight
,[0, 1, 52, 62,108, 72, 74, 75, 78, 79,81,83,84,85,90,91,999]   //assassin
,[0, 1, 53, 63,109, 71, 73, 74, 77, 78,79,81,85,89,57,999]  //priest
,[0, 1, 54, 64,110, 75, 76, 79, 80, 83,88,89,999]   //hunter
,[0, 1, 55, 65,111, 71, 77, 79, 89, 57,999]     //wizard
,[0, 1, 56, 66,112, 70, 71, 72, 73, 74,75,78,79,83,84,85,86,90,91,999]  //blacksmith
,[0, 1, 51, 61,113, 70, 71, 72, 74, 75,78,79,83,84,85,86,87,90,91,999]  //crusader
,[0, 1, 52, 62,114, 72, 74, 75, 76, 78,79,80,83,84,85,88,91,999]    //rogue
,[0, 1, 53, 63,115, 71, 73, 74, 77, 78,79,85,89,57,999]     //monk
,[0, 1, 54, 64,116, 74, 75, 76, 79, 83,89,999]     //bard
,[0, 1, 54, 64,117, 74, 75, 76, 79, 83,89,999]      //dancer
,[0, 1, 55, 65,118, 71, 77, 79, 89, 57,999]     //sage
,[0, 1, 56, 66,119, 70, 71, 72, 73, 74,75,78,79,83,84,85,86,90,91,999]     //alchemist
,[0,50,90,120,999]      //super novice
,[0, 1, 51, 61,107,121, 70, 71, 72, 74,75,78,79,82,83,84,85,86,87,90,91,999]    //lord knight
,[0, 1, 52, 62,108,122, 72, 74, 75, 78,79,81,82,83,84,85,90,91,999]     //assassin cross
,[0, 1, 53, 63,109,123, 71, 73, 74, 77,78,79,81,82,85,89,57,134,136,999]    //high priest
,[0, 1, 54, 64,110,124, 75, 76, 79, 80,82,83,88,89,135,999]     //sniper
,[0, 1, 55, 65,111,125, 71, 77, 79, 82,89,57,136,999]       //high wizard
,[0, 1, 56, 66,112,126, 70, 71, 72, 73,74,75,78,79,82,83,84,85,86,90,91,999]    //whitesmith
,[0, 1, 51, 61,113,127, 70, 71, 72, 74,75,78,79,82,83,84,85,86,87,90,91,999]    //paladin
,[0, 1, 52, 62,114,128, 72, 74, 75, 76,78,79,80,82,83,84,85,88,91,999]      //stalker
,[0, 1, 53, 63,115,129, 71, 73, 74, 77,78,79,82,85,89,57,134,999]   //champion
,[0, 1, 54, 64,116,130, 74, 75, 76, 79,82,83,89,135,999]    //clown
,[0, 1, 54, 64,117,131, 74, 75, 76, 79,82,83,89,135,999]    //gypsie
,[0, 1, 55, 65,118,132, 71, 77, 79, 82,89,57,999]       //professor
,[0, 1, 56, 66,119,133, 70, 71, 72, 73,74,75,78,79,82,83,84,85,86,90,91,999]    //creator
,[0] // High Novice
,[0] // High Swordman
,[0] // High Thief
,[0] // High Acolyte
,[0] // High Archer
,[0] // High Magician
,[0] // High Merchant
,[0, 1,141, 83, 84, 85,86,3001,3051,3070,3072,999]		//taekwon kid
,[0, 1,142, 79, 83, 84,85,86,87,91,2082,3001,3051,3070,3072,3079,999]   //star gladiator
,[0, 1,143, 55, 65, 71,77,79,89,111,2082,3001,3079,3089,999]    //soul linker
,[0, 1,144, 58, 52, 91,3001,3051,3054,3070,3072,3089,999]		//ninja
,[0, 1,145, 59, 83,3001,3054,3089,999]		//gunslinger
];

export function canEquip(jobId: number, itemJobCode: number): boolean {
    // Handling Reborn logic
    // In rocalc, Reborn jobs are 21-40.
    // Novice High is 34.
    // If job is 21-40 (Reborn), n_Reborn = 1.
    // 34-40 are High First Classes.
    
    // Logic from JobEquipItemSearch:
    // if (_ >= 2000 && n_A_JOB <= 40) _ -= 2000;
    // if (_ >= 1000 && _ <= 1999) { if (!n_Reborn) return 0; _ -= 1000; }
    
    let code = itemJobCode;
    const isReborn = jobId >= 21 && jobId <= 40; // Based on rocalc indices, assuming our jobId matches
    
    if (code >= 2000 && jobId <= 40) {
        code -= 2000;
    }
    
    if (code >= 1000 && code <= 1999) {
        if (!isReborn) return false;
        code -= 1000;
    }
    
    // For High First Classes (34-40 in our list?), rocalc seems to have empty entries in m_JobEquip for them (indices 34-40).
    // Wait, in m_JobEquip above, indices 34-40 are just [0].
    // This implies they fall back to something or are handled differently.
    // Let's look at `n_A_JobSet` in foot.js:
    // if (21 <= n_A_JOB && n_A_JOB <= 40) { n_Reborn = 1; if (34 <= n_A_JOB && n_A_JOB <= 40) n_A_JOB -= 34; }
    // Ah! It subtracts 34 from the job ID if it's a High First Class (34-40), effectively mapping them back to 0-6 (Novice to Merchant).
    // So High Swordman (35) becomes Swordman (1).
    
    let effectiveJobId = jobId;
    if (jobId >= 34 && jobId <= 40) {
        effectiveJobId -= 34;
    }
    
    const allowedCodes = m_JobEquip[effectiveJobId];
    if (!allowedCodes) return false;
    
    return allowedCodes.includes(code);
}