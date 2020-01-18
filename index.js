import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef
} from "react";

// https://github.com/facebook/react/issues/14110#issuecomment-446845886
export const Context = createContext({});

const { Provider } = Context;

// Helpers to get and set using the dot notation selector
const dotGet = (obj, sel) => {
  if (!sel) return obj;
  if (typeof sel === "function") return sel(obj);
  return sel.split(".").reduce((obj, i) => obj[i], obj);
};
const dotSet = (obj, sel, value) => {
  if (!sel) return value;
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

// TODO: test all of these methods to ensure there's no stale state in any
const createActions = (stateRef, sel, setState) => {
  const state = dotGet(stateRef.current, sel);

  // Generic one `setUser('Francisco')` - parses the multi-type value
  const setter = value => {
    const state = dotGet(stateRef.current, sel);
    while (typeof value === "function") {
      value = value(freeze(state));
    }
    return value && value.then ? value.then(setState) : setState(value);
  };

  if (Array.isArray(state)) {
    // Create a swallow clone of the array so that it can be mutated in place
    const mutate = mutation => {
      setter(prev => {
        const cloned = prev.slice();
        mutation(cloned);
        return cloned;
      });
    };

    // Mutation methods
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Mutator_methods
    setter.fill = (...args) => mutate(prev => prev.fill(...args));
    setter.pop = (...args) => mutate(prev => prev.pop(...args));
    setter.push = (...args) => mutate(prev => prev.push(...args));
    setter.reverse = (...args) => mutate(prev => prev.reverse(...args));
    setter.shift = (...args) => mutate(prev => prev.shift(...args));
    setter.sort = (...args) => mutate(prev => prev.sort(...args));
    setter.splice = (...args) => mutate(prev => prev.splice(...args));
    setter.unshift = (...args) => mutate(prev => prev.unshift(...args));

    // Change the array in some immutable way. Helpers to make it easier
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Accessor_methods
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Iteration_methods
    setter.concat = (...args) => setter(prev => prev.concat(...args));
    setter.slice = (...args) => setter(prev => prev.slice(...args));
    setter.filter = (...args) => setter(prev => prev.filter(...args));
    setter.map = (...args) => setter(prev => prev.map(...args));
    setter.reduce = (...args) => setter(prev => prev.reduce(...args));
    setter.reduceRight = (...args) => setter(prev => prev.reduceRight(...args));

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
  setter.add = num => setter(prev => prev + num);

  return setter;
};

// Rerender whatever is listening when there's a change in the state fragment
// derived from the selector, which might happen because of a state change or
// because of a selector change
const useSubscription = (sel = state => state) => {
  const { state, subscribe } = useContext(Context);
  const init = dotGet(state.current, sel);
  const [_, update] = useState({});

  const selRef = useRef(sel);
  const subRef = useRef(null);

  useEffect(() => {
    // New selector, reset it, unsubscribe from the old one and leave it empty
    // for the next subscription
    if (selRef.current !== sel) {
      // console.log("A", sel.toString(), selRef.current.toString());
      // console.log("RESET", selRef.current, sel);
      selRef.current = sel;
      if (subRef.current) subRef.current();
      subRef.current = null;
    }

    if (!subRef.current) {
      subRef.current = subscribe(old => {
        // console.log("B", sel.toString());
        // console.log("Subscription", selRef.current, sel, old, state);
        const oldFragment = dotGet(old, selRef.current);
        const newFragment = dotGet(state.current, selRef.current);
        if (oldFragment === newFragment) return;
        // console.log("CHANGED:", oldFragment, newFragment);
        // console.log("Current:", state.current);
        update({});
      });
    }
    return () => {
      if (subRef.current) subRef.current();
    };
  }, []);
};

export const useSelector = (sel = state => state) => {
  const { state } = useContext(Context);
  return freeze(dotGet(state.current, sel));
};

export const useActions = sel => {
  useSubscription(sel);
  const { state, setState } = useContext(Context);
  // console.log("useActions", sel, state);
  const callback = createActions(state, sel, value => {
    setState(dotSet(state.current, sel, value));
  });
  return useCallback(callback, [sel]);
};

export const useStore = name => [useSelector(name), useActions(name)];

export default ({ children, ...initial }) => {
  const state = useRef(initial);
  const subs = [];
  const subscribe = fn => {
    subs.push(fn);
    // Unsubscribe in the callback
    return () => subs.splice(subs.findIndex(item => item === fn), 1);
  };
  const setState = newState => {
    const old = state.current;
    // console.log("BEGIN", old, newState);
    state.current = newState;
    subs.forEach(sub => sub(old));
    // console.log("DONE", old, newState);
  };
  return <Provider value={{ state, setState, subscribe }}>{children}</Provider>;
};
