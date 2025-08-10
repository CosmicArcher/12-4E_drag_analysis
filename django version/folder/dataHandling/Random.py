# because we are translating completed JavaScript code to Python, we also copy the random number generation method so that we get the
# same results when doing the permutation tests
class Random:
    _mod = pow(2, 31)
    _a = 22695477
    _c = 1
    _seed = 0
    @staticmethod
    def setSeed(seed):
        Random._seed = seed
    @staticmethod
    def getRand():
        # WARNING: floating point shenanigans make the random numbers generated from this different from the JS version so analysis has to change
        rand = (Random._a * Random._seed + Random._c) % Random._mod
        Random.setSeed(rand)

        return rand