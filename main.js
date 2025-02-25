const Formations = {
    Formation_b : "b-formation",
    Formation_02 : "0-2-formation"
};

const Fairies = {
    RESCUE: "Rescue",
    MORTAR: "Mortar",
    ARMOR: "Armor",
    BEACH: "Beach"
};

const Tanks = {
    M16: "M16",
    SUPERSHORTY: "Super Shorty"
};

const Carry = {
    HK416: "416",
    K11: "k11",
    UZI: "uzi",
    SOP: "sop"
}

var csvData;
var table;
var filteredData;

var gflDescriptionToggle;
var gflDescription;

var chippedBody;
var chiplessBody;

var chippedSetupsOptions;
var chippedDPSOptions;
var chiplessSetupsOptions;
var chiplessDPSOptions;

var testedDPS;
var dpsBlocks;
var chippedChartBodies = [];

function getUniquesInCol(json, colKey) {
    var res = [];

    json.forEach(d => res.push(d[colKey]));
    
    return res.filter((d, i, a) => a.indexOf(d) == i);
}

function toggleGFLDesc() {
    if (gflDescription.style("display") == "block") {
        gflDescriptionToggle.text("Explain Game Basics");
        gflDescription.style("display", "none");
    }
    else {
        gflDescriptionToggle.text("Hide Game Basics");
        gflDescription.style("display", "block");
    }
}

function showChippedData() {
    chippedBody.style("display", "block");
    chiplessBody.style("display", "none");
}

function showChiplessData() {
    chippedBody.style("display", "none");
    chiplessBody.style("display", "block");
}

function addSection(body, headerText, bodyText) {
    body.append("h3")
            .html(headerText);
    body.append("div")
            .html(bodyText);
}

function toggleChippedCharts(index) {
    for (var i = 0; i < chippedChartBodies.length; i++) {
        chippedChartBodies[i].style("display", "none");
    }
    chippedChartBodies[index].style("display", "block");
}

function toggleChippedChartDropdown() {
    if (chippedSetupsOptions.style("display") == "none")
        chippedSetupsOptions.style("display", "block");
    else
        chippedSetupsOptions.style("display", "none");
}

function toggleChippedDPSDropdown() {
    if (chippedDPSOptions.style("display") == "none") {
        chippedDPSOptions.style("display", "block");
        // get DPS units tested in the setup
        testedDPS = getUniquesInCol(filteredData, "DPS");
        dpsBlocks = [];
        testedDPS.forEach((d) => {
            dpsBlocks.push(chippedDPSOptions.append("a")
                                            .text(d)
                                            .on("click", () => {
                                                showTable(filterDPS(d));
                                            }));
        });
    }
    else
    {
        chippedDPSOptions.style("display", "none");
        dpsBlocks.forEach(d => d.remove());
    }
}

function toggleChiplessChartDropdown() {
    if (chiplessSetupsOptions.style("display") == "none")
        chiplessSetupsOptions.style("display", "block");
    else
        chiplessSetupsOptions.style("display", "none");
}

function toggleChiplessDPSDropdown() {
    if (chiplessDPSOptions.style("display") == "none") {
        chiplessDPSOptions.style("display", "block");
        // get DPS units tested in the setup
        testedDPS = getUniquesInCol(filteredData, "DPS");
        dpsBlocks = [];
        testedDPS.forEach((d) => {
            dpsBlocks.push(chiplessDPSOptions.append("a")
                                            .text(d)
                                            .on("click", () => {
                                                showTable(filterDPS(d));
                                            }));
        });
    }
    else
    {
        chiplessDPSOptions.style("display", "none");
        dpsBlocks.forEach(d => d.remove());
    }
}

