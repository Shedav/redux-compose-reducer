import {
  isDev,
  namespacedActionType,
  isObject,
  isFunction,
  createCapturedError,
  checkStateShape,
} from './utils'

const composeReducer = (...args) => {
  const {
    namespace = '',
    types,
    initialState,
    reducers = {},
    globalReducer,
  } = prepareParams(args)

  if (
    (types !== undefined && !isObject(types)) ||
    (types === undefined && typeof namespace !== 'string') ||
    !isObject(initialState) ||
    !isObject(reducers) ||
    (globalReducer !== undefined && !isFunction(globalReducer))
  )
    throw createError(ARGUMENT_ERROR)

  const typeToReducerMap = types
    ? createMapFromTypes(types, reducers)
    : createMapFromNamespace(namespace, reducers)

  return (state = initialState, action) => {
    const reduce = typeToReducerMap[action.type]
    if (reduce) state = reduce(state, action)
    if (globalReducer) state = globalReducer(state, action)
    if (isDev) checkStateShape(state, initialState, action)
    return state
  }
}

const prepareParams = args => {
  if (typeof args[0] === 'string') {
    console.warn(DEPRICATED_API_WARNING)
    return {
      namespace: args[0],
      reducers: args[1],
      initialState: args[2],
      globalReducer: args[3],
    }
  }

  return args[0] || {}
}

const createMapFromTypes = (types, reducers) => {
  const result = {}
  Object.keys(reducers).forEach(key => {
    if (!(key in types)) throw createError(`There is no '${key}' action type.`)
    result[types[key]] = normalizeReducer(reducers[key])
  })
  return result
}

const createMapFromNamespace = (namespace, reducers) => {
  const result = {}
  Object.keys(reducers).forEach(type => {
    result[namespacedActionType(namespace, type)] = normalizeReducer(
      reducers[type]
    )
  })
  return result
}

const normalizeReducer = reducer =>
  isFunction(reducer) ? reducer : state => Object.assign({}, state, reducer)

export const ARGUMENT_ERROR = `As argument expected object of shape : {
  namespace: 'string',
  types: 'object',
  initialState: 'object',
  reducers: 'object',
  globalReducer: 'function'
}.
Required keys: namespace or types, initialState.`

const DEPRICATED_API_WARNING =
  'redux-compose-reducer#composeReducer: ' +
  'Multiple arguments api is depricated and will be removed in future versions. ' +
  'Please use object argument.'

const createError = message => createCapturedError(message, composeReducer)

export default composeReducer
