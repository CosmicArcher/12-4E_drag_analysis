from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from plotly.subplots import make_subplots
from plotly.offline import plot
import plotly.graph_objects as go
import pandas as pd
import numpy as np
import re

from .Random import Random
from .PermutationTester import PermutationTester
from Findings.constants import FORMATIONS, FAIRIES, TANKS, CARRY, COMPARISONS, TESTMODES, NUMPERMUTATIONS
from Findings.models import Setup
# constants used in functions below
PAGELINKS = [["../index", "Index"],["../newData", "New Data"], ["../loadCSV", "Load CSV"], ["../deleteData", "Delete Data"],
             ["../permutationTests", "Permutation Tests"]]
PROJECTTITLE = "12-4E Drag Analysis"

# create dict used for button links to other pages from an array of key-value pair arrays
def createPageDetails(arr):
    pageDetails = [{} for i in range(len(arr))]
    for index, page in enumerate(arr):
        pageDetails[index]["url"] = page[0]
        pageDetails[index]["name"] = page[1]
    return pageDetails
# get the dict containing the details for the pages other than the input page
def getPageLinks(pageRequest):
    # convert the http request into the current url
    currPage = "../" + pageRequest.path_info.split("/")[-2]
    # get a copy of all page links and names from the constant except for the current page
    pages = []
    for i in range(len(PAGELINKS)):
        if currPage != PAGELINKS[i][0]:
            pages.append(PAGELINKS[i])
    # return, as the result, the dict of the remaining page links and names
    return createPageDetails(pages)
# create page title by combining project title with page name
def createPageTitle(pageName):
    return  PROJECTTITLE + ": " + pageName
# filter pandas dataframe
def filterData(dataframe, formation = None, fairy = None, isminspeed = None, hg = None, tank = None, armor = None, dps = None, chip = None):
    filteredData = dataframe.copy()
    if formation is not None:
        filteredData = filteredData[filteredData.formation == formation]
    if fairy is not None:
        filteredData = filteredData[filteredData.fairy.str.contains(fairy)]
    if hg is not None:
        filteredData = filteredData[filteredData.has_HG == hg]
    if tank is not None:
        filteredData = filteredData[filteredData.tank.str.contains(tank)]
    if armor is not None:
        filteredData = filteredData[filteredData.has_armor == armor]
    if dps is not None:
        filteredData = filteredData[filteredData.DPS.str.contains(dps, regex = False)]
    if chip is not None:
        filteredData = filteredData[filteredData.has_chip == chip]
    if isminspeed is not None: 
        if isminspeed:
            filteredData = filteredData[filteredData.speed == 4]
        else:
            filteredData = filteredData[filteredData.speed > 4]
        
    return filteredData
# filter dataframe to get each DPS' damage data and return as 2d array where each DPS has 2 columns for damage and repair cost
def getDPSData(data):
    dpsList = data.DPS.unique()
    # store damage data in a 2d array
    dpsData = []
    for i, d in enumerate(dpsList):
        #create 2 columns per dps, one for damage taken, the other for total_repair_cost_cost (weighted parts as 3x)
        dpsData.append([])
        dpsData.append([])

        dpsDamage = data[data.DPS.str.contains(d, regex = False)][["damage", "total_repair_cost"]]
        for index in range(dpsDamage.shape[0]):
            # because each dps has 2 columns, the indices of the next one is in intervals of 2
            dpsData[i * 2].append(dpsDamage.damage.iloc[index])
            dpsData[i * 2 + 1].append(dpsDamage.total_repair_cost.iloc[index])
    return dpsData
# get the p-values from permutation tests for each shared dps between the setups
def compareSetupDPS(data1, dpsList1, data2, dpsList2, testMode = TESTMODES.MEAN, isRepair = False):
    # get only the dps that both datasets share for a fair comparison
    sharedDPS = []
    for i in range(dpsList1.size) :
        for j in range(dpsList2.size):
            if (dpsList1[i] == dpsList2[j]) :
                sharedDPS.append(dpsList1[i])
                break

    pValues = {}
    for i in range(len(sharedDPS)):
        # if we are getting the repair cost instead of damage, use the second column in each pair
        dmgArray1 = data1[np.where(dpsList1 == sharedDPS[i])[0][0] * 2 + isRepair]
        dmgArray2 = data2[np.where(dpsList2 == sharedDPS[i])[0][0] * 2 + isRepair]
        # get the left-side p-values of non KS test
        pValues[sharedDPS[i]] = PermutationTester.performTest(dmgArray1, dmgArray2, testMode, testMode != TESTMODES.KSTEST)

    return pValues
# get the p-values between the setups with only one dps
def compareSpecificDPS(data1, data2, testMode = TESTMODES.MEAN):
    # get the left-side p-values of non KS test
    return PermutationTester.performTest(data1, data2, testMode, testMode != TESTMODES.KSTEST)
