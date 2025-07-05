import Random from "./Random.js";

export const TestModes = {
    MEAN : "Mean",
    KSTEST : "KS",
    STDDEV : "Standard Deviation"
}
// set up a function that computes the empirical cumulative distribution function
const ecdf = function (sortedData, x) {
    // quick checks if the number x is at either end of the empirical cumulative distribution function
    if (sortedData[0] > x)
        return 0;
    if (sortedData[sortedData.length - 1] <= x)
        return 1;
    // use binary search to find the quantile x belongs to within the sorted data
    // i is used as both the middle index and as the last index x is greater than
    let i;
    let lower = 0;
    let upper = sortedData.length - 1;
    let foundI = false;
    while (!foundI) {
        i = Math.floor((upper - lower) / 2) + lower;
        if (sortedData[i] == x)
            foundI = true;
        else if (sortedData[i] > x) {
            // check if the immediate previous element is less than x because unlike typical binary search use, we are trying to find the
            // indices where x is between rather than finding the index it is equal to
            if (sortedData[i - 1] <= x) {
                i = i - 1;
                foundI = true;
            }
            else {
                upper = i - 1;
            }
        }
        else {
            if (sortedData[i + 1] > x) {
                foundI = true;
            }
            else if (sortedData[i + 1] == x) {
                i = i + 1;
                foundI = true;
            }
            else
                lower = i + 1;
        }
    }
    // the return value is the quantile x falls under within the dataset
    return (i + 1) / sortedData.length;
};

let PermutationTesterSingleton;
class PermutationTester {
    constructor() {
        if (PermutationTesterSingleton)
            console.error("Singleton already exists")
        else {
            PermutationTesterSingleton = this;
        }
    }

    static getInstance() {
        if (!PermutationTesterSingleton)
            new PermutationTester();
        return PermutationTesterSingleton;
    }
    // perform a Monte Carlo permutation test comparing the two datasets if they come from the same distribution, calculate p-value based on 
    performTest(data1, data2, mode, num_permutations, isLeftSide = true) {
        if (PermutationTesterSingleton) {
            // start by combining the two datasets and reshuffling the groups with the same sizes as before
            let size1 = data1.length;
            let size2 = data2.length;
            let combinedData = [];
            for (let i = 0; i < size1; i++)
                combinedData.push(data1[i]);
            for (let i = 0; i < size2; i++)
                combinedData.push(data2[i]);
            
            // get the test statistic for the original two datasets
            let observedTestStat = PermutationTesterSingleton.calculateStatistic(data1, data2, mode);
            let testStats = [];
            // start shuffling the entries in both datasets with each other, do it {num_permutations} times since fully covering 
            for (let i = 0; i < num_permutations; i++) {
                // use the Fisher-Yates shuffle to perform the permutations
                // use a temporary array to avoid modification of the original combined dataset array
                let tempCombined = [];
                combinedData.forEach(d => {
                    tempCombined.push(d);
                });
                for (let j = size1 + size2 - 1; j > 0; j--) {
                    // get a random number between 0 and index j (inclusive) to swap with element at index j
                    let k = Random.getRand() % (j + 1);
                    [tempCombined[j], tempCombined[k]] = [tempCombined[k], tempCombined[j]];
                }
                // put the first size1 elements in perm1 dataset and the rest in perm2
                let perm1 = [];
                let perm2 = [];
                for (let j = 0; j < size1; j++) 
                    perm1.push(tempCombined[j]);
                for (let j = 0; j < size2; j++)
                    perm2.push(tempCombined[size1 + j]);
                // get the test statistic with the shuffled datasets
                testStats.push(PermutationTesterSingleton.calculateStatistic(perm1, perm2, mode));
            }
            // get p-value based on percentage of testStats that are less than or greater than to the observed test statistic depending on which sided test is set
            if (isLeftSide)
                return testStats.reduce((sum, d) => sum + (d < observedTestStat), 0) / num_permutations;
            else
                return testStats.reduce((sum, d) => sum + (d > observedTestStat), 0) / num_permutations;
        }
        else
            console.error("Singleton does not exist");
    }

    calculateStatistic(data1, data2, mode) {
        if (PermutationTesterSingleton) {
            // test mode uses enums to avoid input errors
            let size1 = data1.length;
            let size2 = data2.length;
            switch (mode) {
                case TestModes.MEAN:
                    return data1.reduce((sum, d) => sum + d) / size1 - data2.reduce((sum, d) => sum + d) / size2;
                case TestModes.KSTEST:
                    // get the empirical cumulative distribution functions of the two datasets
                    // sort the datasets to make it easier to get the quantile by enabling more efficient search methods
                    let sorted1 = data1.sort((a, b) => a - b);
                    let sorted2 = data2.sort((a, b) => a - b);
                    // get the difference of the ECDFs between the two datasets
                    let combinedData = [];
                    for (let i = 0; i < size1; i++)
                        combinedData.push(data1[i]);
                    for (let i = 0; i < size2; i++)
                        combinedData.push(data2[i]);
                    let ecdiff = [];
                    combinedData.forEach(data => {
                        ecdiff.push(Math.abs(ecdf(sorted1, data) - ecdf(sorted2, data)));
                    });
                    // the test statistic of the KS test is the supremum of the differences between the two ECDFs 
                    return d3.max(ecdiff);
                case TestModes.STDDEV:
                    let mean1 = data1.reduce((sum, d) => sum + d) / size1;
                    let mean2 = data2.reduce((sum, d) => sum + d) / size2;
                    // get the variances of the two datasets
                    let var1 = data1.reduce((sum, d) => sum + (d - mean1) ** 2, 0)  / (size1 - 1);
                    let var2 = data2.reduce((sum, d) => sum + (d - mean2) ** 2, 0)  / (size2 - 1);
                    return Math.sqrt(var1) - Math.sqrt(var2);
                default: 
                    console.error(`${mode} is not a valid test mode`);
            }
        }
        else
            console.error("Singleton does not exist");
    }
}

export default PermutationTester;