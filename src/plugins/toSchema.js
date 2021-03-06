'use strict'

// see comment in fromSchema

const valueMapper = node => {
  const value = node.value()

  const schema = Object.assign( {}, value )

  if( value.type === 'union' ){
    schema.type = value.typesUnion

    delete schema.typesUnion
  } else if( value.type === 'any' ){
    delete schema.type
  }

  return schema
}

const deleteFromValue = ( node, propertyName ) => {
  const value = node.value()

  delete value[ propertyName ]

  node.value( value )
}

const propertyPopulators = {
  propertyName: ( node, schema ) => {
    if( typeof schema.properties !== 'object' )
      schema.properties = {}

    const value = node.value()
    const { propertyName } = value

    deleteFromValue( node, 'propertyName' )

    schema.properties[ propertyName ] = toSchema( node )
  },
  propertyPattern: ( node, schema ) => {
    if( typeof schema.patternProperties !== 'object' )
      schema.patternProperties = {}

    const value = node.value()
    const pattern = value.propertyPattern

    deleteFromValue( node, 'propertyPattern' )

    schema.patternProperties[ pattern ] = toSchema( node )
  },
  additionalPropertiesSchema: ( node, schema ) => {
    deleteFromValue( node, 'additionalPropertiesSchema' )

    schema.additionalProperties = toSchema( node )
  },
  arrayItem: ( node, schema ) => {
    deleteFromValue( node, 'arrayItem' )

    schema.items = toSchema( node )
  },
  arrayIndex: ( node, schema ) => {
    if( !Array.isArray( schema.items ))
      schema.items = []

    const value = node.value()
    const { arrayIndex } = value

    deleteFromValue( node, 'arrayIndex' )

    schema.items[ arrayIndex ] = toSchema( node )
  },
  anyOf: ( node, schema ) => {
    if( !Array.isArray( schema.anyOf ))
      schema.anyOf = []

    deleteFromValue( node, 'anyOf' )

    const childSchema = toSchema( node )

    schema.anyOf.push( childSchema )
  },
  allOf: ( node, schema ) => {
    if( !Array.isArray( schema.allOf ))
      schema.allOf = []

    deleteFromValue( node, 'allOf' )

    const childSchema = toSchema( node )

    schema.allOf.push( childSchema )
  },
  oneOf: ( node, schema ) => {
    if( !Array.isArray( schema.oneOf ))
      schema.oneOf = []

    deleteFromValue( node, 'oneOf' )

    const childSchema = toSchema( node )

    schema.oneOf.push( childSchema )
  },
  not: ( node, schema ) => {
    deleteFromValue( node, 'not' )

    schema.not = toSchema( node )
  }
}

const populatorProperties = Object.keys( propertyPopulators )

const nestingMapper = node => {
  const schema = valueMapper( node )

  const children = node.getChildren()

  children.forEach( childNode => {
    const value = childNode.value()

    const populateFor = populatorProperties.filter( propertyName => propertyName in value )

    populateFor.forEach( propertyName => {
      const populator = propertyPopulators[ propertyName ]

      populator( childNode, schema )
    })
  })

  return schema
}

const valueMappers = {
  object: nestingMapper,
  array: nestingMapper,
  any: nestingMapper,
  union: nestingMapper,
  string: valueMapper,
  number: valueMapper,
  boolean: valueMapper,
  integer: valueMapper,
  null: valueMapper
}

const toSchema = node => {
  node = node.clone()

  const value = node.value()
  const schemaType = value.type
  const mapper = valueMappers[ schemaType ]

  return mapper( node )
}

const toSchemaPlugin = node => {
  return {
    toSchema: () => toSchema( node )
  }
}

module.exports = toSchemaPlugin
