import Random from "./Random.js";
import PermutationTester, { TestModes } from "./PermutationTester.js";

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

const Comparison = {
    Exo_Armor : "Exo_Armor",
    Formation : "Formation",
    Speed : "Speed",
    Tank : "Tank",
    Equip : "Equip",
    Uzi : "Uzi"
}

var csvData;
var tableHolder;
var dataTable;
var tableTitle;
var filteredData;

const repairHeaders = ["Setup", "MP_Cost", "Part_Cost", "Total_Rsc"];
var repairToggle;
var repairTable;
var repairTableBody;
var chippedRepairBody;
var chiplessRepairBody;
var chippedRepairData = [];
var chiplessRepairData = [];

var gflDescriptionToggle;
var gflDescription;

var chippedBody;
var chiplessBody;

var chippedSetupsOptions;
var chiplessSetupsOptions;
var DPSOptions;

var chippedComparisonOptions;
var chiplessComparisonOptions;

var setupBoxplot;

var maxChipPerc;
var maxChiplessPerc;

const numPermutations = 10000;

var pTableBody;

function getUniquesInCol(json, colKey) {
    var res = [];

    json.forEach(d => res.push(d[colKey]));
    
    return res.filter((d, i, a) => a.indexOf(d) == i);
}

function getIQRQuartile123(array) {
    // return q1 - 1.5 iqr, q1, q2, q3, q3 + 1.5 iqr
    var res = [0,0,0,0,0];
    res[1] = d3.quantile(array, 0.25);
    res[2] = d3.quantile(array, 0.5);
    res[3] = d3.quantile(array, 0.75);
    // get boundaries before a point is considered an outlier
    var iqr = res[3] - res[1];
    res[0] = Math.max(res[1] - 1.5 * iqr, d3.min(array));
    res[4] = Math.min(res[3] + 1.5 * iqr, d3.max(array));

    return res;
}   

function getMaxDamage() {
    var percData = [];
    var flatData = [];
    // chipped perc
    csvData.filter(d => d.has_chip)
            .forEach(d => {
                percData.push(Number(d.perc_damage.slice(0, d.perc_damage.length - 1)));
            });
    // round the max to give margin for charts
    maxChipPerc = Math.ceil(d3.max(percData));
    // chipless perc
    percData.length = 0;
    csvData.filter(d => !d.has_chip)
            .forEach(d => {
                percData.push(Number(d.perc_damage.slice(0, d.perc_damage.length - 1)));
            });
    // round the max to give margin for charts
    maxChiplessPerc = Math.ceil(d3.max(percData));
}

function toggleGFLDesc() {
    // change text and box color depending on toggle state for clarity on current toggle state
    if (gflDescription.style("display") == "block") {
        gflDescriptionToggle.text("Explain Game Basics");
        d3.select("#gfltoggle").style("background-color", "lightgray")
        gflDescription.style("display", "none");
    }
    else {
        gflDescriptionToggle.text("Hide Game Basics");
        d3.select("#gfltoggle").style("background-color", "darkgray");
        gflDescription.style("display", "block");
    }
}

function toggleRepairTable() {
    if (repairTableBody.style("display") == "block") {
        repairTableBody.style("display", "none");
        repairToggle.text("Show Repair Costs");
        repairToggle.style("background-color", "lightgray");
    }
    else {
        repairTableBody.style("display", "block");
        repairToggle.text("Hide Repair Costs");
        repairToggle.style("background-color", "darkgray");
    }
}

function showChippedData() {
    // swap which html body is displayed
    chippedBody.style("display", "block");
    chiplessBody.style("display", "none");
    // darken box color of currently selected tab
    d3.select("#postChip").style("background-color", "darkgray");
    d3.select("#preChip").style("background-color", "lightgray");
    // switch displayed repair costs table
    chippedRepairBody.style("display", "block");
    chiplessRepairBody.style("display", "none");
    // remove table when changing between chipped and chipless sections
    if (dataTable != null) 
        removeCSVTable();
    // in case the chipless dropdowns are still displayed when switching tabs, hide them
    if (chiplessSetupsOptions.style("display") == "block")
            chiplessSetupsOptions.style("display", "none");
    if (DPSOptions.style("display") == "block") {
        DPSOptions.style("display", "none");
        // there is no guarantee that the next setup has the same set of DPS units so we clear and recreate the list each time
        // I am aware that I can use object pooling to be more resource efficient but I'm too lazy to do it properly
        DPSOptions.selectAll("*").remove();
    }
}

function showChiplessData() {
    // swap which html body is displayed
    chippedBody.style("display", "none");
    chiplessBody.style("display", "block");
    // darken box color of currently selected tab
    d3.select("#postChip").style("background-color", "lightgray");
    d3.select("#preChip").style("background-color", "darkgray");
    // switch displayed repair costs table
    chippedRepairBody.style("display", "none");
    chiplessRepairBody.style("display", "block");
    // remove table when changing between chipped and chipless sections
    if (dataTable != null)
        removeCSVTable();
    // in case the chipless dropdowns are still displayed when switching tabs, hide them
    if (chippedSetupsOptions.style("display") == "block")
            chippedSetupsOptions.style("display", "none");
    if (DPSOptions.style("display") == "block") {
        DPSOptions.style("display", "none");
        // there is no guarantee that the next setup has the same set of DPS units so we clear and recreate the list each time
        // I am aware that I can use object pooling to be more resource efficient but I'm too lazy to do it properly
        DPSOptions.selectAll("*").remove();
    }
}
// add a section of text, header and body, to the specified html element body
function addSection(body, headerText, bodyText) {
    body.append("h3")
            .html(headerText);
    body.append("div")
            .html(bodyText);
}

function toggleChartDropdown() {
    // if dps dropdown is open, close it first
    if (DPSOptions.style("display") == "block")
        toggleDPSDropdown();
    // check if chip or chipless data is selected and show the dropdown options that correspond to it
    if (chippedBody.style("display") == "block") {
        if (chippedSetupsOptions.style("display") == "none")
            chippedSetupsOptions.style("display", "block");
        else
            chippedSetupsOptions.style("display", "none");
    }
    else {
        if (chiplessSetupsOptions.style("display") == "none")
            chiplessSetupsOptions.style("display", "block");
        else
            chiplessSetupsOptions.style("display", "none");
    }
}

function toggleDPSDropdown() {
    // if other dropdown is open, close it
    if (chippedSetupsOptions.style("display") == "block")
        chippedSetupsOptions.style("display", "none");
    if (chiplessSetupsOptions.style("display") == "block")
        chiplessSetupsOptions.style("display", "none");
    
    if (DPSOptions.style("display") == "none") {
        DPSOptions.style("display", "block");
        // get DPS units tested in the selected setup
        var testedDPS = getUniquesInCol(filteredData, "DPS");
        // for the case where all chips setup has some uzi entries with capital letters while the rest are all lowercase
        testedDPS.forEach((d, i) => testedDPS[i] = d.toLowerCase());
        testedDPS = testedDPS.filter((d, i, a) => a.indexOf(d) == i);
        //push to array for ease of removal
        testedDPS.forEach((d) => { 
            DPSOptions.append("a")
                        .text(d)
                        .on("click", () => {
                            showCSVTable(filterDPS(d));
                        });
        });
    }
    else
    {
        DPSOptions.style("display", "none");
        // there is no guarantee that the next setup has the same set of DPS units so we clear and recreate the list each time
        // I am aware that I can use object pooling to be more resource efficient but I'm too lazy to do it properly
        DPSOptions.selectAll("*").remove();
    }
}