function filterData(formation = null, fairy = null, isminspeed = null, hg = null, tank = null, armor = null, dps = null, chip = null) {
    filteredData = csvData;
    if (formation != null)
        filteredData = filteredData.filter(d => d.formation == formation);
    if (fairy != null)
        filteredData = filteredData.filter(d => d.fairy.match(fairy));
    if (hg != null)
        filteredData = filteredData.filter(d => d.has_HG == hg);
    if (tank != null)
        filteredData = filteredData.filter(d => d.tank.match(tank));
    if (armor != null)
        filteredData = filteredData.filter(d => d.has_armor == armor);
    if (dps != null)
        filteredData = filteredData.filter(d => d.DPS.toLowerCase().match(dps));
    if (chip != null)
        filteredData = filteredData.filter(d => d.has_chip == chip);
//DPS is lower cased because of an inconsistency in the data for one of the names starting with a capital letter when all other names are fully lowercase
    if (isminspeed) {
        filteredData = filteredData.filter(d => d.speed == 4);
    }
    else {
        filteredData = filteredData.filter(d => d.speed > 4);
    }
}

function filterDPS(dps) {
    return filteredData.filter(d => d.DPS == dps);
}

function removeTable() {
    table.remove();
}

function showTable(data = filteredData) {
    // delete previous table to update with new filter
    if (table != null)
        table.remove();

    table = d3.select("body").append("table");
    // set up data first then add headers to avoid clunkiness of d3 .data .append when creating a table
    table.selectAll("tr")
        .data(data)
        .enter()
        .append("tr")
        .selectAll("td")
        .data(d => [d.formation, d.fairy, d.speed, d.has_HG, d.tank, d.has_armor, d.DPS, d.has_chip, d.damage, d.perc_damage])
        .enter()
        .append("td")
        .text(d => d);
    // use insert before first tr to create the header
    table.insert("tr", "tr")
        .selectAll("th")
        .data(["Formation", "Fairy", "Speed", "Has_HG", "Tank", "Has_armor", "DPS", "Has_chip", "Damage Taken", "Perc_Damage"])
        .enter()
        .append("th")
        .text(d => d);
}

d3.csv("12-4E_Dragger_Data.csv",
    d => {
        return {
            formation: d.formation,
            fairy: d.fairy,
            speed: +d.speed,
            has_HG: +d.has_HG,
            tank: d.tank,
            has_armor: +d.has_armor,
            DPS: d.DPS,
            has_chip: +d.has_chip,
            damage: +d.damage,
            perc_damage: `${(+d.damage / +d.max_HP * 100).toFixed(2)}%`
        };
    }).then(data => {
        csvData = data;
        filteredData = data; //to cover edge case when using dps dropdown before selecting setups
    });
