// reset to original state
function resetFilters() {
    for (let i = 0; i < filters.length; i++) 
        filters[i].value = "all";
    // submit the form after resetting the filters
    inputForm.submit();
}

// form html reference for ease of calling submit
const inputForm = document.getElementById("form");
// get reference to all filters to quickly reset to "all"
const filters = document.getElementsByTagName("select");
// reset button
const resetButton = document.getElementById("reset");
resetButton.onclick = resetFilters;
// auto submit on changing any of the dropdowns
d3.selectAll("select").on("input", () => {
    inputForm.submit();
});