# return a nested dict containing data needed to construct the  p-tables
def getComparisonData(data, compare = COMPARISONS.EXO_ARMOR):
    # there are only 3 comparisons that make use of chipped data, the rest are chipless
    if compare in [COMPARISONS.CHIPPED_FORMATION, COMPARISONS.CHIPPED_SPEED, COMPARISONS.UZI]:
        chipFiltered = data[data.has_chip == 1]
    else :
        chipFiltered = data[data.has_chip == 0]
    
    res = {}
    if compare == COMPARISONS.EXO_ARMOR:
        filteredData = filterData(data, FORMATIONS.FORMATION_B, FAIRIES.RESCUE, 1, 1, TANKS.M16, 0, None, 0)
        testedDPS1 = filteredData.DPS.unique()
        data1 = getDPSData(filteredData)
        filteredData = filterData(data, FORMATIONS.FORMATION_B, FAIRIES.RESCUE, 1, 1, TANKS.M16, 1, None, 0)
        testedDPS2 = filteredData.DPS.unique()
        data2 = getDPSData(filteredData)

        res["b-Formation Rescue min speed"] = {}
        res["b-Formation Rescue min speed"][TESTMODES.MEAN] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TESTMODES.MEAN)
        res["b-Formation Rescue min speed"][TESTMODES.STDDEV] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TESTMODES.STDDEV)
        res["b-Formation Rescue min speed"][TESTMODES.KSTEST] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TESTMODES.KSTEST)

        filteredData = filterData(data, FORMATIONS.FORMATION_B, FAIRIES.BEACH, 1, 1, TANKS.M16, 0, None, 0)
        testedDPS1 = filteredData.DPS.unique()
        data1 = getDPSData(filteredData)
        filteredData = filterData(data, FORMATIONS.FORMATION_B, FAIRIES.BEACH, 1, 1, TANKS.M16, 1, None, 0)
        testedDPS2 = filteredData.DPS.unique()
        data2 = getDPSData(filteredData)

        res["b-Formation Beach min speed"] = {}
        res["b-Formation Beach min speed"][TESTMODES.MEAN] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TESTMODES.MEAN)
        res["b-Formation Beach min speed"][TESTMODES.STDDEV] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TESTMODES.STDDEV)
        res["b-Formation Beach min speed"][TESTMODES.KSTEST] = compareSetupDPS(data1, testedDPS1, data2, testedDPS2, TESTMODES.KSTEST)

        return res
    elif compare in [COMPARISONS.CHIPPED_FORMATION, COMPARISONS.CHIPLESS_FORMATION]:
        # iterate through all setups by going through all combinations of filtering the data outside of the variable of interest where they will be separated
        # into different datasets and DPS as that will be handled later
        bFormation = chipFiltered[chipFiltered.formation.str.contains(FORMATIONS.FORMATION_B)]
        zerotwo = chipFiltered[chipFiltered.formation.str.contains(FORMATIONS.FORMATION_02)]
        # slowly create the setup name as we go through each possible filter
        for fairy in FAIRIES.List():
            fairyFilteredb = bFormation[bFormation.fairy.str.contains(fairy)]
            fairyFiltered02 = zerotwo[zerotwo.fairy.str.contains(fairy)]
            fairyText = fairy + " "
            # only continue if both filtered datasets have remaining rows
            if fairyFilteredb.shape[0] > 0 and fairyFiltered02.shape[0] > 0:
                # filter speed next
                for i in [0,1]:
                    speedFilteredb = fairyFilteredb[(fairyFilteredb.speed == 4) != i]
                    speedFiltered02 = fairyFiltered02[(fairyFiltered02.speed == 4) != i]
                    if i:
                        speedText = "max speed " 
                    else:
                        speedText = "min speed "
                    # filter hg presence next
                    if speedFilteredb.shape[0] > 0 and speedFiltered02.shape[0] > 0:
                        for j in [0,1]:
                            hgFilteredb = speedFilteredb[speedFilteredb.has_HG == j]
                            hgFiltered02 = speedFiltered02[speedFiltered02.has_HG == j]
                            if j:
                                hgText = "Jill " 
                            else: 
                                hgText = "only "
                            if hgFilteredb.shape[0] > 0 and hgFiltered02.shape[0] > 0:
                                for tank in TANKS.List():
                                    tankFilteredb = hgFilteredb[hgFilteredb.tank.str.contains(tank)]
                                    tankFiltered02 = hgFiltered02[hgFiltered02.tank.str.contains(tank)]
                                    tankText = tank + " "
                                    # filter armor next
                                    if tankFilteredb.shape[0] > 0 and tankFiltered02.shape[0] > 0:
                                        for k in [0,1]:
                                            armorFilteredb = tankFilteredb[tankFilteredb.has_armor == k]
                                            armorFiltered02 = tankFiltered02[tankFiltered02.has_armor == k]
                                            armorText = ""
                                            if tank == TANKS.M16:
                                                if k:
                                                    armorText = "SPEQ+Armor " 
                                                else: 
                                                    armorText = "SPEQ+T-Exo "
                                            if armorFilteredb.shape[0] > 0 and armorFiltered02.shape[0] > 0:
                                                bDPS = armorFilteredb.DPS.unique()
                                                zerotwoDPS = armorFiltered02.DPS.unique()
                                                bData = getDPSData(armorFilteredb)
                                                zerotwoData = getDPSData(armorFiltered02)
                                                # assemble the text given to the setup name for the table
                                                finalText = tankText + armorText + fairyText + hgText + speedText
                                                res[finalText] = {}
                                                print("Testing %s" % finalText)
                                                # get the p-values of the setup for each dps and for each test statistic type
                                                for testMode in TESTMODES.List():
                                                    res[finalText][testMode] = compareSetupDPS(bData, bDPS, zerotwoData, zerotwoDPS, testMode)

        return res
    elif compare in [COMPARISONS.CHIPPED_SPEED, COMPARISONS.CHIPLESS_SPEED]:
        minSpeed = chipFiltered[chipFiltered.speed == 4]
        maxSpeed = chipFiltered[chipFiltered.speed > 4]
        # slowly create the setup name as we go through each possible filter
        for fairy in FAIRIES.List():
            fairyFilteredmin = minSpeed[minSpeed.fairy.str.contains(fairy)]
            fairyFilteredmax = maxSpeed[maxSpeed.fairy.str.contains(fairy)]
            fairyText = fairy + " "
            # only continue if both filtered datasets have remaining rows
            if fairyFilteredmin.shape[0] > 0 and fairyFilteredmax.shape[0] > 0:
                # filter formation next
                for i in [0,1]:
                    formationFilteredmin = fairyFilteredmin[(fairyFilteredmin.formation == FORMATIONS.FORMATION_B) == i]
                    formationFilteredmax = fairyFilteredmax[(fairyFilteredmax.formation == FORMATIONS.FORMATION_B) == i]
                    if i:
                        formationText = "b-formation "
                    else: 
                        formationText = "0-2 formation "
                    # filter hg presence next
                    if formationFilteredmin.shape[0] > 0 and formationFilteredmax.shape[0] > 0:
                        for j in [0,1]:
                            hgFilteredmin = formationFilteredmin[formationFilteredmin.has_HG == j]
                            hgFilteredmax = formationFilteredmax[formationFilteredmax.has_HG == j]
                            if j:
                                hgText = "Jill " 
                            else: 
                                hgText = "only "
                            if hgFilteredmin.shape[0] > 0 and hgFilteredmax.shape[0] > 0:
                                for tank in TANKS.List():
                                    tankFilteredmin = hgFilteredmin[hgFilteredmin.tank.str.contains(tank)]
                                    tankFilteredmax = hgFilteredmax[hgFilteredmax.tank.str.contains(tank)]
                                    tankText = tank + " "
                                    # filter armor next
                                    if tankFilteredmin.shape[0] > 0 and tankFilteredmax.shape[0] > 0:
                                        for k in [0,1]:
                                            armorFilteredmin = tankFilteredmin[tankFilteredmin.has_armor == k]
                                            armorFilteredmax = tankFilteredmax[tankFilteredmax.has_armor == k]
                                            armorText = ""
                                            if tank == TANKS.M16:
                                                if k:
                                                    armorText = "SPEQ+Armor " 
                                                else:
                                                    armorText = "SPEQ+T-Exo "
                                            if armorFilteredmin.shape[0] > 0 and armorFilteredmax.shape[0] > 0:
                                                minDPS = armorFilteredmin.DPS.unique()
                                                maxDPS = armorFilteredmax.DPS.unique()
                                                minData = getDPSData(armorFilteredmin)
                                                maxData = getDPSData(armorFilteredmax)
                                                # assemble the text given to the setup name for the table
                                                finalText = tankText + armorText + fairyText + hgText + formationText
                                                res[finalText] = {}
                                                print("Testing %s" % finalText)
                                                #get the p-values of the setup for each dps and for each test statistic type
                                                for testMode in TESTMODES.List():
                                                    res[finalText][testMode] = compareSetupDPS(minData, minDPS, maxData, maxDPS, testMode)

        return res
    elif compare == COMPARISONS.TANK:
        m16Tank = chipFiltered[chipFiltered.tank.str.contains(TANKS.M16)]
        shortyTank = chipFiltered[chipFiltered.tank.str.contains(TANKS.SUPERSHORTY)]
        # slowly create the setup name as we go through each possible filter
        for fairy in FAIRIES.List():
            fairyFilteredm16 = m16Tank[m16Tank.fairy.str.contains(fairy)]
            fairyFilteredshorty = shortyTank[shortyTank.fairy.str.contains(fairy)]
            fairyText = fairy + " "
            # only continue if both filtered datasets have remaining rows
            if fairyFilteredm16.shape[0] > 0 and fairyFilteredshorty.shape[0] > 0:
                # filter formation next
                for i in [0, 1]:
                    formationFilteredm16 = fairyFilteredm16[(fairyFilteredm16.formation == FORMATIONS.FORMATION_B) == i]
                    formationFilteredshorty = fairyFilteredshorty[(fairyFilteredshorty.formation == FORMATIONS.FORMATION_B) == i]
                    if i:
                        formationText = "b-formation " 
                    else: 
                        formationText = "0-2 formation "
                    # filter hg presence next
                    if formationFilteredm16.shape[0] > 0 and formationFilteredshorty.shape[0] > 0:
                        for j in [0,1]:
                            hgFilteredm16 = formationFilteredm16[formationFilteredm16.has_HG == j]
                            hgFilteredshorty = formationFilteredshorty[formationFilteredshorty.has_HG == j]
                            if j:
                                hgText = "Jill " 
                            else:
                                hgText = "only "
                            if hgFilteredm16.shape[0] > 0 and hgFilteredshorty.shape[0] > 0:
                                for l in [0,1]:
                                    speedFilteredm16 = hgFilteredm16[(hgFilteredm16.speed == 4) != l]
                                    speedFilteredshorty = hgFilteredshorty[(hgFilteredshorty.speed == 4) != l]
                                    if l:
                                        speedText = "max speed " 
                                    else: 
                                        speedText = "min speed "
                                    # skip armor filter as we want to compare t-exo m16 vs SGs as armor m16 is generally a tankier SG in 12-4E
                                    armorFilteredm16 = speedFilteredm16[speedFilteredm16.has_armor == False]
                                    if armorFilteredm16.shape[0] > 0 and speedFilteredshorty.shape[0] > 0:
                                        m16DPS = armorFilteredm16.DPS.unique()
                                        shortyDPS = speedFilteredshorty.DPS.unique()
                                        m16Data = getDPSData(armorFilteredm16)
                                        shortyData = getDPSData(speedFilteredshorty)
                                        # assemble the text given to the setup name for the table
                                        finalText = fairyText + hgText + formationText + speedText
                                        res[finalText] = {}
                                        print("Testing %s" % finalText)
                                        # get the p-values of the setup for each dps and for each test statistic type
                                        for testMode in TESTMODES.List():
                                            res[finalText][testMode] = compareSetupDPS(shortyData, shortyDPS, m16Data, m16DPS, testMode, True)

        return res
    elif compare == COMPARISONS.EQUIP:
        equip416 = {}
        equipk11 = {}
        equipsop = {}
        # skip creating split datasets until the end as we need to do it 3 times for the different dps units
        # slowly create the setup name as we go through each possible filter
        for fairy in FAIRIES.List():
            fairyFiltered = chipFiltered[chipFiltered.fairy.str.contains(fairy)]
            fairyText = fairy + " "
            # only continue if both filtered datasets have remaining rows
            if fairyFiltered.shape[0] > 0:
                # filter speed next
                for i in [0, 1]:
                    speedFiltered = fairyFiltered[(fairyFiltered.speed == 4) != i]
                    if i:
                        speedText = "max speed " 
                    else: 
                        speedText = "min speed "
                    # filter hg presence next
                    if speedFiltered.shape[0] > 0:
                        for j in [0, 1]:
                            hgFiltered = speedFiltered[speedFiltered.has_HG == j]
                            if j:
                                hgText = "Jill " 
                            else: 
                                hgText = "only "
                            if hgFiltered.shape[0] > 0:
                                for tank in TANKS.List():
                                    tankFiltered = hgFiltered[hgFiltered.tank.str.contains(tank)]
                                    tankText = tank + " "
                                    # filter armor next
                                    if tankFiltered.shape[0] > 0:
                                        for k in [0,1]:
                                            armorFiltered = tankFiltered[tankFiltered.has_armor == k]
                                            armorText = ""
                                            if tank == TANKS.M16:
                                                if k:
                                                    armorText = "SPEQ+Armor " 
                                                else: 
                                                    armorText = "SPEQ+T-Exo "
                                            if armorFiltered.shape[0] > 0:
                                                for l in [0,1]:
                                                    formationFiltered = armorFiltered[(armorFiltered.formation == FORMATIONS.FORMATION_B) == l]
                                                    if l:
                                                        formationText = "b-Formation " 
                                                    else: 
                                                        formationText = "0-2-Formation "
                                                    if formationFiltered.shape[0] > 0:
                                                        dpsList = formationFiltered.DPS.unique()
                                                        baseData = getDPSData(formationFiltered)
                                                        data416vfl = []
                                                        data416speq = []
                                                        datak11vfl = []
                                                        datak11eot = []
                                                        datasopvfl = []
                                                        datasopeot = []
                                                        for index, d in enumerate(dpsList):
                                                            if CARRY.HK416 in d: 
                                                                if "speq" in d:
                                                                    data416speq = baseData[index * 2]
                                                                elif "vfl" in d:
                                                                    data416vfl = baseData[index * 2]
                                                                else:
                                                                    print(d)
                                                                    print("does not match speq or vfl")
                                                            elif CARRY.K11 in d:
                                                                if "eot" in d:
                                                                    datak11eot = baseData[index * 2]
                                                                elif "vfl" in d:
                                                                    datak11vfl = baseData[index * 2]
                                                                else:
                                                                    print(d)
                                                                    print("does not match eot or vfl")
                                                            elif CARRY.SOP in d:
                                                                if "eot" in d:
                                                                    datasopeot = baseData[index * 2]
                                                                elif "vfl" in d:
                                                                    datasopvfl = baseData[index * 2]
                                                                else:
                                                                    print(d)
                                                                    print("does not match eot or vfl")
                                                        # assemble the text given to the setup name for the table
                                                        finalText = tankText + armorText + fairyText + hgText + formationText + speedText
                                                        print("Testing %s" % finalText)
                                                        # only create empty objects for dps with a vfl-eot pair
                                                        if len(data416speq) > 0 and len(data416vfl) > 0:
                                                            equip416[finalText] = {}
                                                        if len(datak11eot) > 0 and len(datak11vfl) > 0:
                                                            equipk11[finalText] = {}
                                                        if len(datasopeot) > 0 and len(datasopvfl) > 0:
                                                            equipsop[finalText] = {}
                                                        # get the p-values of the setup for each dps and for each test statistic type
                                                        for testMode in TESTMODES.List():
                                                            if len(data416speq) > 0 and len(data416vfl) > 0:
                                                                equip416[finalText][testMode] = compareSpecificDPS(data416vfl, data416speq, testMode)
                                                            if len(datak11eot) > 0 and len(datak11vfl) > 0:
                                                                equipk11[finalText][testMode] = compareSpecificDPS(datak11vfl, datak11eot, testMode)
                                                            if len(datasopeot) > 0 and len(datasopvfl) > 0:
                                                                equipsop[finalText][testMode] = compareSpecificDPS(datasopvfl, datasopeot, testMode)

        return [equip416, equipk11, equipsop]
    elif compare == COMPARISONS.UZI:
        uzi = chipFiltered[chipFiltered.DPS.str.contains(CARRY.UZI)]
        sl8 = uzi[uzi.DPS.str.contains("8/8")]
        sl9 = uzi[uzi.DPS.str.contains("9/8")]
        # slowly create the setup name as we go through each possible filter
        for fairy in FAIRIES.List():
            fairyFilteredsl8 = sl8[sl8.fairy.str.contains(fairy)]
            fairyFilteredsl9 = sl9[sl9.fairy.str.contains(fairy)]
            fairyText = fairy + " "
            # only continue if both filtered datasets have remaining rows
            if fairyFilteredsl8.shape[0] > 0 and fairyFilteredsl9.shape[0] > 0:
                # filter speed next
                for i in [0, 1]:
                    speedFilteredsl8 = fairyFilteredsl8[(fairyFilteredsl8.speed == 4) != i]
                    speedFilteredsl9 = fairyFilteredsl9[(fairyFilteredsl9.speed == 4) != i]
                    if i:
                        speedText = "max speed " 
                    else:
                        speedText = "min speed "
                    # filter hg presence next
                    if speedFilteredsl8.shape[0] > 0 and speedFilteredsl9.shape[0] > 0:
                        for j in [0,1]:
                            hgFilteredsl8 = speedFilteredsl8[speedFilteredsl8.has_HG == j]
                            hgFilteredsl9 = speedFilteredsl9[speedFilteredsl9.has_HG == j]
                            if j:
                                hgText = "Jill " 
                            else:
                                hgText = "only "
                            if hgFilteredsl8.shape[0] > 0 and hgFilteredsl9.shape[0] > 0:
                                for tank in TANKS.List():
                                    tankFilteredsl8 = hgFilteredsl8[hgFilteredsl8.tank.str.contains(tank)]
                                    tankFilteredsl9 = hgFilteredsl9[hgFilteredsl9.tank.str.contains(tank)]
                                    tankText = tank + " "
                                    # filter armor next
                                    if tankFilteredsl8.shape[0] > 0 and tankFilteredsl9.shape[0] > 0:
                                        for k in [0,1]:
                                            armorFilteredsl8 = tankFilteredsl8[tankFilteredsl8.has_armor == k]
                                            armorFilteredsl9 = tankFilteredsl9[tankFilteredsl9.has_armor == k]
                                            armorText = ""
                                            if tank == TANKS.M16:
                                                if k:
                                                    armorText = "SPEQ+Armor " 
                                                else:
                                                    armorText = "SPEQ+T-Exo "
                                            if armorFilteredsl8.shape[0] > 0 and armorFilteredsl9.shape[0] > 0:
                                                for l in [0,1]:
                                                    formationFilteredsl8 = armorFilteredsl8[(armorFilteredsl8.formation == FORMATIONS.FORMATION_B) == l]
                                                    formationFilteredsl9 = armorFilteredsl9[(armorFilteredsl9.formation == FORMATIONS.FORMATION_B) == l]
                                                    if l:
                                                        formationText = "b-Formation " 
                                                    else: 
                                                        formationText = "0-2-Formation "
                                                    if formationFilteredsl8.shape[0] > 0 and formationFilteredsl9.shape[0] > 0:
                                                        sl8Data = list(formationFilteredsl8.damage)
                                                        sl9Data = list(formationFilteredsl9.damage)
                                                        # assemble the text given to the setup name for the table
                                                        finalText = tankText + armorText + fairyText + hgText + formationText + speedText
                                                        res[finalText] = {}
                                                        print("Testing %s" % finalText)
                                                        # get the p-values of the setup for each dps and for each test statistic type
                                                        for mode in TESTMODES.List():
                                                            res[finalText][mode] = compareSpecificDPS(sl8Data, sl9Data, mode)
        return res
    else:
        print(compare + "does not exist")