// info for non-gfl players
{
gflDescriptionToggle = d3.select("body").append("div")
                                        .attr("class", "box")
                                        .attr("id", "gfl toggle")
                                        .on("click", function() {toggleGFLDesc();});
gflDescriptionToggle.text("Explain Game Basics");

gflDescription = d3.select("body").append("div")
                                    .text("Girls Frontline, in the Japanese version it is named Dolls Frontline for copyright reasons, is a mobile turn-based " +
                                    "strategy game where the player fields teams of 5 android \"dolls\" and a supportive drone called a \"fairy\" to move around " +
                                    "a node-based map, capturing territory, engaging in combat, and accomplishing objectives along the way.\n\n" +
                                    "New dolls need to be leveled up to be strong enough to use in end-game content and with the need for multiple teams in such " +
                                    "content, the supply of consumable experience or XP items is not enough to level up the amount of dolls newer players need to " +
                                    "tackle them. This is where earning XP through combat comes in, there is no limit to how often one can enter combat and thus XP " +
                                    "can be \"farmed\" constantly through this if the player is willing to put in the time. A set amount of resources are consumed " +
                                    "each instance of combat which creates a need for optimizing consumption and this is done via what the english speaking community " +
                                    "calls \"corpse dragging\" where we make use of the game mechanics to only \"activate\" one doll to win the combat all by itself. " +
                                    "This doll is referred to as the \"DPS\" and because the enemy will shoot back, a doll dedicated to absorbing the damage for " +
                                    "the rest of the team or \"tank\" is also necessary, the tank does not need to be activated to absorb the damage but it does need " +
                                    "to be placed at the front of the \"formation\" so that it is prioritized by the enemy attacks. The two formations tested are b-" +
                                    "formation which is shaped like a b and 0-2-formation which is the formation used for farming a different map called 0-2. The " +
                                    "difference between them is that the tank is placed further forward which increases the shared range of the team and affects the " +
                                    "overall \"shape\" of the enemy team. The former matters for one of the DPS dolls as they target randomly within range while the " +
                                    "latter matters for all DPS because their primary damage is through an attack that does damage in a circular area so the more " +
                                    "compact shape is preferred.\n\n" +
                                    "The DPS units are chosen because they possess different characteristics which set them apart from each other. Dolls can have " +
                                    "different sets of equipment and those are written next to their names if applicable. VFL increases critical hit rate which " +
                                    "increases damage of normal attacks; EOT increases firepower which affects the damage of all attacks and skills; SPEQ is " +
                                    "shorthand for special equipment which is unique to the doll, in this case the doll \"416\"\'s SPEQ is a hybrid that is mid-way " +
                                    "of both VFL and EOT. The one or two numbers beside the doll\'s name is the level of their skills, non-modded dolls only have " +
                                    "one skill whereas modded dolls have two skills. The tanks are \"M16\" and \"Super Shorty\" where M16 has lower hitpoints or HP, " +
                                    "where HP reaching 0 results in the \"death\" of the doll which can cause the entire combat to fail, but the ability to choose " +
                                    "between armor or exoskeleton equipment, the former reduces the damage taken and the latter increases the chance of \"dodging\" " +
                                    "an attack, nullifying it entirely. Super Shorty can only use armor but has much higher HP and one of the resources we are " +
                                    "optimizing for is \"repair cost\" which is proportional to damage taken so a comparison of tanks is necessary.\n\n" +
                                    "There are ways to enhance or \"buff\" the performance of the DPS and tanks, one of which is the fairy and there are a multitude " +
                                    "of them each with their own set of stat increases to the entire team just by existing, and the other is through the use of " +
                                    "\"HG\" dolls who are an archetype that is capable of increasing the stats of other dolls just by existing, without the need " +
                                    "to activate them. The fairies chosen are \"Rescue\" which can be activated to increase the rate of obtaining a special resource " +
                                    "needed for intermediate steps in the leveling process of dolls; \"Mortar\" which provides the strongest increase to the " +
                                    "firepower stat; \"Armor\" which provides the strongest increase to the armor stat which only matters to M16 with an exoskeleton " +
                                    "as using armor equipment or using Super Shorty provides enough armor that increasing it further has no effect on damage taken; " +
                                    "and \"Beach\" which is representative for \"any low-leveled fairy\" as those have only small stat increases. The star* rating " +
                                    "and text to the left of the fairy name is their \"talent\", dmg and fervor increase the team's firepower stat; armor increases " +
                                    "the armor stat; and cool is purely cosmetic with no buffs. A term that might come up is \"icd\" which stands for initial cooldown" +
                                    ", this is because the special attacks called skills are not available at the start of combat and must wait a certain amount of " +
                                    "seconds to become available to use."
                                    )
                                    .style("display", "none");

gflDescription.append("hr");
}
// introduction text
{
d3.select("body").append("div")                    
                    .html("<b>Disclaimer: The 3.02 update has rendered the value of this analysis obsolete</b> as the tank will be fully repaired " + 
                            "for free as long as the damage taken does not bring them to critical HP at 5% HP left before clearing the map.\n\n" +
                            "12-4e is the best place to efficiently level dolls while getting the cores to link them as of the time of writing this." +
                            " This is meant to visualize how different setups(tiles/fairy aura/equipment) perform against each other. For the low buff" +
                            " setups, this will show how badly the runs will get if you do not meet the recommended fp buffs from other guides\n\n" +
                            "If you have any questions, contact me on discord CosmicArcher#3214\n\n" +
                            "Note: Every setup has its own tab for comparing different DPS in the same setup and at different speeds\n" +
                            "Note2: Jill tiles are 40% fp 40% acc for those that don't know\n" +
                            "Note3: Unless stated in the name of the sheet, the data is before chips became available and I will assume that it is known that " +
                            "chips reduce the effectiveness of VFLs so I will not test those nor repeat why they are not tested\n"
                        );
}
// tabs to swap between displaying data for chipped DPS and non-chip
{
const chipTabs = d3.select("body").append("div")
                                    .attr("class", "tabs")
                                    .attr("id", "chip toggle");
// post-chip update is the default shown because it is the most up-to-date version of the game                                    
chipTabs.append("div")
            .attr("class", "box")
            .text("Post-Chip Update")
            .on("click", function() {
                showChippedData();
            });
chipTabs.append("div")
            .attr("class", "box")
            .text("Pre-Chip Update")
            .on("click", function() {
                showChiplessData();
            });
}
// header of the analysis section
d3.select("body").append("h2")
                    .text("Summary");
