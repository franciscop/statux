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
const withValue = (state, update) => value => {
  while (typeof value === "function") {
    value = value(freeze(state));
  }
  return value && value.then ? value.then(update) : update(value);
};

const createActions = (state, setState) => {
  // Generic one `setUser('Francisco')`
  const setter = withValue(state, setState);

  // Arrays
  setter.append = withValue(state, item => setState([...state, item]));
  setter.prepend = withValue(state, item => setState([item, ...state]));

  // Numbers
  setter.add = withValue(state, num => setState(state + num));

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
