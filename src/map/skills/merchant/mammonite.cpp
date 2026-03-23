// Copyright (c) rAthena Dev Teams - Licensed under GNU GPL
// For more information, see LICENCE in the main folder

#include "mammonite.hpp"
#include "../../pc.hpp"
SkillMammonite::SkillMammonite() : WeaponSkillImpl(MC_MAMMONITE) {
}

void SkillMammonite::calculateSkillRatio(const Damage* wd, const block_list* src, const block_list* target, uint16 skill_lv, int32& base_skillratio, int32 mflag) const {
	map_session_data *sd = (TBL_PC*)src;

	if(sd && sd->status.weapon == W_2HAXE)
		base_skillratio += -100 + 90 * skill_lv;
	else 
		base_skillratio += 50 * skill_lv;
}