// body of chipped data findings
{
chippedBody = d3.select("body").append("div");

var sectionHeader;
var sectionBody;
// M16 equipment
{
sectionHeader = "M16: SPEQ + Armor or T-exo?"
sectionBody = "<b>Armor is always better than T-exo</b> because it gives you enough armor to take only 1 damage from vespids instead of risking taking more damage" +
                " just so you can dodge more.";
addSection(chippedBody, sectionHeader, sectionBody);
}
// formation
{
sectionHeader = "Which formation: b-formation or 0-2-formation?"
sectionBody = "With all the draggers that benefit from chips (416, K11, Uzi since Sop does not have an exo slot to use them), <b>b-formation is found to be better " +
                "than 0-2-formation in all tested cases</b>. Although, a minimal buff scenario (no HG tiles) has not been tested.";
addSection(chippedBody, sectionHeader, sectionBody);
}
// speed
{
sectionHeader = "Echelon Speed: As slow(4 movespeed, bringing MG or caped RF) as possible or as fast (6 for SG or 10 if M16) as possible?"
sectionBody = "For 416 and K11, going at 4 movespeed is better in all scenarios while for Uzi moving at 4 movespeed is better in high-buff setups, with a " +
                "low-buff setup like a 1* fairy and only Jill tiles, moving faster is better.";
addSection(chippedBody, sectionHeader, sectionBody);
}
// uzi mod with chip
{
sectionHeader = "Wait Uzi mod can go at 10 speed/0-2 formation now?"
sectionBody = "Due to the increased FP and capped RoF from chips, Uzi can now deal with the dinergates in the first fight fast enough that there is no " +
                "risk of her targeting an enemy before all dinergates are dead. But if your FP buffs from fairy and tiles are so low that Uzi cannot kill " +
                "a dinergate in 2 hits, you will have to go at 6 movespeed in 0-2 formation at max but due to the conclusion on formation comparison above, " +
                "you do not want to use 0-2 formation with her anyway.";
addSection(chippedBody, sectionHeader, sectionBody);
}
// M16 vs SG
{
sectionHeader = "SG or M16 tank?"
sectionBody = "Based on pre-chip release findings which had less firepower and rate of fire than we do now, M16 with armor tanking is cheaper to repair than " +
                "SGs but <i>keep in mind that there is value to having an SG tank to level her</i> freeing up a slot for another doll to be leveled at the same time.";
addSection(chippedBody, sectionHeader, sectionBody);
}
// uzi skill1
{
sectionHeader = "Uzi skill 1, is sl9 a lot better than sl8?"
sectionBody = "For those unaware, sl9 duration increase pushes it over the threshold that it also gets 1 extra tick of her modskill alongside the regular burn. " +
                "It does seem to be very impactful with an average around 25% less HP lost in lower buff setups which is the important one. Higher buff setups " +
                "like using 5* Rescue fairy has it also performing better but interestingly only to a similar level with 4 speed b-formation, the maximum time " +
                "until targets are in range while other speeds and formations result in it only being a slight performance increase. With 5* Mortar fairy the " +
                "reverse was observed, 4 speed barely saw a performance increase while 10 speed had a massive increase of an average of 50% less HP lost. <b>A key " +
                "point to be aware of is that all of the setups were only done 10-15 times each and most saw a similar range of HP lost in a run compared to the " +
                "sl8 runs so it is possible that the sl9 average is not that much better because of the massive variance of both sets</b>. With more runs to collect " +
                "data on them to iron out the massive variance uzi mod has, (because most of her damage relies on hitting enemies with the molotov while the AR " +
                "draggers are fine cleaning up with regular shots since their accuracy and firepower is much higher than SMGs) we should observe either " +
                "the mean to increase in the end or we see only a slight performance increase and all of the current data was actually just lucky runs (pls no).";
addSection(chippedBody, sectionHeader, sectionBody);
}
}

