import React, { createContext, useContext, useState } from "react";

const Context = createContext([{}, null]);
const { Provider, Consumer } = Context;

// Helper - parse the multi-type passed value and put that into the update fn
const withValue = (state, update) => value => {
  while (typeof value === "function") {
    value = value(state);
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

const dotGet = (obj, sel) => sel.split(".").reduce((obj, i) => obj[i], obj);

export const useSelector = (sel = state => state) => {
  const [state] = useContext(Context);
  return typeof sel === "string" ? dotGet(state, sel) : sel(state);
};

export const useActions = key => {
  const [state, setState] = useContext(Context);
  return key
    ? createActions(state[key], value => setState({ ...state, [key]: value }))
    : createActions(state, setState);
};

export const useStore = name => [useSelector(name), useActions(name)];

export default ({ children, ...initial }) => {
  return <Provider value={useState(initial)}>{children}</Provider>;
};
