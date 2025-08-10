// create the dropdown list that will change the parent button's text when selected
function addDropdownOptions(d3html, optionList) {
    optionList.forEach(option => {
        d3html.append("option")
                .text(option)
                .attr("value", option);
    });
}

// create a dropdownbox for each button
// formation
{
    const formations = ["b-formation", "0-2-formation"];
    var formationDropdown = d3.select("#Formation");
    let button = document.getElementById("Formation");
    
    button.value = formations[0];

    addDropdownOptions(formationDropdown, formations);
}
// fairy
{
    const fairies = ["Rescue", "Mortar", "Armor", "Beach"];
    var fairyDropdown = d3.select("#Fairy");
    let button = document.getElementById("Fairy");
    
    button.value = fairies[0];

    addDropdownOptions(fairyDropdown, fairies);
}
// speed
{
    const speeds = ["4","6","7","10"];
    var speedDropdown = d3.select("#Speed");
    let button = document.getElementById("Speed");
    
    button.value = speeds[0];

    addDropdownOptions(speedDropdown, speeds);
}
// tank
{
    const tanks = ["M16", "Super Shorty"];
    var tankDropdown = d3.select("#Tank");
    let button = document.getElementById("Tank");
    
    button.value = tanks[0];

    addDropdownOptions(tankDropdown, tanks);
}
// DPS
{
    // only allow dps setups that are already present in the original data
    const DPS = ["416 mod2 10/8 speq", "416 mod2 10/8 vfl", "416 mod3 10/10 speq", "k11 sl10 eot", "k11 sl10 vfl", "uzi mod2 8/8",  
                    "uzi mod2 9/8", "sop mod3 8/8 vfl+speq", "sop mod3 8/8 eot+speq"];
    var dpsDropdown = d3.select("#DPS");
    let button = document.getElementById("DPS");
    
    button.value = DPS[0];

    addDropdownOptions(dpsDropdown, DPS);
}

const damageInput = document.getElementById("Damage");
damageInput.addEventListener("change", () => {
    // convert string to float and check if positive value
    // enable submit button if true, otherwise disable the button
    let damage = +damageInput.value;
    // check if damage input string is a number
    if (!Number.isNaN(damage)) {
        // check if number is integer as we can only take integer values for damage
        if (Number.isInteger(damage)) {
            if (damage > 0)
                document.getElementById("submit").disabled = false;
            else
                document.getElementById("submit").disabled = true;
        }
        else
            document.getElementById("submit").disabled = true;
    }
    else
        document.getElementById("submit").disabled = true;    
});