// body of chipless data findings
{
chiplessBody = d3.select("body").append("div");

var sectionHeader;
var sectionBody;
// M16 equipment
{
sectionHeader = "M16: SPEQ + Armor or T-exo?"
sectionBody = "<b>Armor is always better than T-exo</b> because it gives you enough armor to take only 1 damage from vespids instead of risking taking more damage" +
                " just so you can dodge more.";
addSection(chiplessBody, sectionHeader, sectionBody);
}
// formation
{
sectionHeader = "Which formation: b-formation or 0-2-formation?"
sectionBody = "<li><b>For Chipless 416 mod2 sl10/8, 0-2 formation is only better in low-buff, slow movespeed</b> scenarios since it enables the nade, your main " +
                "damage as low-buffs make bullets take too long killing mobs, to catch as many enemies as possible without taking unnecessary extra damage. When " +
                "b-formation is better, it averages around 30% less HP loss compared to 0-2 but when the reverse is true, it averages 15% less HP lost.</li>\n" +
                "<li><b>For Chipless K11 sl10 with EOT, 0-2 formation is better as long as team movespeed is 4</b>(MG or caped RF in team) regardless of buffs with " +
                "the same logic as above. <b>With VFL, 0-2 formation is only better in low-buff, slow movespeed</b> scenarios with a higher threshold for what counts " +
                "as low buffs than 416's. When b-formation is better, it averages around 20% less HP loss compared to 0-2 but when the reverse is true, it averages " +
                "35% less HP lost but with EOT, it can be as high as 55% less HP lost.</li>\n" +
                "<li><b>For Sopmod3 sl8/8, b-formation is superior</b> in all tested situations with an average of 25% less HP lost because unlike 416 and k11, she " +
                "has an 8s icd so engaging sooner does not increase the amount of mobs that can be affected by her nade.</li>\n" +
                "<li><b>For Chipless Uzimod, due to the dinergates in the 1st fight, she does not want to be in 0-2 formation</b> as it can cause her to ignore 1 of " +
                "the dinergates and attack the mobs in the back due to SMGs' random targeting as opposed to ARs' frontmost targeting which can potentially cause " +
                "hundreds of hp loss to the tank.</li>";
addSection(chiplessBody, sectionHeader, sectionBody);
}
// speed
{
sectionHeader = "Echelon Speed: As slow(4 movespeed, bringing MG or caped RF) as possible or as fast (6 for SG or 10 if M16) as possible?"
sectionBody = "<li><b>For Chipless 416 mod2 sl10/8, being at 4 movespeed is superior in <i>almost</i> all scenarios</b> tested with an average of 20% less HP lost. " +
                "The only tested scenario where being as fast as possible did better was with the <i>M16 exo with a 2* fairy and Jill as the only buffer " +
                "b-formation</i> with 25% less HP lost compared to being slower likely because the main threat with exo m16 are the vespids which you want to hit " +
                "as many of with the nade which moving faster allows for b-formation.</li>\n" +
                "<li><b>For Chipless K11 sl10 with VFL prefers moving faster only in low-buff situations in b-formation</b> since she needs her nade to hit as many " +
                "mobs as possible as low-buffs affect bullet kill speeds. <b>With EOT moving faster is better in all b-formation battles</b> with the same reasoning " +
                "as above. When moving slower is better it averages at 20% less HP lost but when moving faster is better it averages at 25% less HP lost.</li>\n" +
                "<li><b>For Sopmod3 sl8/8, moving slower is superior in all situations</b> with an average of 15% less HP lost with the same possible reasoning as " +
                "with b vs 0-2-formation.</li>\n" +
                "<li><b>For Chipless Uzimod sl8/8</b>, there haven't been much tests with her especially because of the same problem with 0-2 formation, <b>she can " +
                "only go at 7 movespeed at max to avoid that problem. In the situations she was tested in, she performs better at faster speeds for high buffs " +
                "until very low-buff scenarios where slower is better</b> with an average of 15% less HP lost among the 3 scenarios where there was a significant " +
                "enough % difference between the 2 movespeeds (more than 10%).</li>";
addSection(chiplessBody, sectionHeader, sectionBody);
}
// M16 vs SG
{
sectionHeader = "SG or M16 tank?"
sectionBody = "<i>The main data for M16 is with exo</i> on as being able to equip armor is a recent change. The SG used is Super Shorty since she has the highest " +
                "evasion stat of all SGs. <b>To even out the difference in max HPs of the two tanks, combined resource cost (mp + parts x 3) when repairing is " +
                "used for comparison. Compared to M16 with exo, generally M16 still does better except for low-buff and non-ideal formation and movespeed " +
                "combinations with 416 and K11</b> because that lets vespids shoot more which are the main threat to M16 with exo doing more than 1 damage per hit, " +
                "despite sopmod potentially getting M16 into critical from full HP in those low-performance scenarios, <b>ARs being cheaper to repair still made M16 " +
                "better than SGs for sop. Compared to M16 with armor, M16 is cheaper overall</b> since extra armor covers the vespid weakness which makes 416 with " +
                "VFL on 2* beach being the only one that still has a higher repair cost for M16 than with SGs but that is worse than using her with SPEQ anyway.";
addSection(chiplessBody, sectionHeader, sectionBody);
}
// 416 speq vs vfl
{
sectionHeader = "416 chipless mod2 sl10/8: VFL or SPEQ?"
sectionBody = "<b>SPEQ is better in all situations</b> with an average of 20% less HP lost except M16 SPEQ + T-exo w/ 5*dmg1 Rescue fairy 0-2 formation 4 speed with " +
                "15% less HP loss which is likely because the acc buff helps the regular bullets kill surviving vespids better especially because of VFL giving a " +
                "lot of crit chance rather than increasing fp on an already one-shotting grenade.";
addSection(chiplessBody, sectionHeader, sectionBody);
}
// k11 vfl vs eot
{
sectionHeader = "K11 chipless sl10: VFL or EOT?"
sectionBody = "<b>VFL is better in b-formation at 4-speed or 0-2-formation at max speed</b> with an average of 25% less HP lost because bullet damage matters more " + 
                "there. <b>EOT is better in 0-2 formation at 4-speed and b-formation at 6-speed</b> with an average of 20% less HP lost because the enemies will " +
                "all enter in range but not be firing yet by the time she begins to launch her nades which EOT primarily strengthens.";
addSection(chiplessBody, sectionHeader, sectionBody);
}
// sop vfl vs eot
{
sectionHeader = "Sopmod3 sl8/8: SPEQ + VFL/EOT?"
sectionBody = "<b>VFL is better in 0-2 formation</b> likely because the lowered engagement time makes shooting stronger bullets better, except for 5* mortar fairy " +
                "and M16 with armor in low-buff b-formation probably due to increasing modskill damage is not as important as killing mobs with bullets for those " +
                "scenarios. <b>EOT performs better with b-formation</b> because that buys time to wait for the nade icd. When one is significantly better over the " +
                "other, they average at 15% less HP lost for whichever is better in that scenario.";
addSection(chiplessBody, sectionHeader, sectionBody);
}
}

