from django.shortcuts import render
from plotly.offline import plot
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np

from .models import Setup
# constants used in functions below
PAGELINKS = [["../introduction", "Introduction"],["../gameBasics", "Game Basics"], ["../summary", "Summary"], ["../viewData", "View Raw Data"],
             ["../viewCharts", "View Charts"], ["../permutationTests", "Permutation Tests"]]
from .constants import PROJECTTITLE, NAMEDSETUPS, FORMATIONS, FAIRIES, TANKS, CARRY, COMPARISONS
SPEEDOPTIONS = ["min speed", "max speed"]

# create dict used for button links to other pages from an array of key-value pair arrays
def createPageDetails(arr):
    pageDetails = [{} for i in range(len(arr))]
    for index, page in enumerate(arr):
        pageDetails[index]["url"] = page[0]
        pageDetails[index]["name"] = page[1]
    return pageDetails
# get the dict containing the details for the pages other than the current page
def getPageLinks(pageRequest):
    # convert the http request into the current url
    currPage = "../" + pageRequest.path_info.split("/")[-2]
    # get a copy of all page url and names from the constant except for the current page
    pages = []
    for i in range(len(PAGELINKS)):
        if currPage != PAGELINKS[i][0]:
            pages.append(PAGELINKS[i])
    # return, as the result, the dict of the remaining page url and names
    return createPageDetails(pages)
# create page title by combining project title with page name
def createPageTitle(pageName):
    return  PROJECTTITLE + ": " + pageName
# create filter function based on input array
def createFilter(formation=None, fairy=None, is_min_speed=None, has_HG=None, tank=None, has_armor=None, DPS=None, has_chip=None):
    def newFilter(querySet):
        if formation is not None:
            querySet = querySet.filter(formation=formation)
        if fairy is not None:
            querySet = querySet.filter(fairy__contains=fairy)
        if is_min_speed is not None:
            if is_min_speed:
                querySet = querySet.filter(speed=4)
            else:
                querySet = querySet.filter(speed__gt=4)
        if has_HG is not None:
                querySet = querySet.filter(has_HG=has_HG)
        if tank is not None:
            querySet = querySet.filter(tank=tank)
        if has_armor is not None:
            querySet = querySet.filter(has_armor=has_armor)
        if DPS is not None:
            querySet = querySet.filter(DPS__contains=DPS)
        if has_chip is not None:
            querySet = querySet.filter(has_chip=has_chip)

        return querySet
    
    return newFilter
# filter the queryset based on preset filter name
def filterRows(querySet, filtername):
    if filtername == NAMEDSETUPS[0]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.RESCUE, 1, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[1]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.RESCUE, 0, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[2]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.MORTAR, 1, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[3]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.MORTAR, 0, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[4]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.RESCUE, 1, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[5]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.RESCUE, 0, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[6]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.BEACH, 1, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[7]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.BEACH, 0, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[8]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.BEACH, 1, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[9]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.BEACH, 0, 1, TANKS.M16, 1, None, 1)
    elif filtername == NAMEDSETUPS[10]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.RESCUE, 1, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[11]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.ARMOR, 1, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[12]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.MORTAR, 1, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[13]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.RESCUE, 1, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[14]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.ARMOR, 1, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[15]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.MORTAR, 1, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[16]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.RESCUE, 1, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[17]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.MORTAR, 1, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[18]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.RESCUE, 1, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[19]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.MORTAR, 1, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[20]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.BEACH, 1, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[21]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.BEACH, 1, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[22]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.BEACH, 1, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[23]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.BEACH, 1, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[24]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.BEACH, 1, 0, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[25]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.BEACH, 1, 0, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[26]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.RESCUE, 0, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[27]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.BEACH, 0, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[28]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.RESCUE, 0, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[29]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.RESCUE, 0, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[30]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.RESCUE, 0, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[31]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.BEACH, 0, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[32]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.MORTAR, 0, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[33]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.MORTAR, 0, 1, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[34]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.BEACH, 0, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[35]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.BEACH, 0, 1, TANKS.M16, 0, None, 0)
    elif filtername == NAMEDSETUPS[36]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.BEACH, 0, 0, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[37]:
        newFilter = createFilter(FORMATIONS.FORMATION_02, FAIRIES.BEACH, 0, 0, TANKS.SUPERSHORTY, 1, None, 0)
    elif filtername == NAMEDSETUPS[38]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.RESCUE, 1, 1, TANKS.M16, 1, None, 0)
    elif filtername == NAMEDSETUPS[39]:
        newFilter = createFilter(FORMATIONS.FORMATION_B, FAIRIES.BEACH, 1, 1, TANKS.M16, 1, None, 0)

    return newFilter(querySet)
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
    fig.update_layout(paper_bgcolor="beige", height = tableHeight, margin=dict(t=20,b=20,r=20,l=20))
    return plot(fig, output_type="div")
