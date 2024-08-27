import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export let store = localStorage;

// https://github.com/facebook/react/issues/14110#issuecomment-446845886
export const Context = createContext({});

const { Provider } = Context;

// Helpers to get and set using the dot notation selector
const dotGet = (obj, sel) => {
  if (!sel) return obj;
  if (typeof sel === "function") return sel(obj);
  return sel.split(".").reduce((obj, key, i, keys) => {
    if (!obj) {
      const k = keys.slice(0, i).join(".");
      throw new Error(`Cannot read '${k}.${key}' since '${k}' is '${obj}'`);
    }
    return obj[key];
  }, obj);
};

const dotSet = (obj, sel, value) => {
  if (!sel) return value;
  const [key, ...rest] = sel.split(".");
  const subSel = rest.join(".");
  const subValue = subSel ? dotSet(obj[key], subSel, value) : value;
  if (Array.isArray(obj)) {
    return obj.map((item, i) => (i === Number(key) ? subValue : item));
  }
  return { ...obj, [key]: subValue };
};

// Deep freeze any object
const freeze = (obj) => {
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
const createActions = (ref, sel, setState) => {
  const state = dotGet(ref.current, sel);

  // Generic one `setUser('Francisco')` - parses the multi-type value
  const setter = (value) => {
    const state = dotGet(ref.current, sel);
    while (typeof value === "function") {
      value = value(freeze(state));
    }
    const setState2 = (value) => setState(dotSet(ref.current, sel, value));
    return value && value.then ? value.then(setState2) : setState2(value);
  };

  if (Array.isArray(state)) {
    // Create a swallow clone of the array so that it can be mutated in place
    const mutate = (mutation) => {
      setter((prev) => {
        const cloned = prev.slice();
        mutation(cloned);
        return cloned;
      });
    };

    // Mutation methods
    // It cannot be e.g. (...args) => setter(prev => prev.slice().pop(...args)) // because we don't want to set it to the result of the operation;
    // we want to set it to the mutated array, and then return the result of
    // the operation. See the mutate() method above
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Mutator_methods
    setter.fill = (...args) => mutate((prev) => prev.fill(...args));
    setter.pop = (...args) => mutate((prev) => prev.pop(...args));
    setter.push = (...args) => mutate((prev) => prev.push(...args));
    setter.reverse = (...args) => mutate((prev) => prev.reverse(...args));
    setter.shift = (...args) => mutate((prev) => prev.shift(...args));
    setter.sort = (...args) => mutate((prev) => prev.sort(...args));
    setter.splice = (...args) => mutate((prev) => prev.splice(...args));
    setter.unshift = (...args) => mutate((prev) => prev.unshift(...args));

    // Change the array in some immutable way. Helpers to make it easier
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Accessor_methods
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Iteration_methods
    setter.concat = (...args) => setter((prev) => prev.concat(...args));
    setter.slice = (...args) => setter((prev) => prev.slice(...args));
    setter.filter = (...args) => setter((prev) => prev.filter(...args));
    setter.map = (...args) => setter((prev) => prev.map(...args));
    setter.reduce = (...args) => setter((prev) => prev.reduce(...args));
    setter.reduceRight = (...args) =>
      setter((prev) => prev.reduceRight(...args));

    // Aliases
    setter.append = setter.push;
    setter.prepend = setter.unshift;
    setter.remove = (index) => setter.splice(Number(index), 1);
  } else if (typeof state === "object") {
    setter.assign = (...args) => setter(Object.assign({}, state, ...args));
    setter.remove = (...args) => setter(exclude(state, args));
    setter.extend = setter.assign;
  } else if (typeof state === "number") {
    // Numbers
    setter.add = (num) => setter((prev) => prev + num);
    setter.substract = (num) => setter((prev) => prev - num);
  }

  return setter;
};

// Rerender whatever is listening when there's a change in the state fragment
// derived from the selector, which might happen because of a state change or
// because of a selector change
export const useSelector = (sel = (state) => state) => {
  const { state, subscribe } = useContext(Context);

  // By using a function, we only trigger dotGet() on the first render,
  // so we avoid calling a potentially expensive operation too often
  const [, forceUpdate] = useState();

  useEffect(() => {
    // The unsubscribe() is the returned value
    return subscribe((old) => {
      try {
        // const fragment = dotGet(state.current, sel);
        // console.log("Subscription", sel.toString());
        // console.log("Update:", old, "->", state.current);
        if (dotGet(old, sel) === dotGet(state.current, sel)) return;
        // Need to empty catch because some times the child will do a render
        // before the parent has removed that child, having invalid state and
        // throwing: https://kaihao.dev/posts/Stale-props-and-zombie-children-in-Redux
        forceUpdate({});
      } catch (error) {}
    });
  }, [sel]);

  const slice = dotGet(state.current, sel);
  return useMemo(() => freeze(slice), [slice]);
};

export const useActions = (sel) => {
  useSelector(sel);
  const { state, setState } = useContext(Context);
  const callback = createActions(state, sel, setState);
  return useCallback(callback, [sel]);
};

export const useStore = (sel) => {
  const slice = useSelector(sel);
  const setter = useActions(sel);
  return useMemo(() => [slice, setter], [slice, setter]);
};

const Listener = ({ id }) => {
  const value = useSelector(id);
  useEffect(() => {
    store[id] = JSON.stringify(value);
  }, [value]);
  return null;
};

export default ({ children, ...initial }) => {
  const persist = Object.keys(initial)
    .filter((k) => k.startsWith("$"))
    .map((k) => {
      const id = k.slice(1);
      initial[id] = store[id] ? JSON.parse(store[id]) : initial[k];
      delete initial[k];
      return id;
    });
  const state = useRef(initial);
  const subs = [];
  const subscribe = (fn) => {
    subs.push(fn);
    // Unsubscribe in the callback
    return () =>
      subs.splice(
        subs.findIndex((item) => item === fn),
        1
      );
  };

  // Update the global, full state. This should trigger a re-render cascade on
  // all the subscriptions that are active
  const setState = (updated) => {
    const old = state.current;
    state.current = updated;
    // Reverse-iterate the array
    subs.reduceRight((_, sub) => sub(old), null);
  };
  return (
    <Provider value={{ state, setState, subscribe }}>
      {persist.map((id) => (
        <Listener key={id} id={id} />
      ))}
      {children}
    </Provider>
  );
};
