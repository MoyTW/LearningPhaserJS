"use strict";

// In languages like C# or Clojure I'd hold data like the encounters data in a
// json/XML file, but Javascript doesn't really seem to have that same
// structure. I'm not sure how configuration of that type is traditionally
// handled in js-land, so I'll just directly define the objects in the source
// and investigate this after release.

// TODO: Carriers are yout defined!
var Encounters = {
  Empty: {
    description: 'none',
    ships: []
  },
  Scout: {
    description: 'single scout',
    ships: [EntityBuilder.Ships.Scout]
  },
  ScoutPair: {
    description: 'scout pair',
    ships: [
      EntityBuilder.Ships.Scout,
      EntityBuilder.Ships.Scout
    ]
  },
  ScoutTrio: {
    description: 'scout trio',
    ships: [
      EntityBuilder.Ships.Scout,
      EntityBuilder.Ships.Scout,
      EntityBuilder.Ships.Scout
    ]
  },
  Fighter: {
    description: 'single fighter',
    ships: [EntityBuilder.Ships.Fighter]
  },
  FighterRecon: {
    description: 'recon flight',
    ships: [
      EntityBuilder.Ships.Fighter,
      EntityBuilder.Ships.Scout,
      EntityBuilder.Ships.Scout
    ]
  },
  FighterPair: {
    description: 'fighter element',
    ships: [
      EntityBuilder.Ships.Fighter,
      EntityBuilder.Ships.Fighter
    ]
  },
  FighterFlight: {
    description: 'fighter flight',
    ships: [
      EntityBuilder.Ships.Fighter,
      EntityBuilder.Ships.Fighter,
      EntityBuilder.Ships.Fighter,
      EntityBuilder.Ships.Fighter
    ]
  },
  Gunship: {
    description: 'single gunship',
    ships: [EntityBuilder.Ships.Gunship]
  },
  GunshipRecon: {
    description: 'gunship and escorts',
    ships: [
      EntityBuilder.Ships.Gunship,
      EntityBuilder.Ships.Scout,
      EntityBuilder.Ships.Scout
    ]
  },
  Frigate: {
    description: 'single frigate',
    ships: [EntityBuilder.Ships.Frigate]
  }
}

// I don't really like this syntax, but there's no map literal syntax for
// javascript! This is apparently as close as you'll get to a map literal. Ouch!
// That's... not as good as it could be.
var LevelsToEncounters = new Map([
  [0, new Map([
    [Encounters.Scout, 50],
    [Encounters.ScoutPair, 100],
    [Encounters.ScoutTrio, 100],
    [Encounters.Fighter, 50]
  ])],
  [1, new Map([
    [Encounters.Fighter, 50],
    [Encounters.FighterRecon, 100],
    [Encounters.FighterPair, 100],
    [Encounters.Gunship, 50],
  ])]
]);

var EncounterPicker = { };

EncounterPicker.chooseEncounter = function (seededRand, level) {
  var selections = Array.from(LevelsToEncounters.get(level).keys());
  var weights = Array.from(LevelsToEncounters.get(level).values());
  return Rand.randomSelection(seededRand, selections, weights);
}
