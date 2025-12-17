// Copyright (c) rAthena Dev Teams - Licensed under GNU GPL
// For more information, see LICENCE in the main folder

#include "mammonite.hpp"
#include "../../status.hpp"

SkillMammonite::SkillMammonite() : WeaponSkillImpl(MC_MAMMONITE) {
}

void SkillMammonite::calculateSkillRatio(const Damage* wd, const block_list* src, const block_list* target, uint16 skill_lv, int32& base_skillratio) const {
	status_change* sc = status_get_sc(src);

	if(sc->getSCE(SC_OVERTHRUST))
		base_skillratio += -100 + 100 * skill_lv;
	else 
		base_skillratio += 50 * skill_lv;
}
