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
  FighterRecon: [
    EntityBuilder.Ships.Fighter,
    EntityBuilder.Ships.Scout,
    EntityBuilder.Ships.Scout
  ],
  FighterPair: [
    EntityBuilder.Ships.Fighter,
    EntityBuilder.Ships.Fighter
  ],
  FighterFlight: [
    EntityBuilder.Ships.Fighter,
    EntityBuilder.Ships.Fighter,
    EntityBuilder.Ships.Fighter,
    EntityBuilder.Ships.Fighter
  ],
  Gunship: [EntityBuilder.Ships.Gunship],
  GunshipRecon: [
    EntityBuilder.Ships.Gunship,
    EntityBuilder.Ships.Scout,
    EntityBuilder.Ships.Scout
  ],
  Frigate: [EntityBuilder.Ships.Frigate]
}

var LevelsToEncounters = new Map();

var Level0 = new Map();
Level0.set(Encounters.Scout, 50);
Level0.set(Encounters.ScoutPair, 100);
Level0.set(Encounters.ScoutTrio, 100);
Level0.set(Encounters.Fighter, 50);

var Level1 = new Map();
Level1.set(Encounters.Fighter, 50);
Level1.set(Encounters.FighterRecon, 100);
Level1.set(Encounters.FighterPair, 100);
Level1.set(Encounters.Gunship, 50);

LevelsToEncounters.set(0, Level0);
LevelsToEncounters.set(1, Level1);

var rand = new Math.seedrandom('z');
for (var i = 0; i < 30; i++) {
  console.log(
    Rand.randomSelection(rand,
                         Array.from(LevelsToEncounters.get(0).keys()),
                         Array.from(LevelsToEncounters.get(0).values())));
}
