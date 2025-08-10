import numpy as np
import math
from Findings.constants import NUMPERMUTATIONS, TESTMODES

# set up a function that computes the empirical cumulative distribution function because this venv version of python and scipy does not have ecdf
# compared to scipy.stats ecdf() function, our ecdf has slightly different results which affects the KS-test values
def ecdf(sortedData, x):
    # quick checks if the number x is at either end of the empirical cumulative distribution function
    if sortedData[0] > x:
        return 0
    if sortedData[len(sortedData) - 1] <= x:
        return 1
    # use binary search to find the quantile x belongs to within the sorted data
    # i is used as both the middle index and as the last index x is greater than
    lower = 0
    upper = len(sortedData) - 1
    foundI = False
    while not foundI: 
        i = math.floor((upper - lower) / 2) + lower
        if sortedData[i] == x:
            foundI = True
        elif sortedData[i] > x:
            # check if the immediate previous element is less than x because unlike typical binary search use, we are trying to find the
            # indices where x is between rather than finding the index it is equal to
            if sortedData[i - 1] <= x:
                i = i - 1
                foundI = True
            else:
                upper = i - 1
        else:
            if sortedData[i + 1] > x:
                foundI = True
            elif sortedData[i + 1] == x:
                i = i + 1
                foundI = True
            else:
                lower = i + 1
    
    # the return value is the quantile x falls under within the dataset
    return (i + 1) / len(sortedData)

class PermutationTester:
    _randomRolls = []
    # perform a Monte Carlo permutation test comparing the two datasets if they come from the same distribution, calculate p-value based on 
    # original set rank / total permutations and take that as the p-value where rank is nth lowest or highest depending on isLefSide 
    # bool where lowest if true 
    @staticmethod
    def performTest(data1, data2, mode, isLeftSide = True):
            # start by combining the two datasets and reshuffling the groups with the same sizes as before
            size1 = len(data1)
            size2 = len(data2)
            combinedSize = size1 + size2
            combinedData = np.empty(combinedSize)
            for i in range(size1):
                combinedData[i] = data1[i]
            for i in range(size2):
                combinedData[size1 + i] = data2[i]
            
            # get the test statistic for the original two datasets
            observedTestStat = PermutationTester.calculateStatistic(data1, data2, mode)
            testStats = np.empty(NUMPERMUTATIONS)
            # start shuffling the entries in both datasets with each other, do it {NUMPERMUTATIONS} times since fully covering all permutations is too time consuming
            PermutationTester.permuteData(combinedData, combinedSize, size1, size2, mode, testStats)
            
            # get p-value based on percentage of testStats that are less than or greater than to the observed test statistic depending
            # on which sided test is set
            if isLeftSide:
                return testStats[testStats < observedTestStat].size / NUMPERMUTATIONS
            else:
                return testStats[testStats > observedTestStat].size / NUMPERMUTATIONS
    @staticmethod
    def permuteData(combinedData, combinedSize, size1, size2, mode, res):
        for i in range(NUMPERMUTATIONS):
            # use the Fisher-Yates shuffle to perform the permutations
            # use a temporary array to avoid modification of the original combined dataset array
            tempCombined = np.copy(combinedData)
            for j in range(combinedSize - 1, 0, -1):
                # get a random number between 0 and index j (inclusive) to swap with element at index j
                k = int(PermutationTester._randomRolls[combinedSize - 1 - j + (combinedSize - 1) * i]) % (j + 1)
                [tempCombined[j], tempCombined[k]] = [tempCombined[k], tempCombined[j]]
            # put the first size1 elements in perm1 dataset and the rest in perm2
            perm1 = np.empty(size1)
            perm2 = np.empty(size2)
            for j in range(size1): 
                perm1[j] = tempCombined[j]
            for j in range(size2):
                perm2[j] = tempCombined[size1 + j]
            # get the test statistic with the shuffled datasets
            res[i] =  PermutationTester.calculateStatistic(perm1, perm2, mode)
            #return res[i]

    @staticmethod                  
    def calculateStatistic(data1, data2, mode):
        # test mode uses enums to avoid input errors
        size1 = len(data1)
        size2 = len(data2)
        if mode == TESTMODES.MEAN:
            return np.mean(data1) - np.mean(data2)
        elif mode == TESTMODES.KSTEST:
            # get the empirical cumulative distribution functions of the two datasets
            # sort the datasets to make it easier to get the quantile by enabling more efficient search methods
            sorted1 = np.sort(data1)
            sorted2 = np.sort(data2)
            # get the difference of the ECDFs between the two datasets
            combinedData = np.empty(size1 + size2)
            for i in range(size1):
                combinedData[i] = data1[i]
            for i in range(size2):
                combinedData[size1 + i] = data2[i]
            ecdiff = np.empty(size1 + size2)
            for index, data in enumerate(combinedData):
                ecdiff[index] = abs(ecdf(sorted1, data) - ecdf(sorted2, data))
            # the test statistic of the KS test is the supremum of the differences between the two ECDFs 
            return np.max(ecdiff)
        elif mode == TESTMODES.STDDEV:
            return np.std(data1, ddof = 1) - np.std(data2, ddof = 1)
        else: 
            print(mode)
            print(" is not a valid test mode")
    @staticmethod
    def setRandomRolls(rolls):
        PermutationTester._randomRolls = rolls