showChippedData();
// divider for next section
d3.select("body").append("hr");
// chipped setups dropdowns
{
    // holder of dropdown buttons
    const chippedDropdownHolder = chippedBody.append("div").style("display", "flex");
    // button to show setup dropdown
    const chippedCharts = chippedDropdownHolder.append("div")
                .attr("class", "box")
                .text("Tested Setups")
                .on("click", function() {
                    toggleChippedChartDropdown();
                });
    chippedCharts.append("i")
                    .attr("class", "fa fa-caret-down");       
    //holder of the setup dropdown options
    {
        chippedSetupsOptions = chippedCharts.append("div").attr("class", "dropdownBox").style("display", "none");
        chippedSetupsOptions.append("a")
                        .text("All setups")
                        .on("click", () => {
                            filterData(null, null, null, null, null, null, null, 1);
                            showTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*dmg1 Rescue Jill b-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*dmg1 Rescue Jill b-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.RESCUE, 0, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*fervor mortar Jill b-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.MORTAR, 1, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*fervor mortar Jill b-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.MORTAR, 0, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*dmg1 rescue Jill 0-2-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_02, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*dmg1 rescue Jill 0-2-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_02, Fairies.RESCUE, 0, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });  
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 1*cool lv100beach Jill b-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 1*cool lv100beach Jill b-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.BEACH, 0, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 1*cool lv100beach Jill 0-2-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_02, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 1*cool lv100beach Jill 0-2-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_02, Fairies.BEACH, 0, 1, Tanks.M16, 1, null, 1);
                            showTable();
                        });
    }         
    // button to show dps dropdown     
    const chippedDPS = chippedDropdownHolder.append("div")
                .attr("class", "box")
                .style("float", "right")
                .text("Tested DPS")
                .on("click", function() {
                    toggleChippedDPSDropdown();
                });
    chippedDPS.append("i")
                    .attr("class", "fa fa-caret-down");
    chippedDPSOptions = chippedDPS.append("div").attr("class", "dropdownBox").style("display", "none");     
}

