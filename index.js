import React, { createContext, useContext, useState } from "react";

const Context = createContext({});
const { Provider, Consumer } = Context;

// Helper - parse the multi-type passed value and put that into the update fn
const withValue = (args, update) => value => {
  if (typeof value === "function") {
    value = value(...args);
  }
  if (value && value.then) {
    return value.then(update);
  }
  return update(value);
};

// const { user, setUser } = useStore();
export const useStore = () => useContext(Context);

// <State>{({ user, books }) => <div>{user}</div>}</State>
export const State = ({ render, children, ...props }) => {
  const store = useStore();
  if (render) return render(store);
  return children(store);
};

export default ({ children, ...initial }) => {
  const [state, setState] = useState(initial);

  // Generate all the high-level setters
  const setters = { setState };
  for (let key in state) {
    const prev = state[key];
    const setValue = value => setState({ ...state, [key]: value });

    // Generic one `setUser('Francisco')`
    const setter = withValue([prev], setValue);

    // Arrays
    setter.append = withValue([prev], item => setValue([...prev, item]));
    setter.prepend = withValue([prev], item => setValue([item, ...prev]));

    // Numbers
    setter.add = withValue([prev], num => setValue(prev + num));

    // user -> setUser, books -> setBooks, etc
    setters[`set${key[0].toUpperCase()}${key.slice(1)}`] = setter;
  }

  return <Provider value={{ ...state, ...setters }}>{children}</Provider>;
};
