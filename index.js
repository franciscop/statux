import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef
} from "react";

// https://github.com/facebook/react/issues/14110#issuecomment-446845886
const Context = createContext([{}, []]);

const { Provider, Consumer } = Context;

// Helpers to get and set using the dot notation selector
const dotGet = (obj, sel) => {
  if (typeof sel === "function") return sel(obj);
  return sel.split(".").reduce((obj, i) => obj[i], obj);
};
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

const exclude = (obj, keys) => {
  const newObj = {};
  for (let key in obj) {
    if (!keys.includes(key)) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
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
    setter.concat = (...args) => setter(state.concat(...args));
    setter.slice = (...args) => setter(state.slice(...args));
    setter.filter = (...args) => setter(state.filter(...args));
    setter.map = (...args) => setter(state.map(...args));
    setter.reduce = (...args) => setter(state.reduce(...args));
    setter.reduceRight = (...args) => setter(state.reduceRight(...args));

    // Aliases
    setter.append = setter.push;
    setter.prepend = setter.unshift;
    setter.remove = index => setter.splice(Number(index), 1);
  } else if (typeof state === "object") {
    setter.assign = (...args) => setter(Object.assign({}, state, ...args));
    setter.remove = (...args) => setter(exclude(state, args));

    // Aliases
    setter.extend = setter.assign;
  }

  // Numbers
  setter.add = resolve(state, num => setState(state + num));

  return setter;
};

export const useSelector = (sel = state => state) => {
  const [state, setState, subscribe] = useContext(Context);
  const init = dotGet(state.current, sel);
  const [local, setLocal] = useState(init);

  const ref = useRef(null);
  if (!ref.current) {
    ref.current = subscribe(newState => {
      const stateFragment = dotGet(newState, sel);
      if (stateFragment === local) return;
      state.current = newState;
      setLocal(stateFragment);
    });
  }
  useEffect(() => {
    const unsub = ref.current;
    ref.current = null;
    return unsub;
  }, []);

  return freeze(local);
};

export const useActions = key => {
  const [state, setState] = useContext(Context);
  if (!key) {
    return useCallback(createActions(state.current, setState), [state.current]);
  }

  const subState = dotGet(state.current, key);
  const subSetter = value => setState(dotSet(state.current, key, value));
  return useCallback(createActions(subState, subSetter), [subState]);
};

export const useStore = name => [useSelector(name), useActions(name)];

export default ({ children, ...initial }) => {
  const state = useRef(initial);
  const subs = [];
  const subscribe = fn => {
    subs.push(fn);
    return () => subs.splice(subs.findIndex(item => item === fn), 1);
  };
  const setState = newState => {
    subs.forEach(sub => {
      sub(newState);
    });
  };
  return <Provider value={[state, setState, subscribe]}>{children}</Provider>;
};
