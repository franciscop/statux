import React, { createContext, useContext, useState } from "react";

const Context = createContext([{}, null]);
const { Provider, Consumer } = Context;

// Helpers to get and set using the dot notation selector
const dotGet = (obj, sel) => sel.split(".").reduce((obj, i) => obj[i], obj);
const dotSet = (obj, sel, value) => {
  const [key, ...rest] = sel.split(".");
  const subSel = rest.join(".");
  const subValue = subSel ? dotSet(obj[key], subSel, value) : value;
  if (Array.isArray(obj)) {
    const data = obj.map((item, i) => (i === parseInt(key) ? subValue : item));
    return data;
  }
  return { ...obj, [key]: subValue };
};

// Deep freeze any object
const freeze = obj => {
  // Does not need freezing
  if (typeof obj !== "object") return obj;

  // Already frozen
  if (Object.isFrozen(obj)) return obj;

  // Freeze props before freezing self
  for (let key of Object.getOwnPropertyNames(obj)) {
    if (Array.isArray(obj) && key === "length") continue;
    obj[key] = typeof obj[key] === "object" ? freeze(obj[key]) : obj[key];
  }
  return Object.freeze(obj);
};

// Helper - parse the multi-type passed value and put that into the update fn
const resolve = (state, setState) => value => {
  while (typeof value === "function") {
    value = value(freeze(state));
  }
  return value && value.then ? value.then(setState) : setState(value);
};

// Create a swallow clone of the array so that it can be mutated in place
const applyMutation = (state, setState) => mutation => {
  return (...args) => {
    const cloned = state.slice();
    mutation(cloned, ...args);
    setState(cloned);
  };
};

const createActions = (state, setState) => {
  // Generic one `setUser('Francisco')`
  const setter = resolve(state, setState);

  if (Array.isArray(state)) {
    const mutate = applyMutation(state, setState); // <- INTERNAL USE ONLY

    // Mutation methods
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Mutator_methods
    setter.fill = mutate((items, ...args) => items.fill(...args));
    setter.pop = mutate((items, ...args) => items.pop(...args));
    setter.push = mutate((items, ...args) => items.push(...args));
    setter.reverse = mutate((items, ...args) => items.reverse(...args));
    setter.shift = mutate((items, ...args) => items.shift(...args));
    setter.sort = mutate((items, ...args) => items.sort(...args));
    setter.splice = mutate((items, ...args) => items.splice(...args));
    setter.unshift = mutate((items, ...args) => items.unshift(...args));

    // Change the array in some immutable way. Helpers to make it easier
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Accessor_methods
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Iteration_methods
    setter.concat = (...args) => setState(state.concat(...args));
    setter.slice = (...args) => setState(state.slice(...args));
    setter.filter = (...args) => setState(state.filter(...args));
    setter.map = (...args) => setState(state.map(...args));
    setter.reduce = (...args) => setState(state.reduce(...args));
    setter.reduceRight = (...args) => setState(state.reduceRight(...args));

    // Aliases
    setter.append = setter.push;
    setter.prepend = setter.unshift;
  }

  if (typeof state === "object") {
    setter.assign = (...args) => setState(Object.assign({}, state, ...args));

    // Aliases
    setter.extend = setter.assign;
  }

  // Numbers
  setter.add = resolve(state, num => setState(state + num));

  return setter;
};

export const useSelector = (sel = state => state) => {
  const [state] = useContext(Context);
  return freeze(typeof sel === "string" ? dotGet(state, sel) : sel(state));
};

export const useActions = key => {
  const [state, setState] = useContext(Context);
  return key
    ? createActions(state[key], value => setState(dotSet(state, key, value)))
    : createActions(state, setState);
};

export const useStore = name => [useSelector(name), useActions(name)];

export default ({ children, ...initial }) => {
  const [state, setState] = useState(initial);
  return <Provider value={[state, setState]}>{children}</Provider>;
};
