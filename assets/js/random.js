"use strict";

var Rand = {

  // Generates a random int from min to max, inclusive
  randomInt: function randomInt(seededRand, min, max) {
    return Math.floor(seededRand() * (max - min + 1)) + min;
  },

  // weights must be a reducible data structure. Annoying the map iterators aren't
  // reducible by default in javascript (!?!?) so you can't actually call this on
  // the iterator provided by map.keys(). Really, js?
  randomIndex: function randomIndex(seededRand, weights) {
    var selection = Rand.randomInt(seededRand, 0, weights.reduce((a, b) => a+b, 0));

    var sum = 0;
    var idx = 0;
    for (var weight of weights) {
      sum += weight;
      if (selection <= sum) {
        return idx;
      }
      idx++;
    }
  },

  // weights must be a reducible data structure
  randomSelection: function randomSelection(seededRand, options, weights) {
    var idx = Rand.randomIndex(seededRand, weights);
    return options[idx];
  }

}
