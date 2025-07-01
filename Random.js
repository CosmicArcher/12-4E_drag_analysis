// Linear Congruential Random Number Generator
// javascript random number generator does not have the ability to set a seed which hurts reproduceability
let mod = 2**31;
let a = 22695477;
let c = 1;
let randSeed = 0;
class Random {
    constructor() {

    }

    static setSeed(seed) {
        randSeed = seed;
    }
    // returns a random number between 0 and 2^31
    static getRand() {
        let rand = (a * randSeed + c) % mod;
        // after obtaining the random number, use it to seed the next time the function is called
        Random.setSeed(rand);
        // output the random number
        return rand;
    }
}

export default Random;