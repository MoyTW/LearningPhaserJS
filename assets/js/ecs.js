"use strict";

var ECS = ECS || {
  nextID : 0
}

ECS.camelCaseFunctionName = function(f) {
  var fname = f.name.replace(/^bound /, '')
  return fname.charAt(0).toLowerCase() + fname.slice(1);
}

/**********
 * Entity *
 **********/
ECS.Entity = { };

// Bypassing 'init' since we're not doing a prototype chain
ECS.Entity.Create = function() {
  var e = Object.create( ECS.Entity );
  e.id = ECS.nextID++;
  return e;
}

ECS.Entity.hasComponent = function(TComponent) {
  return ECS.camelCaseFunctionName(TComponent) in this;
}


/*****************
 * EntityManager *
 *****************/
ECS.EntityManager = {};

// Bypassing 'init' since we're not doing a prototype chain
ECS.EntityManager.Create = function() {
  var em = Object.create( ECS.EntityManager );
  em._entities = [];
  return em;
},

ECS.EntityManager.createEntity = function() {
  var entity = ECS.Entity.Create();
  this._entities.push(entity);
  return entity;
}

ECS.EntityManager.removeEntity = function(entity) {
  var index = this._entities.indexOf(entity);

  if (index > -1) {
    this._entities.splice(index, 1);
  } else {
    throw new Error('Tried to remove entity not in list');
  }

  var c;
  for (c of Object.keys(entity)) {
    if(!!entity[c].cleanup) {
      entity[c].cleanup();
    }
  }
}

ECS.EntityManager.addComponent = function(entity, TComponent) {
  if (entity.hasComponent(TComponent)) {
    throw new Error('You cannot attach two of the same component to an entity');
  }

  var reifiedComponent = new TComponent();
  entity[ECS.camelCaseFunctionName(TComponent)] = reifiedComponent;
  reifiedComponent.owner = entity;

  return entity;
}

ECS.EntityManager.removeComponent = function(entity, TComponent) {
  if (!entity.hasComponent(TComponent)) {
    throw new Error('You cannot remove a component that the entity does not have');
  }

  var name = ECS.camelCaseFunctionName(TComponent);
  if(!!entity[name].cleanup) { entity[name].cleanup(); }
  delete entity[name];

  return entity;
}

ECS.EntityManager.findByComponent = function(TComponent) {
  var matching = [];
  for (var i = 0; i < this._entities.length; i++) {
    if (this._entities[i].hasComponent(TComponent)) {
      matching.push(this._entities[i]);
    }
  }
  return matching;
}

// Convenience function to get player
ECS.EntityManager.findPlayer = function() {
  return this.findByComponent(Component.Player)[0];
}