# since converting the data to a form that can be turned into a dataframe is repeated multiple times
def addModeRow(testMode, dpsName, value, meanArr, sdevArr, ksArr, arrIndex):
    if testMode == TESTMODES.MEAN:
        meanArr[arrIndex][dpsName] = value
    elif testMode == TESTMODES.STDDEV:
        sdevArr[arrIndex][dpsName] = value
    elif testMode == TESTMODES.KSTEST:
        ksArr[arrIndex][dpsName] = value
# create table given column names/headers, dataframe with data, and p-value to color code cells that fall under the critical region
def createSubtable(dpsHeaders, df, pVal, isTwoTailed = True):
    # function to get the resulting colors of each cell in a column
    def getCellColor(colName, colSeries):
        # if not a numeric column, just set everything to beige
        if colName == 'setup':
            return ["beige" for x in colSeries]
        # initialize array with default as beige
        res = ["beige" for x in colSeries]
        # go through each element in the series and replace the color if in a critical region
        for index, value in enumerate(colSeries):
            if value < pVal:
                res[index] = "green"
            elif value > 1 - pVal and isTwoTailed:
                res[index] = "aqua"
        return res
    
    return go.Table(
            columnwidth = [350, 200],
            header=dict(
                values=dpsHeaders,
                line_color='black',
                fill_color='beige',
                align='center',
                font=dict(color='black', size=12)
            ),
            cells=dict(
                values=[df[col] for col in df.columns],
                line_color='black',
                fill_color=[getCellColor(col, df[col]) for col in df.columns],
                align="center", 
                font=dict(color='black', size=11)
            )
        )
