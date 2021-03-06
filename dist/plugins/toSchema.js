'use strict';

// see comment in fromSchema

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var valueMapper = function valueMapper(node) {
  var value = node.value();

  var schema = Object.assign({}, value);

  if (value.type === 'union') {
    schema.type = value.typesUnion;

    delete schema.typesUnion;
  } else if (value.type === 'any') {
    delete schema.type;
  }

  return schema;
};

var deleteFromValue = function deleteFromValue(node, propertyName) {
  var value = node.value();

  delete value[propertyName];

  node.value(value);
};

var propertyPopulators = {
  propertyName: function propertyName(node, schema) {
    if (_typeof(schema.properties) !== 'object') schema.properties = {};

    var value = node.value();
    var propertyName = value.propertyName;


    deleteFromValue(node, 'propertyName');

    schema.properties[propertyName] = _toSchema(node);
  },
  propertyPattern: function propertyPattern(node, schema) {
    if (_typeof(schema.patternProperties) !== 'object') schema.patternProperties = {};

    var value = node.value();
    var pattern = value.propertyPattern;

    deleteFromValue(node, 'propertyPattern');

    schema.patternProperties[pattern] = _toSchema(node);
  },
  additionalPropertiesSchema: function additionalPropertiesSchema(node, schema) {
    deleteFromValue(node, 'additionalPropertiesSchema');

    schema.additionalProperties = _toSchema(node);
  },
  arrayItem: function arrayItem(node, schema) {
    deleteFromValue(node, 'arrayItem');

    schema.items = _toSchema(node);
  },
  arrayIndex: function arrayIndex(node, schema) {
    if (!Array.isArray(schema.items)) schema.items = [];

    var value = node.value();
    var arrayIndex = value.arrayIndex;


    deleteFromValue(node, 'arrayIndex');

    schema.items[arrayIndex] = _toSchema(node);
  },
  anyOf: function anyOf(node, schema) {
    if (!Array.isArray(schema.anyOf)) schema.anyOf = [];

    deleteFromValue(node, 'anyOf');

    var childSchema = _toSchema(node);

    schema.anyOf.push(childSchema);
  },
  allOf: function allOf(node, schema) {
    if (!Array.isArray(schema.allOf)) schema.allOf = [];

    deleteFromValue(node, 'allOf');

    var childSchema = _toSchema(node);

    schema.allOf.push(childSchema);
  },
  oneOf: function oneOf(node, schema) {
    if (!Array.isArray(schema.oneOf)) schema.oneOf = [];

    deleteFromValue(node, 'oneOf');

    var childSchema = _toSchema(node);

    schema.oneOf.push(childSchema);
  },
  not: function not(node, schema) {
    deleteFromValue(node, 'not');

    schema.not = _toSchema(node);
  }
};

var populatorProperties = Object.keys(propertyPopulators);

var nestingMapper = function nestingMapper(node) {
  var schema = valueMapper(node);

  var children = node.getChildren();

  children.forEach(function (childNode) {
    var value = childNode.value();

    var populateFor = populatorProperties.filter(function (propertyName) {
      return propertyName in value;
    });

    populateFor.forEach(function (propertyName) {
      var populator = propertyPopulators[propertyName];

      populator(childNode, schema);
    });
  });

  return schema;
};

var valueMappers = {
  object: nestingMapper,
  array: nestingMapper,
  any: nestingMapper,
  union: nestingMapper,
  string: valueMapper,
  number: valueMapper,
  boolean: valueMapper,
  integer: valueMapper,
  null: valueMapper
};

var _toSchema = function _toSchema(node) {
  node = node.clone();

  var value = node.value();
  var schemaType = value.type;
  var mapper = valueMappers[schemaType];

  return mapper(node);
};

var toSchemaPlugin = function toSchemaPlugin(node) {
  return {
    toSchema: function toSchema() {
      return _toSchema(node);
    }
  };
};

module.exports = toSchemaPlugin;