# Create your views here.
def introduction(request):
    pageTitle = createPageTitle("Introduction")
    connectedPages = getPageLinks(request)
    paragraphs = ["<i>Note: This is ported over from JavaScript from <a href=\"https://cosmicarcher.github.io/12-4E_drag_analysis/\">my github" +
                  " project</a></i>",
                "<b>Disclaimer: The 3.02 update has rendered the value of this analysis obsolete</b> as the tank will be fully repaired for " +
                "free as long as the damage taken does not bring them to critical HP at 5% HP left before clearing the map.",
                "12-4e is the best place to efficiently level dolls while getting the cores to link them as of the time of writing this. This " +
                "is meant to visualize how different setups(tiles/fairy aura/equipment) perform against each other. For the low buff setups, " +
                "this will show how badly the runs will get if you do not meet the recommended fp buffs from other guides",
                "If you have any questions, contact me on discord CosmicArcher#3214",
                "Note: Every setup has its own tab for comparing different DPS in the same setup and at different speeds",
                "Note2: Jill tiles are 40% fp 40% acc for newer players that don't know",
                "Note3: Unless stated in the name of the sheet, the data is before chips became available and I will assume that it is known " +
                "that chips reduce the effectiveness of VFLs so I will not test those nor repeat why they are not tested."]
    return render(request, "Findings/pureText.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages, "paragraphs" : paragraphs})

def basics(request):
    pageTitle = createPageTitle("Game Basics")
    connectedPages = getPageLinks(request)
    paragraphs = ["<h3>Information About The Game</h3>",
                    "<li>Girls Frontline, in the Japanese version it is named Dolls Frontline for copyright reasons, is a mobile turn-based " +
                    "strategy game where the player fields teams of 5 android \"dolls\" and a supportive drone called a \"fairy\" to move " +
                    "around a node-based map, capturing territory, engaging in combat, and accomplishing objectives along the way.</li>",
                    "<li>New dolls need to be leveled up to be strong enough to use in end-game content and with the need for multiple teams " +
                    "in such content, the supply of consumable experience or XP items is not enough to level up the amount of dolls newer " +
                    "players need to tackle them. This is where earning XP through combat comes in, there is no limit to how often one can " +
                    "enter combat and thus XP can be \"farmed\" constantly through this if the player is willing to put in the time. A set " +
                    "amount of resources are consumed each instance of combat which creates a need for optimizing consumption and this is done " +
                    "via what the english speaking community calls \"corpse dragging\" where we make use of the game mechanics to only " +
                    "\"activate\" one doll to win the combat all by itself. This doll is referred to as the \"DPS\" and because the enemy will " +
                    "shoot back, a doll dedicated to absorbing the damage for the rest of the team or \"tank\" is also necessary, the tank does " +
                    "not need to be activated to absorb the damage but it does need to be placed at the front of the \"formation\" so that it " +
                    "is prioritized by the enemy attacks. The two formations tested are b-formation which is shaped like a b and 0-2-formation " +
                    "which is the formation used for farming a different map called 0-2. The difference between them is that the tank is " +
                    "placed further forward which increases the shared range of the team and affects the overall \"shape\" of the enemy team. " +
                    "The former matters for one of the DPS dolls as they target randomly within range while the latter matters for all DPS " +
                    "because their primary damage is through an attack that does damage in a circular area so the more compact shape is " +
                    "preferred.</li>",
                    "<li>The DPS units are chosen because they possess different characteristics which set them apart from each other. Dolls " +
                    "can have different sets of equipment and those are written next to their names if applicable. VFL increases critical hit " +
                    "rate which increases damage of normal attacks; EOT increases firepower which affects the damage of all attacks and " +
                    "skills; SPEQ is shorthand for special equipment which is unique to the doll, in this case the doll \"416\"'s SPEQ is a " +
                    "hybrid that is mid-way of both VFL and EOT. The one or two numbers beside the doll's name is the level of their skills, " +
                    "non-modded dolls only have one skill whereas modded dolls have two skills. The tanks are \"M16\" and \"Super Shorty\" " +
                    "where M16 has lower hitpoints or HP, where HP reaching 0 results in the \"death\" of the doll which can cause the entire " +
                    "combat to fail, but the ability to choose between armor or exoskeleton equipment, the former reduces the damage taken and " +
                    "the latter increases the chance of \"dodging\" an attack, nullifying it entirely. Super Shorty can only use armor but has " +
                    "much higher HP and one of the resources we are optimizing for is \"repair cost\" which is proportional to damage taken so " +
                    "a comparison of tanks is necessary.</li>",
                    "<li>There are ways to enhance or \"buff\" the performance of the DPS and tanks, one of which is the fairy and there are a " +
                    "multitude of them each with their own set of stat increases to the entire team just by existing, and the other is through " +
                    "the use of \"HG\" dolls who are an archetype that is capable of increasing the stats of other dolls just by existing, " +
                    "without the need to activate them. The fairies chosen are \"Rescue\" which can be activated to increase the rate of " +
                    "obtaining a special resource needed for intermediatesteps in the leveling process of dolls; \"Mortar\" which provides " +
                    "the strongest increase to the firepower stat; \"Armor\" which provides the strongest increase to the armor stat which only " +
                    "matters to M16 with an exoskeleton as using armor equipment or using Super Shorty provides enough armor that increasing " +
                    "it further has no effect on damage taken; and \"Beach\" which is representative for \"any low-leveled fairy\" as those " +
                    "have only small stat increases. The star* rating and text to the left of the fairy name is their \"talent\", dmg and " +
                    "fervor increase the team's firepower stat; armor increases the armor stat; and cool is purely cosmetic with no buffs. " +
                    "A term that might come up is \"icd\" which stands for initial cooldown, this is because the special attacks called " +
                    "skills are not available at the start of combat and must wait a certain amount of seconds to become available to us.</li>"]
    return render(request, "Findings/pureText.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages, "paragraphs" : paragraphs})

def summary(request):
    pageTitle = createPageTitle("Summary")
    connectedPages = getPageLinks(request)
    paragraphs = ["<h3>General Findings</h3>",
                "<h4>M16: SPEQ + Armor or T-exo?</h4>",
                "<b>Armor is generally better than T-exo</b> because it gives you enough armor to take only 1 damage from vespids instead of " +
                "risking taking more damage just so you can dodge more.",
                "<h4>SG or M16 tank?</h4>",
                "<i>The main data for M16 is with exo on</i> as being able to equip armor is a recent change. The SG used is Super Shorty since " +
                "she has the highest evasion stat of all SGs. <b>To even out the difference in max HPs of the two tanks, combined resource cost " +
                "(mp + parts x 3) when repairing is used for comparison. Compared to M16 with exo, generally M16 still does better except for " +
                "low-buff and non-ideal formation and movespeed combinations with 416 and K11</b> because that lets vespids shoot more which " +
                "are the main threat to M16 with exo doing more than 1 damage per hit, despite sopmod potentially getting M16 into critical " +
                "from full HP in those low-performance scenarios, <b>ARs being cheaper to repair still made M16 better than SGs for sop. " +
                "Compared to M16 with armor, M16 is cheaper overall</b> since extra armor covers the vespid weakness which makes 416 with " +
                "VFL on 2* beach being the only one that still has a higher repair cost for M16 than with SGs but that is worse than using " +
                "her with SPEQ anyway. In our permutation tests, only sopmod and two of 416's setups are found to be statistically significant " +
                "in favor of m16. The rest lack enough evidence to reject the null hypothesis, some even reject the null hypothesis with " +
                "evidence suggesting that SG is cheaper, particularly in low-buff scenarios which is interesting as we expect more damage " +
                "taken per run there yet it ends up cheaper according to our permutation tests.",
                "<h4>Uzi mod allowable speeds and formation</h4>",
                "Due to the increased FP and capped RoF from chips, Uzi can deal with the dinergates in the first fight fast enough that there " +
                "is no risk of her targeting an enemy before all dinergates are dead. But if your FP buffs from fairy and tiles are so low " +
                "that Uzi cannot kill a dinergate in 2 hits, you will have to go at 6 movespeed in 0-2 formation at max. Without a chip " +
                "equipped, do not attempt any 10 speed or 0-2 formation as the dinergates will cause massive damage more often than not which " +
                "is incredibly risky for a farm stage.",
                "<h3>Chipped Data Findings</h3>",
                "<h4>Which formation: b-formation or 0-2-formation?</h4>",
                "With all the draggers that benefit from chips (416, K11, and Uzi since Sop does not have an exo slot to use them), <b>b-" +
                "formation is found to be better than 0-2-formation in our tested cases</b>. Although, a minimal buff scenario (no HG tiles) " +
                "has not been tested and we failed to establish if some of the results are statistically significant, mostly with regards to " +
                "Uzi as she has the largest variance.",
                "<h4>Echelon Speed: As slow(4 movespeed, bringing MG or caped RF) as possible or as fast (6 for SG or 10 if M16) as possible?</h4>",
                "<b>For 416 and K11, going at 4 movespeed is better in all scenarios while for Uzi we cannot find a generalization that " +
                "satisfies our observations.</b> One thing to note is that for k11, we only managed to establish 3 out of 5 setups having " +
                "statistically significant results and uzi has a more spread out distribution of p-values.",
                "<h4>Uzi skill 1, is sl9 a lot better than sl8?</h4>",
                "For those unaware, sl9 duration increase pushes it over the threshold that it also gets 1 extra tick of her modskill " +
                "alongside the regular burn. It does seem to be very impactful with an average around 25% less HP lost in lower buff setups " +
                "which is the important one. Higher buff setups like using 5* Rescue fairy has it also performing better but interestingly " +
                "only to a similar level with 4 speed b-formation, the maximum time until targets are in range while other speeds and " +
                "formations result in it only being a slight performance increase. With 5* Mortar fairy the reverse was observed, 4 speed " +
                "barely saw a performance increase while 10 speed had a massive increase of an average of 50% less HP lost. <b>A key point " +
                "to be aware of is that all of the setups were only done 10-15 times each and most saw a similar range of HP lost in a run " +
                "compared to the sl8 runs so it is possible that the sl9 average is not that much better because of the massive variance of " +
                "both sets especially considering that we failed to reject the null hypothesis that there is not a noticeable effect in " +
                "performance for all but beach fairy with min speed in 0-2 formation</b>. With more runs to collect data on them to iron out " +
                "the massive variance uzi mod has, (because most of her damage relies on hitting enemies with the molotov while the AR " +
                "draggers are fine cleaning up with regular shots since their accuracy and firepower is much higher than SMGs) we should " +
                "observe either the mean to increase in the end or we see only a slight performance increase and all of the current data was " +
                "actually the product of lucky runs and with our KS test results, only three setups hint that it might not be the case.",
                "<h3>Chipless Data Findings</h3>",
                "<h4>Which formation: b-formation or 0-2-formation?</h4>",
                "<li><b>For Chipless 416 mod2 sl10/8, 0-2 formation is only considered in some low-buff scenarios</b> since it enables the nade," +
                " your main damage as low-buffs make bullets take too long killing mobs, to catch as many enemies as possible without taking " +
                "unnecessary extra damage. But when performing permutation tests, we found that having Jill with SG tank preferred b-formation." +
                " When b-formation is better, it averages around 30% less HP loss compared to 0-2 but when the reverse is true, it averages " +
                "15% less HP lost but most of the low-buff setups were not found to be statistically significant particularly with vfl.<li>",
                "<li><b>For Chipless K11 sl10 with EOT, 0-2 formation is better as long as team movespeed is 4</b>(MG or caped RF in team) " +
                "regardless of buffs with the same logic as above. <b>With VFL, 0-2 formation is only better in low-buff, slow movespeed</b> " +
                "scenarios. When b-formation is better, it averages around 20% less HP loss compared to 0-2 but when the reverse is true, " +
                "it averages 35% less HP lost but with EOT, it can be as high as 55% less HP lost. In our permutation tests, our findings " +
                "for EOT are statistically significant for most of min speed but only for two from max speed. For VFL, only three setups are " +
                "on the extremes of our p-values so we need more data for VFL runs.",
                "<li><b>For Sopmod3 sl8/8, b-formation is superior</b> in all tested situations with an average of 25% less HP lost because " +
                "unlike 416 and k11, she has an 8s icd so engaging sooner does not increase the amount of mobs that can be affected by her " +
                "nade. Note that some of our results are not found to be statistically significant so we might want to add more samples to " +
                "better distinguish if one is better than the other or if they are \"equal\"."
                "<li><b>For Chipless Uzimod, due to the dinergates in the 1st fight, she does not want to be in 0-2 formation</b> as it can " +
                "cause her to ignore 1 of the dinergates and attack the mobs in the back due to SMGs' random targeting as opposed to ARs' " +
                "frontmost targeting which can potentially cause hundreds of hp loss to the tank.",
                "<h4>Echelon Speed: As slow(4 movespeed, bringing MG or caped RF) as possible or as fast (6 for SG or 10 if M16) as possible?</h4>",
                "<li><b>For Chipless 416 mod2 sl10/8, being at 4 movespeed is superior in <i>almost</i> all scenarios</b> tested with an " +
                "average of 20% less HP lost. The only tested scenario where being as fast as possible did better was with the <i>M16 exo with " +
                "a 2* fairy and Jill as the only buffer b-formation</i> with 25% less HP lost compared to being slower likely because the main " +
                "threat with exo m16 are the vespids which you want to hit as many of with the nade which moving faster allows for b-formation " +
                "<b>but these results were not found to be statistically significant so it may change with more samples</b>. Unfortunately we " +
                "were not able to establish statistical significance in most of the setups.",
                "<li><b>For Chipless K11 sl10 with VFL prefers moving faster only in low-buff situations in b-formation</b> since she needs " +
                "her nade to hit as many mobs as possible as low-buffs affect bullet kill speeds. <b>With EOT moving faster is better in all " +
                "b-formation battles</b> with the same reasoning as above. When moving slower is better it averages at 20% less HP lost but " +
                "when moving faster is better it averages at 25% less HP lost. Note that with VFL we failed to reject the null hypothesis " +
                "that the average damage taken are equal between setups but fortunately with EOT, we established statistical significance " +
                "for all but one setup in each formation.",
                "<li><b>For Sopmod3 sl8/8, moving slower is superior in all situations</b> with an average of 15% less HP lost with the same " +
                "possible reasoning as with b vs 0-2-formation but we only established statistical significance with half the setups.",
                "<li><b>For Chipless Uzimod sl8/8</b>, there haven't been much tests with her especially because of the same problem with " +
                "0-2 formation, <b>she can only go at 7 movespeed at max to avoid that problem. In the situations she was tested in, she " +
                "performs better at faster speeds for high buffs until very low-buff scenarios where slower is better</b> with an average of " +
                "15% less HP lost among the 3 scenarios where there was a significant enough % difference between the 2 movespeeds " +
                "(more than 10%). In our permutation tests, we observed the opposite where low-buff setups rejected the null hypothesis with " +
                "p-values hinting at maximum speed being better.",
                "<h4>416 chipless mod2 sl10/8: VFL or SPEQ?</h4>",
                "<b>SPEQ is better in all situations</b> with an average of 20% less HP lost except M16 SPEQ + T-exo w/ 5*dmg1 Rescue fairy " +
                "0-2 formation 4 speed with 15% less HP loss which is likely because the acc buff helps the regular bullets kill surviving " +
                "vespids better especially because of VFL giving a lot of crit chance rather than increasing fp on an already one-shotting " +
                "grenade. Note that only half of the setups were found to have statistically significant results with a few having low " +
                "p-values pointing in the other direction.",
                "<h4>K11 chipless sl10: VFL or EOT?</h4>",
                "<b>VFL is better in b-formation at 4-speed or 0-2-formation at max speed</b> with an average of 25% less HP lost because " +
                "bullet damage matters more there. <b>EOT is better in 0-2 formation at 4-speed and b-formation at 6-speed</b> with an average " +
                "of 20% less HP lost because the enemies will all enter in range but not be firing yet by the time she begins to launch her " +
                "nades which EOT primarily strengthens. Most of the setups were found to be statistically significant which indicates that " +
                "there should be some delineation where one is better than the other with some middleground where we do not yet have enough " +
                "samples to determine which is better for that setup.",
                "<h4>Sopmod3 sl8/8: SPEQ + VFL/EOT?</h4>",
                "<b>VFL is better in 0-2 formation</b> likely because the lowered engagement time makes shooting stronger bullets better, " +
                "except for 5* mortar fairy and M16 with armor in low-buff b-formation probably due to increasing modskill damage is not as " +
                "important as killing mobs with bullets for those scenarios. <b>EOT performs better with b-formation</b> because that buys " +
                "time to wait for the nade icd. When one is significantly better over the other, they average at 15% less HP lost for " +
                "whichever is better in that scenario. Less than half of our results are found to be statistically significant and a few " +
                "disagreed with what we generalized which raises the need to increase the sample size especially considering sopmod's " +
                "variance with her modskill randomness."]
    return render(request, "Findings/pureText.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages, "paragraphs" : paragraphs})

def viewData(request):
    pageTitle = createPageTitle("Raw Data")
    connectedPages = getPageLinks(request)
    # get the filter settings from the request
    requestGET = request.GET
    # get the value corresponding to the key in the request data if present, otherwise return "all"
    def getRequestKey(key):
        if key in requestGET:
            return requestGET[key]
        return "all"
    # for use in conjunction with createFilter() which needs "all" to be passed as None
    def convertFilter(filterVal):
        if filterVal == "all":
            return None
        return filterVal
    # returns a boolean if not "all", boolText is the string used to return true or false
    def convertFilterBool(filterVal, boolText):
        if filterVal == "all":
            return None
        return filterVal==boolText
    
    currFormation = getRequestKey('Formation')
    currFairy = getRequestKey('Fairy')
    currSpeed = getRequestKey('Speed')
    currHG = getRequestKey('HG')
    currTank = getRequestKey('Tank')
    currArmor = getRequestKey('Armor')
    currDPS = getRequestKey('DPS')
    currChip = getRequestKey('Chip')
    
    # get the entire table
    setups = Setup.objects.all()
    # get the filter function
    newFilter = createFilter(formation=convertFilter(currFormation),
                             fairy=convertFilter(currFairy),
                             is_min_speed=convertFilterBool(currSpeed, SPEEDOPTIONS[0]),
                             has_HG=convertFilterBool(currHG, "True"),
                             tank=convertFilter(currTank),
                             has_armor=convertFilterBool(currArmor, "True"),
                             DPS=convertFilter(currDPS),
                             has_chip=convertFilterBool(currChip, "True"))
    # filter out based on the filter inputs
    filteredSetups = newFilter(setups)
    # create the table
    df = modelToDF(filteredSetups)
    tablePlot = getDFTable(df, 400)
    # double check rows of filtered table
    print(df.shape)

    return render(request, "Findings/viewData.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages,
                                                      "formations" : FORMATIONS.List(), "currFormation" : currFormation,
                                                      "fairies" : FAIRIES.List(), "currFairy" : currFairy,
                                                      "speeds" : SPEEDOPTIONS, "currSpeed" : currSpeed,
                                                      "hgs" : ["True", "False"], "currHG" : currHG,
                                                      "tanks" : TANKS.List(), "currTank" : currTank,
                                                      "armors" : ["True", "False"], "currArmor" : currArmor,
                                                      "DPS" : CARRY.List(), "currDPS" : currDPS,
                                                      "chips" : ["True", "False"], "currChip" : currChip,
                                                       "plotDiv" : tablePlot})

def viewCharts(request):
    pageTitle = createPageTitle("View Charts")
    connectedPages = getPageLinks(request)

    # get the entire table
    setups = Setup.objects.all()
    # activate the filter based on the "setup" parameter from the http get
    if 'Setup' in request.GET and request.GET['Setup'] != "all":
        filteredSetups = filterRows(setups, request.GET['Setup'])
        # use for filtering and setting the select html element initial value
        currSetup = request.GET['Setup']
    else:
        filteredSetups = setups
        currSetup = "all"
    # use currDPS for filtering and setting the select html element initial value
    if 'DPS' not in request.GET:
        currDPS = "all"
    else:
        currDPS = request.GET['DPS']
    # create the chart if there is at least 1 row in the data
    if len(filteredSetups) > 0:
        # turn the django model into a pandas dataframe
        dragData = [
            {
                'Setup': str(x),
                # some uzi entries start capitalized so standardize the strings
                'DPS' : x.DPS.lower(),
                'Damage': x.damage
            } for x in filteredSetups
        ]
        df = pd.DataFrame(dragData)
        # double check the size because we cannot see the number of rows in the histogram and boxplots
        print(df.shape)
        # if no DPS is selected, show a boxplot, otherwise show histogram
        if currDPS == "all":
            fig = px.box(df, x="DPS", y="Damage")
        else:
            # if DPS is selected, additionally filter out DPS that have the exact name match
            filteredDF = df[df.DPS == currDPS]
            fig = px.histogram(filteredDF, x="Damage", nbins=8)
            # avoid float values for y ticks and add a gap between histogram bars
            fig.update_layout(bargap= 0.2, yaxis_tickformat=".0f")
        fig.update_layout(paper_bgcolor = "beige", height = 550, margin=dict(t=0,b=20,r=20))

        chartplot = plot(fig, output_type="div")

        dpsList = df.DPS.unique()
        return render(request, "Findings/viewCharts.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages, 
                                                            "namedSetups" : NAMEDSETUPS, "currentSetup" : currSetup, 
                                                            "currentDPS" : currDPS, "DPSList" : dpsList, "plotDiv" : chartplot})
    # if no data present, pull up the same html but without the plot or DPS dropdown
    return render(request, "Findings/viewCharts.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages, 
                                                        "namedSetups" : NAMEDSETUPS, "currentSetup" : currSetup, "currentDPS" : currDPS,
                                                        "DPSList" : []})

def permutationTests(request):
    pageTitle = createPageTitle("Permutation Tests")
    connectedPages = getPageLinks(request)

    if 'Comparison' in request.GET:
        currComparison = request.GET['Comparison']
    else:
        currComparison = COMPARISONS.EXO_ARMOR
    # get the html string saved in a file with the comparison name as filename, encoded in utf-8
    # assumes that all comparisons have already been performed and saved in individual files
    with open(currComparison + ".txt", "r", encoding="utf-8") as f:
        tablePlot = f.read()
    
    return render(request, "Findings/permutationResults.html", {"pageTitle" : pageTitle, "connectedPagesList" : connectedPages,
                                                              "currentComparison" : currComparison, "comparisons" : COMPARISONS.List(),
                                                              "plotDiv": tablePlot})