# create table of p-values from the permutation test results, if dpsName is provided considers that the dict is 1 layer smaller
def createPTable(data, pVal, title, dpsName = None):
    # separate arrays for mean, standard deviation, and ks test
    dpsHeaders = ["setup"]
    if dpsName:
        dpsHeaders.append(dpsName)
    meanSetups = [{} for i in range(len(data))]
    sdevSetups = [{} for i in range(len(data))]
    ksSetups = [{} for i in range(len(data))]
    for index, setup in enumerate(data.items()):
        meanSetups[index]["setup"] = setup[0]
        sdevSetups[index]["setup"] = setup[0]
        ksSetups[index]["setup"] = setup[0]
        for type in setup[1].items():
            if dpsName is None:
                for doll in type[1].items():
                    # if dps is not yet present in table headers, add it
                    if doll[0] not in dpsHeaders:
                        dpsHeaders.append(doll[0])
                    addModeRow(type[0], doll[0], doll[1], meanSetups, sdevSetups, ksSetups, index)
            else:
                addModeRow(type[0], dpsName, type[1], meanSetups, sdevSetups, ksSetups, index)

    # convert setup lists of  into dataframes
    meandf = pd.DataFrame(meanSetups)
    sdevdf = pd.DataFrame(sdevSetups)
    ksdf = pd.DataFrame(ksSetups)
    # create the table plots
    fig = make_subplots(3, 1, 
                    subplot_titles=["Left Side p-values of Mean", "Left Side p-values of Standard Deviation", "Right Side p-values of KS Test"], 
                    specs=[[{"type" : "table"}] for x in range(3)])
    fig.update_layout(title_text=title, paper_bgcolor= "beige", margin=dict(t=0,b=20,l=20,r=20))
    fig.add_trace(createSubtable(dpsHeaders, meandf, pVal), row=1, col=1)
    fig.add_trace(createSubtable(dpsHeaders, sdevdf, pVal), row=2, col=1)
    fig.add_trace(createSubtable(dpsHeaders, ksdf, pVal, False), row=3, col=1)
    # return as html string to be saved into file and loaded when needed
    return plot(fig, output_type="div")

