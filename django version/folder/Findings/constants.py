NUMPERMUTATIONS = int(1e4)
PROJECTTITLE = "12-4E Drag Analysis"
NAMEDSETUPS = ["Chipped DPS m16 5*dmg1 Rescue Jill b-formation min speed",
                "Chipped DPS m16 5*dmg1 Rescue Jill b-formation max speed",
                "Chipped DPS m16 5*fervor mortar Jill b-formation min speed",
                "Chipped DPS m16 5*fervor mortar Jill b-formation max speed",
                "Chipped DPS m16 5*dmg1 rescue Jill 0-2-formation min speed",
                "Chipped DPS m16 5*dmg1 rescue Jill 0-2-formation max speed",
                "Chipped DPS m16 1*cool lv100beach Jill b-formation min speed",
                "Chipped DPS m16 1*cool lv100beach Jill b-formation max speed",
                "Chipped DPS m16 1*cool lv100beach Jill 0-2-formation min speed",
                "Chipped DPS m16 1*cool lv100beach Jill 0-2-formation max speed",
                "Chipless DPS M16 SPEQ+Exo 5*dmg1 Rescue Jill b-formation min speed",
                "Chipless DPS M16 SPEQ+Exo 5*armor2 armor Jill b-formation min speed",
                "Chipless DPS M16 SPEQ+Exo 5*fervor mortar Jill b-formation min speed",
                "Chipless DPS M16 SPEQ+Exo 5*dmg1 rescue Jill 0-2-formation min speed",
                "Chipless DPS M16 SPEQ+Exo 5*armor2 armor Jill 0-2-formation min speed",
                "Chipless DPS M16 SPEQ+Exo 5*fervor mortar Jill 0-2-formation min speed",
                "Chipless DPS Shorty 5*dmg1 Rescue Jill b-formation min speed",
                "Chipless DPS Shorty 5*fervor mortar Jill b-formation min speed",
                "Chipless DPS Shorty 5*dmg1 rescue Jill 0-2-formation min speed",
                "Chipless DPS Shorty 5*fervor mortar Jill 0-2-formation min speed",
                "Chipless DPS M16 SPEQ+Exo 2*dmg2 lv31 beach Jill b-formation min speed",
                "Chipless DPS Shorty 2*dmg2 lv31 beach Jill b-formation min speed",
                "Chipless DPS M16 SPEQ+Exo 2*dmg2 lv60 beach Jill 0-2-formation min speed",
                "Chipless DPS Shorty 2*dmg2 lv60 beach Jill 0-2-formation min speed",
                "Chipless DPS Shorty 2*dmg2 lv78 beach only 0-2-formation min speed",
                "Chipless DPS Shorty 2*dmg2 lv78 beach only b-formation min speed",
                "Chipless DPS M16 SPEQ+Exo 5*dmg1 Rescue Jill b-formation max speed",
                "Chipless DPS Shorty 2*dmg2 lv84 beach Jill b-formation max speed",
                "Chipless DPS M16 SPEQ+Exo 5*dmg1 rescue Jill 0-2-formation max speed",
                "Chipless DPS Shorty 5*dmg1 Rescue Jill b-formation max speed",
                "Chipless DPS Shorty 5*dmg1 rescue Jill 0-2-formation max speed",
                "Chipless DPS Shorty 2*dmg2 lv89 beach Jill 0-2-formation max speed",
                "Chipless DPS Shorty 5*fervor mortar Jill 0-2-formation max speed",
                "Chipless DPS Shorty 5*fervor mortar Jill b-formation max speed",
                "Chipless DPS M16 SPEQ+Exo 2*dmg2 lv95 beach Jill b-formation max speed",
                "Chipless DPS M16 SPEQ+Exo 2*dmg2 lv99 beach Jill 0-2-formation max speed",
                "Chipless DPS Shorty 2*dmg2 lv100 beach only b-formation max speed",
                "Chipless DPS Shorty 2*dmg2 lv100 beach only 0-2-formation max speed",
                "Chipless DPS M16 SPEQ+Armor 5*dmg1 Rescue Jill b-formation min speed",
                "Chipless DPS M16 SPEQ+Armor 1*cool lv100 beach Jill b-formation min speed"]
# enums
class FORMATIONS():
    FORMATION_B  = "b-formation"
    FORMATION_02 = "0-2-formation"

    def List():
        return ["b-formation", "0-2-formation"]
class FAIRIES():
    RESCUE = "Rescue"
    MORTAR = "Mortar"
    ARMOR = "Armor"
    BEACH = "Beach"

    def List():
        return ["Rescue", "Mortar", "Armor", "Beach"]
class TANKS():
    M16 = "M16"
    SUPERSHORTY = "Super Shorty" 

    def List():
        return ["M16", "Super Shorty"]
class CARRY():
    HK416 = "416"
    K11 = "k11"
    UZI = "uzi"
    SOP = "sop"

    def List():
        return ["416", "k11", "uzi", "sop"]
class TESTMODES():
    MEAN = "Mean"
    KSTEST = "KS"
    STDDEV = "Standard Deviation"

    def List():
        return ["Mean", "KS", "Standard Deviation"]
class COMPARISONS():
    EXO_ARMOR = "Exo-Armor"
    CHIPPED_FORMATION = "Chipped Formation"
    CHIPLESS_FORMATION = "Chipless Formation"
    CHIPPED_SPEED = "Chipped Speed"
    CHIPLESS_SPEED = "Chipless Speed"
    TANK = "Tank"
    EQUIP = "Equip"
    UZI = "Uzi"

    def List():
        return ["Exo-Armor","Chipped Formation","Chipless Formation","Chipped Speed","Chipless Speed","Tank","Equip","Uzi"]