// chipless setups dropdowns
{
    // holder of dropdown buttons
    const chiplessDropdownHolder = chiplessBody.append("div").style("display", "flex");
    // button to show setup dropdown
    const chiplessCharts = chiplessDropdownHolder.append("div")
                                                    .attr("class", "box")
                                                    .text("Tested Setups")
                                                    .on("click", function() {
                                                        toggleChiplessChartDropdown();
                                                    });
    chiplessCharts.append("i")
                    .attr("class", "fa fa-caret-down");       
    //holder of the setup dropdown options
    {
        chiplessSetupsOptions = chiplessCharts.append("div").attr("class", "dropdownBox").style("display", "none");
        chiplessSetupsOptions.append("a")
                                .text("All setups")
                                .on("click", () => {
                                    filterData(null, null, null, null, null, null, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*dmg1 Rescue Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*armor2 armor Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.ARMOR, 1, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*fervor mortar Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.MORTAR, 1, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*dmg1 rescue Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.RESCUE, 1, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*armor2 armor Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.ARMOR, 1, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*fervor mortar Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.MORTAR, 1, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*dmg1 Rescue Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*fervor mortar Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.MORTAR, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*dmg1 rescue Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.RESCUE, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*fervor mortar Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.MORTAR, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 2*dmg2 lv31 beach Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv31 beach Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 2*dmg2 lv60 beach Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 1, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv60 beach Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv78 beach only 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 1, 0, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv78 beach only b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 1, 0, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*dmg1 Rescue Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 0, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv84 beach Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*dmg1 rescue Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.RESCUE, 0, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*dmg1 Rescue Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*dmg1 rescue Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.RESCUE, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv89 beach Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*fervor mortar Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.MORTAR, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*fervor mortar Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.MORTAR, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 2*dmg2 lv95 beach Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 0, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 2*dmg2 lv99 beach Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 0, 1, Tanks.M16, 0, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv100 beach only b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 0, 0, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv100 beach only 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 0, 0, Tanks.SUPERSHORTY, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Armor 5*dmg1 Rescue Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 0);
                                    showTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Armor 1*cool lv100 beach Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 0);
                                    showTable();
                                });
    }         
    // button to show dps dropdown     
    const chiplessDPS = chiplessDropdownHolder.append("div")
                .attr("class", "box")
                .style("float", "right")
                .text("Tested DPS")
                .on("click", function() {
                    toggleChiplessDPSDropdown();
                });
    chiplessDPS.append("i")
                    .attr("class", "fa fa-caret-down");
    chiplessDPSOptions = chiplessDPS.append("div").attr("class", "dropdownBox").style("display", "none");     
}