def createEquipPTable(data416, datak11, datasop, title):
    # separate arrays for mean, standard deviation, and ks test
    dpsHeaders = ["setup", "416 vfl-speq", "k11 vfl-eot", "sopmod vfl-eot"]
    meanSetups = [{} for i in range(len(data416))]
    sdevSetups = [{} for i in range(len(data416))]
    ksSetups = [{} for i in range(len(data416))]
    for index, setup in enumerate(data416.items()):
        meanSetups[index]["setup"] = setup[0]
        sdevSetups[index]["setup"] = setup[0]
        ksSetups[index]["setup"] = setup[0]
        for type in setup[1].items():
            addModeRow(type[0], dpsHeaders[1], type[1], meanSetups, sdevSetups, ksSetups, index)

    for index, setup in enumerate(datak11.items()):
        for type in setup[1].items():
            addModeRow(type[0], dpsHeaders[2], type[1], meanSetups, sdevSetups, ksSetups, index)
                    
    for index, setup in enumerate(datasop.items()):
        for type in setup[1].items():
            addModeRow(type[0], dpsHeaders[3], type[1], meanSetups, sdevSetups, ksSetups, index)
    
    # convert setup lists of  into dataframes
    meandf = pd.DataFrame(meanSetups)
    sdevdf = pd.DataFrame(sdevSetups)
    ksdf = pd.DataFrame(ksSetups)
    # create the table plots
    fig = make_subplots(3, 1, 
                    subplot_titles=["Left Side p-values of Mean", "Left Side p-values of Standard Deviation", "Right Side p-values of KS Test"], 
                    specs=[[{"type" : "table"}] for x in range(3)])
    fig.update_layout(title_text=title, paper_bgcolor= "beige", margin=dict(t=0,l=20,r=20,b=20))
    fig.add_trace(createSubtable(dpsHeaders, meandf, 0.1), row=1, col=1)
    fig.add_trace(createSubtable(dpsHeaders, sdevdf, 0.1), row=2, col=1)
    fig.add_trace(createSubtable(dpsHeaders, ksdf, 0.1, False), row=3, col=1)
    # return as html string to be saved into file and loaded when needed
    return plot(fig, output_type="div")