function toggleComparisonDropdown() {
    // if dps dropdown is open, close it first
    if (DPSOptions.style("display") == "block")
        toggleDPSDropdown();
    // if setup chart dropdown is open, close it
    if (chippedSetupsOptions.style("display") == "block")
        chippedSetupsOptions.style("display", "none");
    if (chiplessSetupsOptions.style("display") == "block")
        chiplessSetupsOptions.style("display", "none");

    // check if chip or chipless data is selected and show the dropdown options that correspond to it
    if (chippedBody.style("display") == "block") {
        if (chippedComparisonOptions.style("display") == "none")
            chippedComparisonOptions.style("display", "block");
        else
            chippedComparisonOptions.style("display", "none");
    }
    else {
        if (chiplessComparisonOptions.style("display") == "none")
            chiplessComparisonOptions.style("display", "block");
        else
            chiplessComparisonOptions.style("display", "none");
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
    //DPS is lower cased because of an inconsistency in the data for one of the names starting with a capital letter when all other names are fully lowercase
    if (dps != null)
        filteredData = filteredData.filter(d => d.DPS.toLowerCase().match(dps));
    if (chip != null)
        filteredData = filteredData.filter(d => d.has_chip == chip);
    if (isminspeed) {
        filteredData = filteredData.filter(d => d.speed == 4);
    }
    else {
        filteredData = filteredData.filter(d => d.speed > 4);
    }
}

function filterDPS(dps) {
    return filteredData.filter(d => d.DPS.toLowerCase() == dps);
}

function getDPSData(data = filteredData) {
    var dpsList = getUniquesInCol(data, "DPS");
    // store damage data in a 2d array
    var dpsData = [];
    dpsList.forEach((d, i) => {
        //create 2 columns per dps, one for damage taken, the other for perc_damage
        dpsData.push([]);
        dpsData.push([]);

        var dpsDamage = data.filter(datum => datum.DPS == d);
        dpsDamage.forEach(datum => {
            // because each dps has 2 columns, the indices of the next one is in intervals of 2
            dpsData[i * 2].push(datum.damage);
            dpsData[i * 2 + 1].push(datum.perc_damage);
        });
    });
    return dpsData;
}

function insertSetupRepairsJSON(json, setupText, data = filteredData) {
    var dpsData;
    var dpsList;
    // get the average repair costs of each dps
    dpsList = getUniquesInCol(data, "DPS");
    dpsData = getDPSData(data);
    // get perc_damage and turn into float from string and calculate average
    var percAverage = [];
    for (var i = 1; i < dpsData.length; i += 2) {
        var colSum = 0;
        dpsData[i].forEach(d => colSum += Number(d.slice(0, d.length - 1)));
        percAverage.push(colSum / dpsData[i].length);
    }
    // assemble the json
    dpsList.forEach((d, i) => {
        var newObj = {};
        newObj["Setup"] = setupText + " " + d;
        // repair cost differs between AR (M16) and SGs (Super Shorty)
        if (data[0].tank == "M16") {
            newObj["MP_Cost"] = (percAverage[i] * 0.3 * 4).toFixed(2);
            newObj["Part_Cost"] = (percAverage[i] * 0.3 * 1.4).toFixed(2);
            // weigh parts as 3 times that of manpower in line with natural regeneration
            newObj["Total_Rsc"] = (percAverage[i] * 0.3 * 8.2).toFixed(2);
        }
        else {
            newObj["MP_Cost"] = (percAverage[i] * 0.3 * 6.5).toFixed(2);
            newObj["Part_Cost"] = (percAverage[i] * 0.3 * 3.2).toFixed(2);
            // weigh parts as 3 times that of manpower in line with natural regeneration
            newObj["Total_Rsc"] = (percAverage[i] * 0.3 * 16.1).toFixed(2);
        }
        json.push(newObj);
    });
}

function getChippedRepairs() {
    var setup;
    // since each setup will repeat the steps and there are more than 30 setups, put it all into a function to save space
    {
        setup = "Chipped DPS m16 5*dmg1 Rescue Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);

        setup = "Chipped DPS m16 5*dmg1 Rescue Jill b-formation max speed";
        filterData(Formations.Formation_b, Fairies.RESCUE, 0, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);

        setup = "Chipped DPS m16 5*fervor mortar Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.MORTAR, 1, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);

        setup = "Chipped DPS m16 5*fervor mortar Jill b-formation max speed";
        filterData(Formations.Formation_b, Fairies.MORTAR, 0, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);

        setup = "Chipped DPS m16 5*dmg1 rescue Jill 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);

        setup = "Chipped DPS m16 5*dmg1 rescue Jill 0-2-formation max speed";
        filterData(Formations.Formation_02, Fairies.RESCUE, 0, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);

        setup = "Chipped DPS m16 1*cool lv100beach Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);

        setup = "Chipped DPS m16 1*cool lv100beach Jill b-formation max speed";
        filterData(Formations.Formation_b, Fairies.BEACH, 0, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);

        setup = "Chipped DPS m16 1*cool lv100beach Jill 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);

        setup = "Chipped DPS m16 1*cool lv100beach Jill 0-2-formation max speed";
        filterData(Formations.Formation_02, Fairies.BEACH, 0, 1, Tanks.M16, 1, null, 1);
        insertSetupRepairsJSON(chippedRepairData, setup, filteredData);
    }    
}

function getChiplessRepairs() {
    var setup;
    {
        setup = "M16 SPEQ+Exo 5*dmg1 Rescue Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 5*armor2 armor Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.ARMOR, 1, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 5*fervor mortar Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.MORTAR, 1, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 5*dmg1 rescue Jill 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.RESCUE, 1, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 5*armor2 armor Jill 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.ARMOR, 1, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 5*fervor mortar Jill 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.MORTAR, 1, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 5*dmg1 Rescue Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 5*fervor mortar Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.MORTAR, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 5*dmg1 rescue Jill 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.RESCUE, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 5*fervor mortar Jill 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.MORTAR, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 2*dmg2 lv31 beach Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);
 
        setup = "Shorty 2*dmg2 lv31 beach Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 2*dmg2 lv60 beach Jill 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.BEACH, 1, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 2*dmg2 lv60 beach Jill 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.BEACH, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 2*dmg2 lv78 beach only 0-2-formation min speed";
        filterData(Formations.Formation_02, Fairies.BEACH, 1, 0, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 2*dmg2 lv78 beach only b-formation min speed";
        filterData(Formations.Formation_b, Fairies.BEACH, 1, 0, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 5*dmg1 Rescue Jill b-formation max speed";
        filterData(Formations.Formation_b, Fairies.RESCUE, 0, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 2*dmg2 lv84 beach Jill b-formation max speed";
        filterData(Formations.Formation_b, Fairies.BEACH, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 5*dmg1 rescue Jill 0-2-formation max speed";
        filterData(Formations.Formation_02, Fairies.RESCUE, 0, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 5*dmg1 Rescue Jill b-formation max speed";
        filterData(Formations.Formation_b, Fairies.RESCUE, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 5*dmg1 rescue Jill 0-2-formation max speed";
        filterData(Formations.Formation_02, Fairies.RESCUE, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 2*dmg2 lv89 beach Jill 0-2-formation max speed";
        filterData(Formations.Formation_02, Fairies.BEACH, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 5*fervor mortar Jill 0-2-formation max speed";
        filterData(Formations.Formation_02, Fairies.MORTAR, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 5*fervor mortar Jill b-formation max speed";
        filterData(Formations.Formation_b, Fairies.MORTAR, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 2*dmg2 lv95 beach Jill b-formation max speed";
        filterData(Formations.Formation_b, Fairies.BEACH, 0, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Exo 2*dmg2 lv99 beach Jill 0-2-formation max speed";
        filterData(Formations.Formation_02, Fairies.BEACH, 0, 1, Tanks.M16, 0, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 2*dmg2 lv100 beach only b-formation max speed";
        filterData(Formations.Formation_b, Fairies.BEACH, 0, 0, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "Shorty 2*dmg2 lv100 beach only 0-2-formation max speed";
        filterData(Formations.Formation_02, Fairies.BEACH, 0, 0, Tanks.SUPERSHORTY, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Armor 5*dmg1 Rescue Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);

        setup = "M16 SPEQ+Armor 1*cool lv100 beach Jill b-formation min speed";
        filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 0);
        insertSetupRepairsJSON(chiplessRepairData, setup, filteredData);
    }
}

function widenSetupData(htmlBody, data = filteredData) {
    var dpsList = getUniquesInCol(data, "DPS");
    
    var dpsData = getDPSData(data);
    // get the largest amount of rows a single dps needs so that the other dps will have empty entries at the end to equalize their rows
    var largestSample = 0;
    for (var i = 0; i < dpsData.length; i += 2) {
        if (dpsData[i].length > largestSample)
            largestSample = dpsData[i].length;
    }
    // store the data in a json
    var wideData = [];
    // establish the json per row
    for (var i = 0; i < largestSample; i++) {
        var newObj = {};
        dpsList.forEach((d, index) => {
            // if there is still data for that dps before reaching the last row
            if (i < dpsData[index * 2].length) {
                newObj[d + " damage"] = dpsData[index * 2][i];
                newObj[d + " perc"] = dpsData[index * 2 + 1][i];
            }
            // if this dps has less samples than the dps with the most, leave empty entries for the rest of its data
            else {
                newObj[d + " damage"] = "";
                newObj[d + " perc"] = "";
            }
        });
        wideData.push(newObj);
    }
    var keys = Object.keys(wideData[0]);
    // arrange header array to have flat damage on the left and perc_damage on the right which would also arrange the data accordingly
    var headers = [];
    for (var i = 0; i < dpsList.length; i++)
        headers.push(keys[i * 2]);
    for (var i = 0; i < dpsList.length; i++)
        headers.push(keys[i * 2 + 1]);

    createTable(htmlBody, headers, wideData);
}

function createDPSHistogram(data = filteredData) {
    var dpsData = getDPSData(data);
    // get damage taken and turn into float from string
    var damageData = [];
    dpsData[0].forEach(d => damageData.push(+d));
    // container for the histogram
    var svg = setupBoxplot.append("svg")
                            .attr("width", "100%")
                            .attr("height", 500)
                            .style("background-color", "white")
                            .append("g")
                            .attr("transform", "translate(30, 50)");
    // set the x axis limit
    var x = d3.scaleLinear()
                .domain([0, Math.ceil((d3.max(damageData) + 5) / 10) * 10]) // add margin for x limit
                .range([0, document.documentElement.clientWidth - 100]);
    // set the x-axis labels on the bottom of the chart
    svg.append("g")
        .attr("transform", "translate(0, 420)")
        .call(d3.axisBottom(x));
    // set y-axis as bottom-up
    var y = d3.scaleLinear()
                .range([420, 0]);
    var yAxis = svg.append("g");
    // initialize histogram
    var histogram = d3.histogram()
                        .value(d => d)
                        .domain(x.domain())
                        .thresholds(x.ticks(8));
    var bins = histogram(damageData);
    // create the y-axis
    y.domain([0, d3.max(bins, d => d.length)]);
    yAxis.call(d3.axisLeft(y).ticks(d3.max(bins, d => d.length)));
    // create a bar per histogram bin
    svg.selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("transform", d => `translate(${x(d.x0)}, ${y(d.length)})`)
        .attr("width", d => Math.max(x(d.x1) - x(d.x0) - 1, 0))
        .attr("height", d => 420 - y(d.length))
        .style("fill", "lightblue");
    // create title
    svg.append("text")
        .text("Histogram of flat damage taken")
        .attr("font-size", "25px")
        .attr("text-anchor", "middle")
        .attr("x", document.documentElement.clientWidth / 2)
        .attr("y", -25);
}

function createSetupBoxAndWhisker(data = filteredData) {
    var dpsList = getUniquesInCol(data, "DPS");
    
    var dpsData = getDPSData(data);
    // get perc_damage and turn into float from string
    var percData = [];
    for (var i = 1; i < dpsData.length; i += 2) {
        var colData = [];
        dpsData[i].forEach(d => colData.push(Number(d.slice(0, d.length - 1))));
        percData.push(colData);
    }
    // get information needed for box and whisker and place into a json
    var boxJSON = [];
    dpsList.forEach((d, i) => {
        var newObj = {};
        newObj["x"] = d;
        // get critical points for box and whisker, using perc_damage
        var thresholds = getIQRQuartile123(percData[i]);
        newObj["low"] = thresholds[0];
        newObj["q1"] = thresholds[1];
        newObj["median"] = thresholds[2];
        newObj["q3"] = thresholds[3];
        newObj["high"] = thresholds[4];
        // get outliers in the data
        newObj["outliers"] = []
        percData[i].forEach(d => {
            if (d > thresholds[4] || d < thresholds[0])
                newObj["outliers"].push(d);
        });

        boxJSON.push(newObj);
    });

    var chart = anychart.box();
    var series = chart.box(boxJSON);   
    // ugly fix to prevent the chart from being stuck at 100px
    var stage = anychart.graphics.create("container", "100%", 500);
    // chart settings
    chart.title("Box and Whisker of Percentage of Max HP Damage Taken");
    chart.container(stage);
    chart.yGrid().enabled(true);
    if (data[0].has_chip)
        chart.yScale().maximum(maxChipPerc);
    else
        chart.yScale().maximum(maxChiplessPerc);
    // settings per box
    series.normal().medianStroke("red", 1, "20 10", "round");
    series.hovered().medianStroke("red", 1, "20 5", "round");
    series.selected().medianStroke("red", 1, "20 5", "round");
    series.whiskerWidth(50);

    chart.draw();
}

function createTable(htmlBody, tableHeaders, tableData, hasPVal = false, twoSided = false, pVal = 0.05) {
    // set up data first then add headers to avoid clunkiness of d3 .data .append when creating a table
    htmlBody.selectAll("tr")
        .data(tableData)
        .enter()
        .append("tr")
        .selectAll("td")
        .data(datum => {
            var res = [];
            tableHeaders.forEach(d => res.push(datum[d]));
            //[d.formation, d.fairy, d.speed, d.has_HG, d.tank, d.has_armor, d.DPS, d.has_chip, d.damage, d.perc_damage]
            return res;
        })
        .enter()
        .append("td")
        .text(d => d)
        .style("background-color", d => {
            if (hasPVal) {
                if (d <= pVal)
                    return "green";
                if (twoSided && d >= 1 - pVal)
                    return "aqua";
            }
            return "";
        });
    // use insert before first tr to create the header
    htmlBody.insert("tr", "tr")
        .selectAll("th")
        .data(tableHeaders)
        .enter()
        .append("th")
        .text(d => d);
}

function removeCSVTable() {
    tableTitle.remove();
    setupBoxplot.remove();
    dataTable.remove();
}

function showCSVTable(data = filteredData) {
    // delete previous table to update with new filter
    if (dataTable != null)
        removeCSVTable();
    // title of table
    {
        // assemble the string using the filtered data, all columns except DPS, damage, perc_damage have a single value if a setup is selected
        // if a DPS is also selected then the DPS column will also only have a single value
        var title = "";
        // table is guaranteed to only have a single value when displayed regardless of selected setup
        if (data[0].has_chip)
            title += "Chipped ";
        else
            title += "Chipless ";
        // check if a dps is selected or not and write down the name or blank if no dps was selected
        var uniques = getUniquesInCol(data, "DPS");
        if (uniques.length == 1)
            title += uniques[0] + " ";
        title += "DPS ";
        // check if "all setups" has been selected or not by seeing if both formations are in the filtered dataset
        if (getUniquesInCol(data, "formation").length > 1) {
            title += "All Setups ";
        }
        else {
            title += data[0].tank + " ";
            // if M16 is the tank, write down her equipment
            if (data[0].tank == "M16") {
                title += "SPEQ + ";
                if (data[0].has_armor) 
                    title += "Armor ";
                else
                    title += "T-Exo ";
            } 

            title += data[0].fairy + " ";
            
            if (data[0].formation == "b-formation")
                title += "b-formation ";
            else
                title += "0-2 formation ";
            // check if speed in setup is as low as possible or as high as possible
            if (data[0].speed == 4)
                title += "min speed ";
            else
                title += "max speed ";
        }

        title += "data";

        tableTitle = tableHolder.append("h2")
                                        .text(title);
    }

    setupBoxplot = tableHolder.append("div")
                                    .attr("id", "container");
    // table of damage taken and perc_damage with the setups
    dataTable = tableHolder.append("table");
    // make different tables depending on whether it is all setups or not
    if (getUniquesInCol(data, "formation").length > 1 || getUniquesInCol(data, "fairy").length > 1 || getUniquesInCol(data, "speed").length > 1 ||
        getUniquesInCol(data, "has_HG").length > 1 || getUniquesInCol(data, "tank").length > 1 || getUniquesInCol(data, "tank").length > 1 ||
        getUniquesInCol(data, "has_armor").length > 1) {
        var headers = ["formation", "fairy", "speed", "has_HG", "tank", "has_armor", "DPS", "damage", "perc_damage"];
        createTable(dataTable, headers, data);
    }
    else {
        // create box and whisker of perc_damage taken if multiple dps is selected otherwise show histogram of flat damage taken
        if (getUniquesInCol(data, "DPS").length > 1)
            createSetupBoxAndWhisker(data);
        else
            createDPSHistogram(data);
        widenSetupData(dataTable, data);
    }
}

function compareSetupDPS(data1, dpsList1, data2, dpsList2, testMode = TestModes.MEAN) {
    // set the seed to make the results reproducible
    Random.setSeed(12345);
    // get only the dps that both datasets share for a fair comparison
    let sharedDPS = [];
    for (let i = 0; i < dpsList1.length; i++)  {
        let isShared = false;
        for (let j = 0; j < dpsList2.length && !isShared; j++) {
            if (dpsList1[i] == dpsList2[j]) {
                sharedDPS.push(dpsList1[i]);
                isShared = true;
            }
        }
    }

    let pValues = {};
    for (let i = 0; i < sharedDPS.length; i++) {
        let dmgArray1 = data1[dpsList1.indexOf(sharedDPS[i]) * 2];
        let dmgArray2 = data2[dpsList2.indexOf(sharedDPS[i]) * 2];
        // get the left-side p-values of non KS test
        pValues[sharedDPS[i]] = PermutationTester.getInstance().performTest(dmgArray1, dmgArray2, testMode, numPermutations, testMode != TestModes.KSTEST);
    }

    return pValues;
}

function compareSpecificDPS(data1, data2, testMode = TestModes.MEAN) {
    // set the seed to make the results reproducible
    Random.setSeed(12345);
    // get the left-side p-values of non KS test
    return PermutationTester.getInstance().performTest(data1, data2, testMode, numPermutations, testMode != TestModes.KSTEST);
}

function createComparisonSection(compare = Comparison.Exo_Armor) {
    // comparison will only be with chipped or chipless data depending on which one is currently displayed
    let chipFiltered;
    let chipText;
    if (chippedBody.style("display") == "block") {
        chipFiltered = csvData.filter(d => d.has_chip);
        chipText = "Chipped DPS ";
    }
    else {
        chipFiltered = csvData.filter(d => !d.has_chip);
        chipText = "Chipless DPS ";
    }
    
    let res = {};
    switch (compare) {
        case Comparison.Exo_Armor:
            filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 0, null, 0);
            let testedDPS1 = getUniquesInCol(filteredData, "DPS");
            let data1 = getDPSData();
            filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 0);
            let testedDPS2 = getUniquesInCol(filteredData, "DPS");
            let data2 = getDPSData();
            
            // for the case where all chips setup has some uzi entries with capital letters while the rest are all lowercase
            testedDPS1.forEach((d, i) => testedDPS1[i] = d.toLowerCase());
            testedDPS1 = testedDPS1.filter((d, i, a) => a.indexOf(d) == i);
            // for the case where all chips setup has some uzi entries with capital letters while the rest are all lowercase
            testedDPS2.forEach((d, i) => testedDPS2[i] = d.toLowerCase());
            testedDPS2 = testedDPS2.filter((d, i, a) => a.indexOf(d) == i);

            res["chipless b-Formation Rescue min speed"] = {};
            res["chipless b-Formation Rescue min speed"][TestModes.MEAN] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TestModes.MEAN);
            res["chipless b-Formation Rescue min speed"][TestModes.STDDEV] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TestModes.STDDEV);
            res["chipless b-Formation Rescue min speed"][TestModes.KSTEST] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TestModes.KSTEST);
            console.log(Object.values(res["chipless b-Formation Rescue min speed"]));

            filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 0, null, 0);
            testedDPS1 = getUniquesInCol(filteredData, "DPS");
            data1 = getDPSData();
            filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 0);
            testedDPS2 = getUniquesInCol(filteredData, "DPS");
            data2 = getDPSData();
            
            // for the case where all chips setup has some uzi entries with capital letters while the rest are all lowercase
            testedDPS1.forEach((d, i) => testedDPS1[i] = d.toLowerCase());
            testedDPS1 = testedDPS1.filter((d, i, a) => a.indexOf(d) == i);
            // for the case where all chips setup has some uzi entries with capital letters while the rest are all lowercase
            testedDPS2.forEach((d, i) => testedDPS2[i] = d.toLowerCase());
            testedDPS2 = testedDPS2.filter((d, i, a) => a.indexOf(d) == i);

            res["chipless b-Formation Beach min speed"] = {};
            res["chipless b-Formation Beach min speed"][TestModes.MEAN] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TestModes.MEAN);
            res["chipless b-Formation Beach min speed"][TestModes.STDDEV] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TestModes.STDDEV);
            res["chipless b-Formation Beach min speed"][TestModes.KSTEST] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TestModes.KSTEST);
            console.log(Object.values(res["chipless b-Formation Beach min speed"]));

            createPTable(res, 0.05);
            break;
        case Comparison.Formation:
            // iterate through all setups by going through all combinations of filtering the data outside of the variable of interest where they will be separated
            // into different datasets and DPS as that will be handled later
            let bFormation = chipFiltered.filter(d => d.formation == Formations.Formation_b);
            let zerotwo = chipFiltered.filter(d => d.formation == Formations.Formation_02);
            // slowly create the setup name as we go through each possible filter
            Object.values(Fairies).forEach(fairy => {
                let fairyFilteredb = bFormation.filter(d => d.fairy.match(fairy));
                let fairyFiltered02 = zerotwo.filter(d => d.fairy.match(fairy));
                let fairyText = fairy + " ";
                // only continue if both filtered datasets have remaining rows
                if (fairyFilteredb.length > 0 && fairyFiltered02.length > 0) {
                    // filter speed next
                    for (let i = 0; i < 2; i++) {
                        let ibool = i ? true : false;
                        let speedFilteredb = fairyFilteredb.filter(d => (d.speed == 4) != ibool);
                        let speedFiltered02 = fairyFiltered02.filter(d => (d.speed == 4) != ibool);
                        let speedText = ibool ? "max speed " : "min speed ";
                        // filter hg presence next
                        if (speedFilteredb.length > 0 && speedFiltered02.length > 0) {
                            for (let j = 0; j < 2; j++) {
                                let jbool = j ? true : false;
                                let hgFilteredb = speedFilteredb.filter(d => d.has_HG == jbool);
                                let hgFiltered02 = speedFiltered02.filter(d => d.has_HG == jbool);
                                let hgText = jbool ? "Jill " : "only ";
                                if (hgFilteredb.length > 0 && hgFiltered02.length > 0) {
                                    Object.values(Tanks).forEach(tank => {
                                        let tankFilteredb = hgFilteredb.filter(d => d.tank.match(tank));
                                        let tankFiltered02 = hgFiltered02.filter(d => d.tank.match(tank));
                                        let tankText = tank + " ";
                                        // filter armor next
                                        if (tankFilteredb.length > 0 && tankFiltered02.length > 0) {
                                            for (let k = 0; k < 2; k++) {
                                                let kbool = k ? true : false;
                                                let armorFilteredb = tankFilteredb.filter(d => d.has_armor == kbool);
                                                let armorFiltered02 = tankFiltered02.filter(d => d.has_armor == kbool);
                                                let armorText = "";
                                                if (tank == Tanks.M16) {
                                                    armorText = kbool ? "SPEQ+Armor " : "SPEQ+T-Exo ";
                                                }
                                                if (armorFilteredb.length > 0 && armorFiltered02.length > 0) {
                                                    let bDPS = getUniquesInCol(armorFilteredb, "DPS");
                                                    let zerotwoDPS = getUniquesInCol(armorFiltered02, "DPS");
                                                    let bData = getDPSData(armorFilteredb);
                                                    let zerotwoData = getDPSData(armorFiltered02);
                                                    bDPS.forEach((d, index) => bDPS[index] = d.toLowerCase());
                                                    bDPS = bDPS.filter((d, index, a) => a.indexOf(d) == index);
                                                    zerotwoDPS.forEach((d, index) => zerotwoDPS[index] = d.toLowerCase());
                                                    zerotwoDPS = zerotwoDPS.filter((d, index, a) => a.indexOf(d) == index); 
                                                    // assemble the text given to the setup name for the table
                                                    let finalText = chipText + tankText + armorText + fairyText + hgText + speedText;
                                                    res[finalText] = {};
                                                    // get the p-values of the setup for each dps and for each test statistic type
                                                    Object.values(TestModes).forEach(testMode => {
                                                        res[finalText][testMode] = compareSetupDPS(bData, bDPS, zerotwoData, zerotwoDPS, testMode);
                                                    });
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            });

            createPTable(res, 0.05);
            break;
        case Comparison.Speed:
            let minSpeed = chipFiltered.filter(d => d.speed == 4);
            let maxSpeed = chipFiltered.filter(d => d.speed > 4);
            // slowly create the setup name as we go through each possible filter
            Object.values(Fairies).forEach(fairy => {
                let fairyFilteredmin = minSpeed.filter(d => d.fairy.match(fairy));
                let fairyFilteredmax = maxSpeed.filter(d => d.fairy.match(fairy));
                let fairyText = fairy + " ";
                // only continue if both filtered datasets have remaining rows
                if (fairyFilteredmin.length > 0 && fairyFilteredmax.length > 0) {
                    // filter formation next
                    for (let i = 0; i < 2; i++) {
                        let ibool = i ? true : false;
                        let formationFilteredmin = fairyFilteredmin.filter(d => (d.formation == Formations.Formation_b) == ibool);
                        let formationFilteredmax = fairyFilteredmax.filter(d => (d.formation == Formations.Formation_b) == ibool);
                        let formationText = ibool ? "b-formation " : "0-2 formation ";
                        // filter hg presence next
                        if (formationFilteredmin.length > 0 && formationFilteredmax.length > 0) {
                            for (let j = 0; j < 2; j++) {
                                let jbool = j ? true : false;
                                let hgFilteredmin = formationFilteredmin.filter(d => d.has_HG == jbool);
                                let hgFilteredmax = formationFilteredmax.filter(d => d.has_HG == jbool);
                                let hgText = jbool ? "Jill " : "only ";
                                if (hgFilteredmin.length > 0 && hgFilteredmax.length > 0) {
                                    Object.values(Tanks).forEach(tank => {
                                        let tankFilteredmin = hgFilteredmin.filter(d => d.tank.match(tank));
                                        let tankFilteredmax = hgFilteredmax.filter(d => d.tank.match(tank));
                                        let tankText = tank + " ";
                                        // filter armor next
                                        if (tankFilteredmin.length > 0 && tankFilteredmax.length > 0) {
                                            for (let k = 0; k < 2; k++) {
                                                let kbool = k ? true : false;
                                                let armorFilteredmin = tankFilteredmin.filter(d => d.has_armor == kbool);
                                                let armorFilteredmax = tankFilteredmax.filter(d => d.has_armor == kbool);
                                                let armorText = "";
                                                if (tank == Tanks.M16) {
                                                    armorText = kbool ? "SPEQ+Armor " : "SPEQ+T-Exo ";
                                                }
                                                if (armorFilteredmin.length > 0 && armorFilteredmax.length > 0) {
                                                    let minDPS = getUniquesInCol(armorFilteredmin, "DPS");
                                                    let maxDPS = getUniquesInCol(armorFilteredmax, "DPS");
                                                    let minData = getDPSData(armorFilteredmin);
                                                    let maxData = getDPSData(armorFilteredmax);
                                                    minDPS.forEach((d, index) => minDPS[index] = d.toLowerCase());
                                                    minDPS = minDPS.filter((d, index, a) => a.indexOf(d) == index);
                                                    maxDPS.forEach((d, index) => maxDPS[index] = d.toLowerCase());
                                                    maxDPS = maxDPS.filter((d, index, a) => a.indexOf(d) == index); 
                                                    // assemble the text given to the setup name for the table
                                                    let finalText = chipText + tankText + armorText + fairyText + hgText + formationText;
                                                    res[finalText] = {};
                                                    // get the p-values of the setup for each dps and for each test statistic type
                                                    Object.values(TestModes).forEach(testMode => {
                                                        res[finalText][testMode] = compareSetupDPS(minData, minDPS, maxData, maxDPS, testMode);
                                                    });
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            });

            createPTable(res, 0.05);
            break;
        case Comparison.Tank:
            let m16Tank = chipFiltered.filter(d => d.tank.match(Tanks.M16));
            let shortyTank = chipFiltered.filter(d => d.tank.match(Tanks.SUPERSHORTY));
            // slowly create the setup name as we go through each possible filter
            Object.values(Fairies).forEach(fairy => {
                let fairyFilteredm16 = m16Tank.filter(d => d.fairy.match(fairy));
                let fairyFilteredshorty = shortyTank.filter(d => d.fairy.match(fairy));
                let fairyText = fairy + " ";
                // only continue if both filtered datasets have remaining rows
                if (fairyFilteredm16.length > 0 && fairyFilteredshorty.length > 0) {
                    // filter formation next
                    for (let i = 0; i < 2; i++) {
                        let ibool = i ? true : false;
                        let formationFilteredm16 = fairyFilteredm16.filter(d => (d.formation == Formations.Formation_b) == ibool);
                        let formationFilteredshorty = fairyFilteredshorty.filter(d => (d.formation == Formations.Formation_b) == ibool);
                        let formationText = ibool ? "b-formation " : "0-2 formation ";
                        // filter hg presence next
                        if (formationFilteredm16.length > 0 && formationFilteredshorty.length > 0) {
                            for (let j = 0; j < 2; j++) {
                                let jbool = j ? true : false;
                                let hgFilteredm16 = formationFilteredm16.filter(d => d.has_HG == jbool);
                                let hgFilteredshorty = formationFilteredshorty.filter(d => d.has_HG == jbool);
                                let hgText = jbool ? "Jill " : "only ";
                                if (hgFilteredm16.length > 0 && hgFilteredshorty.length > 0) {
                                    for (let l = 0; l < 2; l++) {
                                        let lbool = l ? true : false;
                                        let speedFilteredm16 = hgFilteredm16.filter(d => (d.speed == 4) != lbool);
                                        let speedFilteredshorty = hgFilteredshorty.filter(d => (d.speed == 4) != lbool);
                                        let speedText = lbool ? "max speed " : "min speed ";
                                        // filter armor next
                                        if (speedFilteredm16.length > 0 && speedFilteredshorty.length > 0) {
                                            for (let k = 0; k < 2; k++) {
                                                let kbool = k ? true : false;
                                                let armorFilteredm16 = speedFilteredm16.filter(d => d.has_armor == kbool);
                                                // shorty always has armor
                                                let armorFilteredshorty = speedFilteredshorty;
                                                if (armorFilteredm16.length > 0 && armorFilteredshorty.length > 0) {
                                                    let m16DPS = getUniquesInCol(armorFilteredm16, "DPS");
                                                    let shortyDPS = getUniquesInCol(armorFilteredshorty, "DPS");
                                                    let m16Data = getDPSData(armorFilteredm16);
                                                    let shortyData = getDPSData(armorFilteredshorty);
                                                // convert data to repair cost as that is what we are using to compare rather than damage taken as SGs have a
                                                // different formula for repair costs and that is the main consideration for tanks, how much resources are used per run
                                                    for (let n = 0; n < m16Data.length / 2; n++) {
                                                        for (let m = 0; m < m16Data[n * 2].length; m++) {
                                                            m16Data[n*2][m] = +(+m16Data[n*2+1][m].slice(0, m16Data[n*2+1][m].length - 1) * 0.3 * 8.2).toFixed(2);
                                                        }
                                                    }
                                                    for (let n = 0; n < shortyData.length / 2; n++) {
                                                        for (let m = 0; m < shortyData[n * 2].length; m++) {
                                                            shortyData[n*2][m] = +(+shortyData[n*2+1][m].slice(0, shortyData[n*2+1][m].length-1) * 0.3 * 16.1).toFixed(2);
                                                        }
                                                    }
                                                    m16DPS.forEach((d, index) => m16DPS[index] = d.toLowerCase());
                                                    m16DPS = m16DPS.filter((d, index, a) => a.indexOf(d) == index);
                                                    shortyDPS.forEach((d, index) => shortyDPS[index] = d.toLowerCase());
                                                    shortyDPS = shortyDPS.filter((d, index, a) => a.indexOf(d) == index); 
                                                    // assemble the text given to the setup name for the table
                                                    let finalText = chipText + fairyText + hgText + formationText + speedText;
                                                    res[finalText] = {};
                                                    // get the p-values of the setup for each dps and for each test statistic type
                                                    Object.values(TestModes).forEach(testMode => {
                                                        res[finalText][testMode] = compareSetupDPS(shortyData, shortyDPS, m16Data, m16DPS, testMode);
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            createPTable(res, 0.01);
            break;
        case Comparison.Equip:
            let equip416 = {};
            let equipk11 = {};
            let equipsop = {};
            // skip creating split datasets until the end as we need to do it 3 times for the different dps units
            // slowly create the setup name as we go through each possible filter
            Object.values(Fairies).forEach(fairy => {
                let fairyFiltered = chipFiltered.filter(d => d.fairy.match(fairy));
                let fairyText = fairy + " ";
                // only continue if both filtered datasets have remaining rows
                if (fairyFiltered.length > 0) {
                    // filter speed next
                    for (let i = 0; i < 2; i++) {
                        let ibool = i ? true : false;
                        let speedFiltered = fairyFiltered.filter(d => (d.speed == 4) != ibool);
                        let speedText = ibool ? "max speed " : "min speed ";
                        // filter hg presence next
                        if (speedFiltered.length > 0) {
                            for (let j = 0; j < 2; j++) {
                                let jbool = j ? true : false;
                                let hgFiltered = speedFiltered.filter(d => d.has_HG == jbool);
                                let hgText = jbool ? "Jill " : "only ";
                                if (hgFiltered.length > 0) {
                                    Object.values(Tanks).forEach(tank => {
                                        let tankFiltered = hgFiltered.filter(d => d.tank.match(tank));
                                        let tankText = tank + " ";
                                        // filter armor next
                                        if (tankFiltered.length > 0) {
                                            for (let k = 0; k < 2; k++) {
                                                let kbool = k ? true : false;
                                                let armorFiltered = tankFiltered.filter(d => d.has_armor == kbool);
                                                let armorText = "";
                                                if (tank == Tanks.M16) {
                                                    armorText = kbool ? "SPEQ+Armor " : "SPEQ+T-Exo ";
                                                }
                                                if (armorFiltered.length > 0) {
                                                    for (let l = 0; l < 2; l++) {
                                                        let lbool = l ? true : false;
                                                        let formationFiltered = armorFiltered.filter(d => (d.formation == Formations.Formation_b) == lbool);
                                                        let formationText = lbool ? "b-Formation " : "0-2-Formation ";
                                                        if (formationFiltered.length > 0) {
                                                            let dpsList = getUniquesInCol(formationFiltered, "DPS");
                                                            let baseData = getDPSData(formationFiltered);
                                                            dpsList.forEach((d, index) => dpsList[index] = d.toLowerCase());
                                                            dpsList = dpsList.filter((d, index, a) => a.indexOf(d) == index);
                                                            let data416vfl = [];
                                                            let data416speq = [];
                                                            let datak11vfl = [];
                                                            let datak11eot = [];
                                                            let datasopvfl = [];
                                                            let datasopeot = [];
                                                            dpsList.forEach((d, index) => {
                                                                if (d.match(Carry.HK416)) {
                                                                    if (d.match("speq"))
                                                                        data416speq = baseData[index * 2];
                                                                    else if (d.match("vfl"))
                                                                        data416vfl = baseData[index * 2];
                                                                    else
                                                                        console.error(`${d} does not match speq or vfl`);
                                                                }
                                                                else if (d.match(Carry.K11)) {
                                                                    if (d.match("eot"))
                                                                        datak11eot = baseData[index * 2];
                                                                    else if (d.match("vfl"))
                                                                        datak11vfl = baseData[index * 2];
                                                                    else
                                                                        console.error(`${d} does not match eot or vfl`);
                                                                }
                                                                else if (d.match(Carry.SOP)) {
                                                                    if (d.match("eot"))
                                                                        datasopeot = baseData[index * 2];
                                                                    else if (d.match("vfl"))
                                                                        datasopvfl = baseData[index * 2];
                                                                    else
                                                                        console.error(`${d} does not match eot or vfl`);
                                                                }
                                                            });
                                                            // assemble the text given to the setup name for the table
                                                            let finalText = chipText + tankText + armorText + fairyText + hgText + formationText + speedText;
                                                            // only create empty objects for dps with a vfl-eot pair
                                                            if (data416speq.length > 0 && data416vfl.length > 0)
                                                                equip416[finalText] = {};
                                                            if (datak11eot.length > 0 && datak11vfl.length > 0)
                                                                equipk11[finalText] = {};
                                                            if (datasopeot.length > 0 && datasopvfl.length > 0)
                                                                equipsop[finalText] = {};
                                                            // get the p-values of the setup for each dps and for each test statistic type
                                                            Object.values(TestModes).forEach(testMode => {
                                                                if (data416speq.length > 0 && data416vfl.length > 0)
                                                                    equip416[finalText][testMode] = compareSpecificDPS(data416vfl, data416speq, testMode);
                                                                if (datak11eot.length > 0 && datak11vfl.length > 0)
                                                                    equipk11[finalText][testMode] = compareSpecificDPS(datak11vfl, datak11eot, testMode);
                                                                if (datasopeot.length > 0 && datasopvfl.length > 0)
                                                                    equipsop[finalText][testMode] = compareSpecificDPS(datasopvfl, datasopeot, testMode);
                                                            });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            });

            createEquipPTable(equip416, equipk11, equipsop);
            break;
        case Comparison.Uzi:
            let uzi = chipFiltered.filter(d => d.DPS.toLowerCase().match(Carry.UZI));
            let sl8 = uzi.filter(d => d.DPS.match("8/8"));
            let sl9 = uzi.filter(d => d.DPS.match("9/8"));
            // slowly create the setup name as we go through each possible filter
            Object.values(Fairies).forEach(fairy => {
                let fairyFilteredsl8 = sl8.filter(d => d.fairy.match(fairy));
                let fairyFilteredsl9 = sl9.filter(d => d.fairy.match(fairy));
                let fairyText = fairy + " ";
                // only continue if both filtered datasets have remaining rows
                if (fairyFilteredsl8.length > 0 && fairyFilteredsl9.length > 0) {
                    // filter speed next
                    for (let i = 0; i < 2; i++) {
                        let ibool = i ? true : false;
                        let speedFilteredsl8 = fairyFilteredsl8.filter(d => (d.speed == 4) != ibool);
                        let speedFilteredsl9 = fairyFilteredsl9.filter(d => (d.speed == 4) != ibool);
                        let speedText = ibool ? "max speed " : "min speed ";
                        // filter hg presence next
                        if (speedFilteredsl8.length > 0 && speedFilteredsl9.length > 0) {
                            for (let j = 0; j < 2; j++) {
                                let jbool = j ? true : false;
                                let hgFilteredsl8 = speedFilteredsl8.filter(d => d.has_HG == jbool);
                                let hgFilteredsl9 = speedFilteredsl9.filter(d => d.has_HG == jbool);
                                let hgText = jbool ? "Jill " : "only ";
                                if (hgFilteredsl8.length > 0 && hgFilteredsl9.length > 0) {
                                    Object.values(Tanks).forEach(tank => {
                                        let tankFilteredsl8 = hgFilteredsl8.filter(d => d.tank.match(tank));
                                        let tankFilteredsl9 = hgFilteredsl9.filter(d => d.tank.match(tank));
                                        let tankText = tank + " ";
                                        // filter armor next
                                        if (tankFilteredsl8.length > 0 && tankFilteredsl9.length > 0) {
                                            for (let k = 0; k < 2; k++) {
                                                let kbool = k ? true : false;
                                                let armorFilteredsl8 = tankFilteredsl8.filter(d => d.has_armor == kbool);
                                                let armorFilteredsl9 = tankFilteredsl9.filter(d => d.has_armor == kbool);
                                                let armorText = "";
                                                if (tank == Tanks.M16) {
                                                    armorText = kbool ? "SPEQ+Armor " : "SPEQ+T-Exo ";
                                                }
                                                if (armorFilteredsl8.length > 0 && armorFilteredsl9.length > 0) {
                                                    for (let l = 0; l < 2; l++) {
                                                        let lbool = l ? true : false;
                                                        let formationFilteredsl8 = armorFilteredsl8.filter(d => (d.formation == Formations.Formation_b) == lbool);
                                                        let formationFilteredsl9 = armorFilteredsl9.filter(d => (d.formation == Formations.Formation_b) == lbool);
                                                        let formationText = lbool ? "b-Formation " : "0-2-Formation ";
                                                        if (formationFilteredsl8.length > 0 && formationFilteredsl9.length > 0) {
                                                            let sl8Data = [];
                                                            let sl9Data = [];
                                                            formationFilteredsl8.forEach(d => {
                                                                sl8Data.push(d.damage);
                                                            });
                                                            formationFilteredsl9.forEach(d => {
                                                                sl9Data.push(d.damage);
                                                            })
                                                            // assemble the text given to the setup name for the table
                                                            let finalText = chipText + tankText + armorText + fairyText + hgText + formationText + speedText;
                                                            res[finalText] = {};
                                                            // get the p-values of the setup for each dps and for each test statistic type
                                                            Object.values(TestModes).forEach(testMode => {
                                                                res[finalText][testMode] = compareSpecificDPS(sl8Data, sl9Data, testMode);
                                                            });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            });

            createPTable(res, 0.01, "Uzi");
            break;
        default:
            console.error(`${compare} does not exist`);
    }
    
}
// Create 3 tables from the data, one for mean, standard deviation, and KS test
function createPTable(data, pVal, dpsName = null) {
    // separate arrays for mean, standard deviation, and ks test
    let meanSetups = [];
    let dpsHeaders = ["setup"];
    if (dpsName) {
        dpsHeaders.push(dpsName);
    }
    let sdevSetups = [];
    let ksSetups = [];
    Object.entries(data).forEach((setup, index) => {
        meanSetups.push({"setup" : setup[0]});
        sdevSetups.push({"setup" : setup[0]});
        ksSetups.push({"setup" : setup[0]});
        Object.entries(setup[1]).forEach(type => {
            if (!dpsName) {
                Object.entries(type[1]).forEach(doll => {
                    if (index == 0 && type[0] == TestModes.MEAN) {
                        dpsHeaders.push(doll[0]);
                    }
                    switch(type[0]) {
                        case TestModes.MEAN:
                            meanSetups[index][doll[0]] = doll[1];
                            break;
                        case TestModes.STDDEV:
                            sdevSetups[index][doll[0]] = doll[1];
                            break;
                        case TestModes.KSTEST:
                            ksSetups[index][doll[0]] = doll[1];
                            break;
                    }
                });
            }
            else {
                switch(type[0]) {
                    case TestModes.MEAN:
                        meanSetups[index][dpsName] = type[1];
                        break;
                    case TestModes.STDDEV:
                        sdevSetups[index][dpsName] = type[1];
                        break;
                    case TestModes.KSTEST:
                        ksSetups[index][dpsName] = type[1];
                        break;
                }
            }
        });
    });
    
    // clear the previous tables
    pTableBody.selectAll("*").remove();
    // create titles in between each table and create the html element that houses the tables
    pTableBody.append("h3").text("Left Side p-values of Mean");
    let meanBody = pTableBody.append("div");
    createTable(meanBody, dpsHeaders, meanSetups, true, true, pVal);
    pTableBody.append("h3").text("Left Side p-values of Standard Deviation");
    let sdevBody = pTableBody.append("div");
    createTable(sdevBody, dpsHeaders, sdevSetups, true, true, pVal);
    pTableBody.append("h3").text("Right Side p-values of KS Test");
    let ksBody = pTableBody.append("div");
    createTable(ksBody, dpsHeaders, ksSetups, true, false, pVal);
}

function createEquipPTable(data416, datak11, datasop) {
    // separate arrays for mean, standard deviation, and ks test
    let meanSetups = [];
    let dpsHeaders = ["setup", "416 vfl-speq", "k11 vfl-eot", "sopmod vfl-eot"];
    let sdevSetups = [];
    let ksSetups = [];
    Object.entries(data416).forEach((setup, index) => {
        meanSetups.push({"setup" : setup[0]});
        sdevSetups.push({"setup" : setup[0]});
        ksSetups.push({"setup" : setup[0]});
        Object.entries(setup[1]).forEach(type => {
            switch(type[0]) {
                case TestModes.MEAN:
                    meanSetups[index]["416 vfl-speq"] = type[1];
                    break;
                case TestModes.STDDEV:
                    sdevSetups[index]["416 vfl-speq"] = type[1];
                    break;
                case TestModes.KSTEST:
                    ksSetups[index]["416 vfl-speq"] = type[1];
                    break;
            }
        });
    });
    Object.entries(datak11).forEach((setup, index) => {
        Object.entries(setup[1]).forEach(type => {
            switch(type[0]) {
                case TestModes.MEAN:
                    meanSetups[index]["k11 vfl-eot"] = type[1];
                    break;
                case TestModes.STDDEV:
                    sdevSetups[index]["k11 vfl-eot"] = type[1];
                    break;
                case TestModes.KSTEST:
                    ksSetups[index]["k11 vfl-eot"] = type[1];
                    break;
            }
        });
    });
    Object.entries(datasop).forEach((setup, index) => {
        Object.entries(setup[1]).forEach(type => {
            switch(type[0]) {
                case TestModes.MEAN:
                    meanSetups[index]["sopmod vfl-eot"] = type[1];
                    break;
                case TestModes.STDDEV:
                    sdevSetups[index]["sopmod vfl-eot"] = type[1];
                    break;
                case TestModes.KSTEST:
                    ksSetups[index]["sopmod vfl-eot"] = type[1];
                    break;
            }
        });
    });
    
    // clear the previous tables
    pTableBody.selectAll("*").remove();
    // create titles in between each table and create the html element that houses the tables
    pTableBody.append("h3").text("Left Side p-values of Mean");
    let meanBody = pTableBody.append("div");
    createTable(meanBody, dpsHeaders, meanSetups, true, true, 0.1);
    pTableBody.append("h3").text("Left Side p-values of Standard Deviation");
    let sdevBody = pTableBody.append("div");
    createTable(sdevBody, dpsHeaders, sdevSetups, true, true, 0.1);
    pTableBody.append("h3").text("Right Side p-values of KS Test");
    let ksBody = pTableBody.append("div");
    createTable(ksBody, dpsHeaders, ksSetups, true, false, 0.1);
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
        // to cover edge case when using dps dropdown before selecting setups
        filteredData = data; 
        // get the max perc for both chip and chipless for box and whisker later
        getMaxDamage();
        // get the average repair costs
        getChippedRepairs();
        getChiplessRepairs();
        createTable(chippedRepairBody, repairHeaders, chippedRepairData);
        createTable(chiplessRepairBody, repairHeaders, chiplessRepairData);
    });
// info for non-gfl players
{
gflDescriptionToggle = d3.select("body").append("div")
                                        .attr("class", "box")
                                        .attr("id", "gfltoggle")
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
            .attr("id", "postChip")
            .text("Post-Chip Update")
            .on("click", function() {
                showChippedData();
            });
chipTabs.append("div")
            .attr("class", "box")
            .attr("id", "preChip")
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
// divider for next section
d3.select("body").append("hr");
// NOTE TO REDO THE DATA COMPARISON TO SOMETHING LESS SIMPLISTIC AS COMPARING AVERAGE, 1ST AND 3RD QUARTILES TO DETERMINE WHICH SETUP IS BETTER
{
    var headerText = "Comparison Setup";
    var bodyText = "<li>For comparing the data of different setups to determine which is better, we use Monte Carlo permutation tests due to the size of the " +
                    "datasets making a full exploration of all possible permutations computationally expensive.\n<li>We set the number of permutations to simulate " + 
                    "at 1e4.\n<li>The random number generation method uses a Linear Congruential Generator custom function with modulus 2^31, multiplier 22695477 " +
                    "and increment 1 to allow us to set the seed for reproducibility of the results.\n<li>The test statistics measured are differences in mean or " +
                    "standard deviation between the chosen two datasets, and the Kolmogorov-Smirnov or KS test.\n<li>Our null hypotheses is that the datasets come " +
                    "from the same distribution and our alternative hypotheses is that they come from different distributions. For mean and standard deviation, we " +
                    "will check both extremes of the p-value because our assignment of which of the two datasets is labeled dataset 1 and dataset 2 flips the " +
                    "computed p-values whereas with KS test, we will only calculate the p-value with respect to the right-tail as the KS test computes maximum " +
                    "distance between the empirical cumulative distribution functions so only large test statistics will lead us to reject the null hypotheses." +
                    "\n<li>The p-value for mean and standard deviation differences will be computed with respect to the left-side so a p-value close to 0 indicates " +
                    "a strong likelihood that mean(dataset1) < mean(dataset2) whereas a p-value close to 1 indicates a strong likelihood that mean(dataset1) > " +
                    "mean(dataset2). The same logic follows for the difference in standard deviations of the two datasets.\n<li>The p-value that will lead us to " +
                    "reject the null hypotheses is different between each comparison and additionally for mean and standard deviation, 1 - pvalue as we want to " +
                    "perform a two-tailed test to see which setup the datapoints are favoring in addition to determining whether to reject the null hypotheses. " +
                    "T-Exo vs Armor, b vs 0-2 formation, and min vs max speed take 0.05 as the p-value as those are tedious to repeatedly change between runs if the " +
                    "pair of DPS units prefer different configurations so we reject the null hypothesis only with extreme p-values as the benefits would be " +
                    "significant enough to deliberately use their ideal configuration even if their counterpart's ideal takes the opposite configuration. SG vs M16 " +
                    "tank takes 0.01 as the p-value as there are additional benefits to using an SG tank to level up over M16 who is typically max leveled. VFL vs " +
                    "EOT/SPEQ comparisons take 0.1 as the p-value as the choice significantly changes the doll's damage profile (VFL improves only normal attacks " +
                    "but by a significant amount while EOT/SPEQ choices improve both skill and normal attack damage), DPS equipment are compared with the same doll " +
                    "so there is no need to consider the possibility of changing it between runs. Uzi sl8 vs sl9 takes a p-value of 0.01 as we do expect some " +
                    "degree of improvement as we are upgrading the skill but we want to see if it is a significant improvement such that it would be recommended " +
                    "to get over upgrading the skills of other dolls not used in the corpse drag.\n<li>The labeled order of the dataset is the order they appear " +
                    "in the dropdown text eg. T-exo vs Armor has T-exo as dataset 1 and Armor as dataset 2 and a p-value for mean or standard deviation close to 0 " +
                    "indicates a high probability that the true mean or standard deviation of T-exo dataset is smaller than that of the Armor dataset. This is " +
                    "for illustrative purposes only as we actually observe the opposite where the p-values of the various DPS units is closer to 1 which favors" +
                    " the use of Armor on M16 rather than T-exo";
    addSection(d3.select("body"), headerText, bodyText);
}
// new comparison method for the setup comparisons
{
    // holder of dropdown button
    const comparisonDropdownHolder = d3.select("body").append("div").attr("class", "tabs");
    // button to show setup dropdown
    const comparisonDropdown = comparisonDropdownHolder.append("div")
                .attr("class", "box")
                .text("Compared Setups")
                .on("click", function() {
                    toggleComparisonDropdown();
                });
    comparisonDropdown.append("i")
                    .attr("class", "fa fa-caret-down");
    // setup the comparison analysis text
    const comparisonAnalysis = d3.select("body").append("div");
    // setup the comparison dropdown menu
    {
        chippedComparisonOptions = comparisonDropdown.append("div").attr("class", "dropdownBox").style("display", "none");
        chippedComparisonOptions.append("a")
                        .text("b-Formation vs 0-2-Formation")
                        .on("click", () => {
                            createComparisonSection(Comparison.Formation);
                        });
        chippedComparisonOptions.append("a")
                        .text("4 vs max speed")
                        .on("click", () => {
                            createComparisonSection(Comparison.Speed);
                        });
        chippedComparisonOptions.append("a")
                        .text("Uzi mod SL8/8 vs SL9/8")
                        .on("click", () => {
                            createComparisonSection(Comparison.Uzi);
                        });
        
        chiplessComparisonOptions = comparisonDropdown.append("div").attr("class", "dropdownBox").style("display", "none");
        chiplessComparisonOptions.append("a")
                        .text("T-Exo vs Armor")
                        .on("click", () => {
                            comparisonAnalysis.text("Our main statistic of interest is if the mean is not equal and given our specified p-value we reject the " +
                            "null hypothesis for 10 out of 14 comparisons. Additionally, evidence suggests that armor may be better than T-exo. ");
                            createComparisonSection(Comparison.Exo_Armor);
                        });
        chiplessComparisonOptions.append("a")
                        .text("b-Formation vs 0-2-Formation")
                        .on("click", () => {
                            createComparisonSection(Comparison.Formation);
                        });
        chiplessComparisonOptions.append("a")
                        .text("4 vs max speed")
                        .on("click", () => {
                            createComparisonSection(Comparison.Speed);
                        });
        chiplessComparisonOptions.append("a")
                        .text("SG vs M16 tank")
                        .on("click", () => {
                            createComparisonSection(Comparison.Tank);
                        });
        chiplessComparisonOptions.append("a")
                        .text("VFL vs EOT/SPEQ")
                        .on("click", () => {
                            createComparisonSection(Comparison.Equip);
                        });
    }


    pTableBody = d3.select("body").append("div");
}
d3.select("body").append("hr");
// header for chart section
d3.select("body").append("h2")
                    .text("Charts of Tested Setups");
// table of average repair costs per run
{
    // button to hide/display repair cost table
    repairToggle = d3.select("body").append("div")
                    .attr("class", "box")
                    .attr("id", "repairToggle")
                    .on("click", () => {
                        toggleRepairTable();
                    });
    repairToggle.text("Hide Repair Costs");  
    // table base
    repairTableBody = d3.select("body").append("div");
    repairTableBody.append("h3").text("Average Repair Cost of Each Setup");
    repairTable = repairTableBody.append("table");
    // table contents, swapped between which of chip and chipless summary is selected
    chippedRepairBody = repairTable.append("div");
    chiplessRepairBody = repairTable.append("div");
    chiplessRepairBody.style("display", "none");
}
// header for chart section
d3.select("body").append("h3")
                    .text("View Specific Setup");
// data charts body
{
    // holder of dropdown buttons
    const chartDropdownHolder = d3.select("body").append("div").attr("class", "tabs");
    // button to show setup dropdown
    const setupDropdown = chartDropdownHolder.append("div")
                .attr("class", "box")
                .text("Tested Setups")
                .on("click", function() {
                    toggleChartDropdown();
                });
    setupDropdown.append("i")
                    .attr("class", "fa fa-caret-down");
    // button to show dps dropdown     
    const DPSDropdown = chartDropdownHolder.append("div")
                .attr("class", "box")
                .text("Tested DPS")
                .on("click", function() {
                    toggleDPSDropdown();
                });
    DPSDropdown.append("i")
                    .attr("class", "fa fa-caret-down");
    DPSOptions = DPSDropdown.append("div").attr("class", "dropdownBox").style("display", "none"); 
    // chipped setups dropdown      
    {
        //holder of the chipped setup dropdown options
        chippedSetupsOptions = setupDropdown.append("div").attr("class", "dropdownBox").style("display", "none");
        chippedSetupsOptions.append("a")
                        .text("All setups")
                        .on("click", () => {
                            filterData(null, null, null, null, null, null, null, 1);
                            showCSVTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*dmg1 Rescue Jill b-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*dmg1 Rescue Jill b-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.RESCUE, 0, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*fervor mortar Jill b-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.MORTAR, 1, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*fervor mortar Jill b-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.MORTAR, 0, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*dmg1 rescue Jill 0-2-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_02, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 5*dmg1 rescue Jill 0-2-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_02, Fairies.RESCUE, 0, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });  
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 1*cool lv100beach Jill b-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 1*cool lv100beach Jill b-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_b, Fairies.BEACH, 0, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 1*cool lv100beach Jill 0-2-formation min speed")
                        .on("click", () => {
                            filterData(Formations.Formation_02, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });
        chippedSetupsOptions.append("a")
                        .text("Chipped DPS m16 1*cool lv100beach Jill 0-2-formation max speed")
                        .on("click", () => {
                            filterData(Formations.Formation_02, Fairies.BEACH, 0, 1, Tanks.M16, 1, null, 1);
                            showCSVTable();
                        });
    }         
    // chipless setups dropdown
    {
        // holder of chipless setups dropdown options
        chiplessSetupsOptions = setupDropdown.append("div").attr("class", "dropdownBox").style("display", "none");
        chiplessSetupsOptions.append("a")
                                .text("All setups")
                                .on("click", () => {
                                    filterData(null, null, null, null, null, null, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*dmg1 Rescue Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*armor2 armor Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.ARMOR, 1, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*fervor mortar Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.MORTAR, 1, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*dmg1 rescue Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.RESCUE, 1, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*armor2 armor Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.ARMOR, 1, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*fervor mortar Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.MORTAR, 1, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*dmg1 Rescue Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*fervor mortar Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.MORTAR, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*dmg1 rescue Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.RESCUE, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*fervor mortar Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.MORTAR, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 2*dmg2 lv31 beach Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv31 beach Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 2*dmg2 lv60 beach Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 1, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv60 beach Jill 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 1, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv78 beach only 0-2-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 1, 0, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv78 beach only b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 1, 0, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*dmg1 Rescue Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 0, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv84 beach Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 5*dmg1 rescue Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.RESCUE, 0, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*dmg1 Rescue Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*dmg1 rescue Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.RESCUE, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv89 beach Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*fervor mortar Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.MORTAR, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 5*fervor mortar Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.MORTAR, 0, 1, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 2*dmg2 lv95 beach Jill b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 0, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Exo 2*dmg2 lv99 beach Jill 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 0, 1, Tanks.M16, 0, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv100 beach only b-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 0, 0, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("Shorty 2*dmg2 lv100 beach only 0-2-formation max speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_02, Fairies.BEACH, 0, 0, Tanks.SUPERSHORTY, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Armor 5*dmg1 Rescue Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.RESCUE, 1, 1, Tanks.M16, 1, null, 0);
                                    showCSVTable();
                                });
        chiplessSetupsOptions.append("a")
                                .text("M16 SPEQ+Armor 1*cool lv100 beach Jill b-formation min speed")
                                .on("click", () => {
                                    filterData(Formations.Formation_b, Fairies.BEACH, 1, 1, Tanks.M16, 1, null, 0);
                                    showCSVTable();
                                });
    }  
}

tableHolder = d3.select("body").append("div");

showChippedData();