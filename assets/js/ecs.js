var ECS = {

  nextID : 0,

  Entity : function() {
    this.id = ECS.nextID++;
    this._Components = [];
  },

  EntityManager : function() {
    this._entities = [];
  },

  camelCaseFunctionName : function(f) {
    return f.name.charAt(0).toLowerCase() + f.name.slice(1);
  }
}

ECS.EntityManager.prototype.createEntity = function() {
  var entity = new ECS.Entity();
  this._entities.push(entity);
  return entity;
}

ECS.EntityManager.prototype.removeEntity = function(entity) {
  var index = this._entities.indexOf(entity);

  if (index > -1) {
    this._entities.splice(index, 1);
  } else {
    throw new Error('Tried to remove entity not in list');
  }
}

ECS.EntityManager.prototype.addComponent = function(entity, Component) {
  if (entity._Components.indexOf(Component) > -1) {
    throw new Error('You cannot attach two of the same component to an entity');
  }

  entity._Components.push(Component);

  entity[ECS.camelCaseFunctionName(Component)] = new Component();

  return entity;
}

ECS.EntityManager.prototype.removeComponent = function(entity, Component) {
  var index = entity._Components.indexOf(Component);

  if (index == -1) {
    throw new Error('You cannot remove a component that the entity does not have');
  }

  entity._Components.splice(index, 1);

  delete entity[ECS.camelCaseFunctionName(Component)];

  return entity;
}