# turns the django model into a pandas dataframe
def modelToDF(model):
    dragData = [
        {
            'formation' : x.formation,
            'fairy' : x.fairy,
            'speed' : x.speed,
            'has_HG' : x.has_HG,
            'tank' : x.tank,
            'has_armor' : x.has_armor,
            # some uzi entries start capitalized so standardize the strings
            'DPS' : x.DPS.lower(),
            'has_chip' : x.has_chip,
            'damage': x.damage,
            'perc_damage' : x.Perc_Damage(),
            'total_repair_cost' : x.Total_Repair()
        } for x in model
    ]
    return pd.DataFrame(dragData)
# turn dataframe into a table and adjust the cell height to keep constant when some values need two lines
def getDFTable(df, tableHeight):
    fig = go.Figure(data=[go.Table(
            header=dict(
                values=df.columns,
                line_color='black',
                fill_color='beige',
                align='center',
                font=dict(color='black', size=12)
            ),
            cells=dict(
                values=[df[col] for col in df.columns],
                line_color='black',
                fill_color="beige",
                align="center", 
                font=dict(color='black', size=11),
                height=45
            )
        )])
    fig.update_layout(paper_bgcolor="beige", height = tableHeight, margin=dict(t=0,b=20,r=20,l=20))
    return plot(fig, output_type="div")
# Create your views here.
def index(request):
    pageTitle = createPageTitle("Index")
    connectedPages = getPageLinks(request)
    # show the entire table
    setups = Setup.objects.all()
    df = modelToDF(setups)
    tablePlot = getDFTable(df, 520)

    return render(request, "dataHandling/index.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages, "plotDiv" : tablePlot})

def deleteData(request):
    pageTitle = createPageTitle("Delete Data")
    connectedPages = getPageLinks(request)
    # show the entire table
    setups = Setup.objects.all()

    return render(request, "dataHandling/deleteData.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages, "setups" : setups})

def newData(request):
    pageTitle = createPageTitle("Add New Data")
    connectedPages = getPageLinks(request)

    return render(request, "dataHandling/newData.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages})

def addData(request):
    postData = request.POST
    # get max hp from tank input
    maxHP = 605 if postData['tank'] == "M16" else 1210
    # all the input should be valid except for damage which we will need an additional check if it falls within the max hp of the tank
    setupData = Setup(
        formation = postData['formation'],
        fairy =     postData['fairy'],
        speed =     int(postData['speed']),
        has_HG =    'has_HG' in postData,
        tank =      postData['tank'],
        has_armor = 'has_armor' in postData,
        DPS =       postData['DPS'],
        has_chip =  'has_chip' in postData,
        max_HP =    maxHP,
        # cap damage based on max hp regardless of user input
        damage =    min(int(postData['damage']), maxHP)
    )
    # add the data into the model
    setupData.save()
    # return to index page after submitting form to see updated table
    return HttpResponseRedirect(reverse("dataHandling:Index"))

def removeData(request):
    # get the rows to be removed
    postData = request.POST
    indices = []
    # the selected rows are given by the present key names of row[number]
    for key in postData.keys():
        if re.search("row\d+", key):
            # cut off the row portion of the string and turn into an integer to use for indexing, row names start with 1 so subtract by 1
            indices.append(int(key[3:]) - 1)

    # get all the chosen rows by index
    data = Setup.objects.all()
    chosenData = []
    for i in indices:
        chosenData.append(data[i])
    # delete the rows
    for row in chosenData:
        row.delete()
    # return to index page after submitting form to see updated table
    return HttpResponseRedirect(reverse("dataHandling:Index"))

def loadCSV(request):
    pageTitle = createPageTitle("Initialize with CSV")
    connectedPages = getPageLinks(request)
    # If POST request, that indicates that the load csv button was clicked and thus load it and refresh the page
    if request.method == "POST":
        # use pandas to load the csv
        df = pd.read_csv("12-4E_Dragger_Data.csv")
        # add an entry into our model for each row in the dataframe
        for index, row in df.iterrows():
            setupData = Setup(
                formation = row['formation'],
                fairy =     row['fairy'],
                speed =     row['speed'],
                has_HG =    row['has_HG'],
                tank =      row['tank'],
                has_armor = row['has_armor'],
                DPS =       row['DPS'],
                has_chip =  row['has_chip'],
                max_HP =    row['max_HP'],
                damage =    row['damage']
            )
            # add the data into the model
            setupData.save()
        # return to index page after submitting form to see updated table
        return HttpResponseRedirect(reverse("dataHandling:Index"))

    # show the first 50 rows if available
    setups = Setup.objects.all()[:50]
    df = modelToDF(setups)
    tablePlot = getDFTable(df, 300)

    return render(request, "dataHandling/loadCSV.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages, "plotDiv" : tablePlot})

def permutationPage(request):
    pageTitle = createPageTitle("Perform Permutation Tests")
    connectedPages = getPageLinks(request)
    

    return render(request, "dataHandling/permutationTests.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages, 
                                                                  "comparisons" : COMPARISONS.List()})

def writePermutationResults(request):
    # get the entire table
    setups = Setup.objects.all()
    # filter based on the chosen comparison
    # get the comparison input
    if 'Comparison' in request.POST:
        currComparison = request.POST['Comparison']
    else:
        currComparison = COMPARISONS.EXO_ARMOR
    
    # turn the django model into a pandas dataframe
    df = modelToDF(setups)
    # pre-roll the random numbers because we will be resetting the seed with each setup before starting the permutation tests
    # they also only get rolled a maximum of 59 times (when permuting between two 30-sample datasets minus the last) each permutation sample
    rngRolls = np.empty(NUMPERMUTATIONS * 59)
    # set the seed to make results reproduceable
    Random.setSeed(12345)
    for i in range(rngRolls.size):
        rngRolls[i] = Random.getRand()
    PermutationTester.setRandomRolls(rngRolls)
    # perform permutation tests and get the data
    pVals = getComparisonData(df, currComparison)
    # create the html strings for creating the plots
    if currComparison == COMPARISONS.EXO_ARMOR:
        tablePlot = createPTable(pVals, 0.05, "T-exo (low left-side p-value) vs Armor (high left-side p-value)")
    elif currComparison in [COMPARISONS.CHIPPED_FORMATION, COMPARISONS.CHIPLESS_FORMATION]:
        tablePlot = createPTable(pVals, 0.05, "b-formation (low left-side p-value) vs 0-2-formation (high left-side p-value)")
    elif currComparison in [COMPARISONS.CHIPLESS_SPEED, COMPARISONS.CHIPPED_SPEED]:
        tablePlot = createPTable(pVals, 0.05, "min speed (low left-side p-value) vs max speed (high left-side p-value)")
    elif currComparison == COMPARISONS.UZI:
        tablePlot = createPTable(pVals, 0.01, "SL8/8 (low left-side p-value) vs SL9/8 Uzi (high left-side p-value)", CARRY.UZI)
    elif currComparison == COMPARISONS.TANK:
        tablePlot = createPTable(pVals, 0.01, "SG (low left-side p-value) vs T-exo M16 (high left-side p-value)")
    elif currComparison == COMPARISONS.EQUIP:
        tablePlot = createEquipPTable(pVals[0], pVals[1], pVals[2], "VFL (low left-side p-value) vs EOT/SPEQ (high left-side p-value)")
    # store the strings as a file so that we do not need to spend time computing them again on the spot
    try:
        open(currComparison + ".txt", "x")
    except:
        print("file already exists")
    finally:
        with open(currComparison + ".txt", "w", encoding="utf-8") as f:
            f.write(tablePlot)
    
    return HttpResponseRedirect(reverse("dataHandling:Permutation Tests"))