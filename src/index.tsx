import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export let store: Storage = localStorage;

// Types for the setters
type ArrayElement<ArrayType extends unknown[]> =
  ArrayType extends (infer ElementType)[] ? ElementType : never;

export interface ArraySetter<Value extends unknown[]> {
  (newValue: Value | ((prev: Value) => Value)): void;
  fill: (value: any, start?: number, end?: number) => Value;
  pop: () => Value;
  push: (...items: Value) => Value;
  reverse: () => Value;
  shift: () => Value;
  sort: (compareFn?: (a: any, b: any) => number) => Value;
  splice: (start: number, deleteCount?: number, ...items: Value) => Value;
  unshift: (...items: Value) => Value;
  append: (...items: Value) => Value;
  prepend: (...items: Value) => Value;
  concat: (...items: Value) => Value;
  slice: (start?: number, end?: number) => Value;
  filter: (fn: (value: any, index: number, array: Value) => any) => Value;
  map: (
    fn: (value: any, index: number, array: Value) => ArrayElement<Value>,
  ) => Value;
  reduce: (
    fn: (
      previous: Value,
      current: ArrayElement<Value>,
      index: number,
      array: Value,
    ) => Value,
    initial: Value,
  ) => Value;
  reduceRight: (
    fn: (
      previous: Value,
      current: ArrayElement<Value>,
      index: number,
      array: Value,
    ) => Value,
    initial: Value,
  ) => Value;
  remove: (index: number) => Value;
}

export interface NumberSetter<Value> {
  (newValue: Value | ((prev: Value) => Value)): void;
  add: (value: number) => Value;
  substract: (value: number) => Value;
}

export interface ObjectSetter<Value> {
  (newValue: Value | ((prev: Value) => Value)): void;
  remove: (key: string) => Value;
  assign: (extra: object) => Value;
  extend: (extra: object) => Value;
}

export interface UnknownSetter<Value> {
  (newValue: Value | ((prev: Value) => Value)): void;
  [key: string]: (...args: any[]) => Value;
}

export type Setter<Value> = Value extends any[]
  ? ArraySetter<Value>
  : Value extends Number
    ? NumberSetter<Value>
    : Value extends Object
      ? ObjectSetter<Value>
      : UnknownSetter<Value>;

export type Selector<Value> = string | ((state: any) => Value);

// Context type
interface StoreContextType {
  state: React.MutableRefObject<any>;
  setState: (updated: any) => void;
  subscribe: (fn: (old: any) => void) => () => void;
}

// https://github.com/facebook/react/issues/14110#issuecomment-446845886
export const Context = createContext<StoreContextType>({} as StoreContextType);

const { Provider } = Context;

// Helpers to get and set using the dot notation selector
const dotGet = (obj: any, sel: any): any => {
  if (!sel) return obj;
  if (typeof sel === "function") return sel(obj);
  return sel
    .split(".")
    .reduce((obj: any, key: string, i: number, keys: string[]) => {
      if (!obj) {
        const k = keys.slice(0, i).join(".");
        throw new Error(`Cannot read '${k}.${key}' since '${k}' is '${obj}'`);
      }
      return obj[key];
    }, obj);
};

const dotSet = (obj: any, sel: string, value: any): any => {
  if (!sel) return value;
  const [key, ...rest] = sel.split(".");
  const subSel = rest.join(".");
  const subValue = subSel ? dotSet(obj[key], subSel, value) : value;
  if (Array.isArray(obj)) {
    return obj.map((item: any, i: number) =>
      i === Number(key) ? subValue : item,
    );
  }
  return { ...obj, [key]: subValue };
};

// Deep freeze any object
const freeze = (obj: any): any => {
  if (typeof obj !== "object") return obj;
  if (Object.isFrozen(obj)) return obj;
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (Array.isArray(obj) && key === "length") continue;
    obj[key] = typeof obj[key] === "object" ? freeze(obj[key]) : obj[key];
  }
  return Object.freeze(obj);
};

const exclude = (obj: any, keys: string[]): any => {
  const newObj: any = {};
  for (const key in obj) {
    if (!keys.includes(key)) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
};

// TODO: test all of these methods to ensure there's no stale state in any
const createActions = (
  ref: React.MutableRefObject<any>,
  sel: any,
  setState: (updated: any) => void,
): any => {
  const state = dotGet(ref.current, sel);

  // Generic one `setUser('Francisco')` - parses the multi-type value
  const setter: any = (value: any) => {
    const state = dotGet(ref.current, sel);
    while (typeof value === "function") {
      value = value(freeze(state));
    }
    const setState2 = (value: any) => setState(dotSet(ref.current, sel, value));
    return value && value.then ? value.then(setState2) : setState2(value);
  };

  if (Array.isArray(state)) {
    // Create a shallow clone of the array so that it can be mutated in place
    const mutate = (mutation: (arr: any) => void) => {
      setter((prev: any) => {
        const cloned = prev.slice();
        mutation(cloned);
        return cloned;
      });
    };

    // Mutation methods
    setter.fill = (...args: any[]) => mutate((prev: any) => prev.fill(...args));
    setter.pop = (...args: any[]) => mutate((prev: any) => prev.pop(...args));
    setter.push = (...args: any[]) => mutate((prev: any) => prev.push(...args));
    setter.reverse = (...args: any[]) =>
      mutate((prev: any) => prev.reverse(...args));
    setter.shift = (...args: any[]) =>
      mutate((prev: any) => prev.shift(...args));
    setter.sort = (...args: any[]) => mutate((prev: any) => prev.sort(...args));
    setter.splice = (...args: any[]) =>
      mutate((prev: any) => prev.splice(...args));
    setter.unshift = (...args: any[]) =>
      mutate((prev: any) => prev.unshift(...args));

    // Immutable helpers
    setter.concat = (...args: any[]) =>
      setter((prev: any) => prev.concat(...args));
    setter.slice = (...args: any[]) =>
      setter((prev: any) => prev.slice(...args));
    setter.filter = (...args: any[]) =>
      setter((prev: any) => prev.filter(...args));
    setter.map = (...args: any[]) => setter((prev: any) => prev.map(...args));
    setter.reduce = (...args: any[]) =>
      setter((prev: any) => prev.reduce(...args));
    setter.reduceRight = (...args: any[]) =>
      setter((prev: any) => prev.reduceRight(...args));

    // Aliases
    setter.append = setter.push;
    setter.prepend = setter.unshift;
    setter.remove = (index: number) => setter.splice(Number(index), 1);
  } else if (typeof state === "object") {
    setter.assign = (...args: any[]) =>
      setter(Object.assign({}, state, ...args));
    setter.remove = (...args: any[]) => setter(exclude(state, args));
    setter.extend = setter.assign;
  } else if (typeof state === "number") {
    setter.add = (num: number) => setter((prev: number) => prev + num);
    setter.substract = (num: number) => setter((prev: number) => prev - num);
  }

  return setter;
};

// Rerender whatever is listening when there's a change in the state fragment
// derived from the selector, which might happen because of a state change or
// because of a selector change
export const useSelector = <Value = any,>(sel?: Selector<Value>): Value => {
  const effectiveSel = sel ?? ((state: any) => state);
  const { state, subscribe } = useContext(Context);

  // By using a function, we only trigger dotGet() on the first render,
  // so we avoid calling a potentially expensive operation too often
  const [, forceUpdate] = useState<object>();

  useEffect(() => {
    // The unsubscribe() is the returned value
    return subscribe((old) => {
      try {
        if (dotGet(old, effectiveSel) === dotGet(state.current, effectiveSel))
          return;
        // Need to empty catch because some times the child will do a render
        // before the parent has removed that child, having invalid state and
        // throwing: https://kaihao.dev/posts/Stale-props-and-zombie-children-in-Redux
        forceUpdate({});
      } catch (error) {}
    });
  }, [sel]);

  const slice = dotGet(state.current, effectiveSel);
  return useMemo(() => freeze(slice), [slice]);
};

export const useActions = <Value = any,>(
  sel?: Selector<Value>,
): Setter<Value> => {
  useSelector(sel);
  const { state, setState } = useContext(Context);
  const callback = createActions(state, sel, setState);
  return useCallback(callback, [sel]) as Setter<Value>;
};

export const useStore = <Value = any,>(
  sel?: string,
): [Value, Setter<Value>] => {
  const slice = useSelector<Value>(sel);
  const setter = useActions<Value>(sel);
  return useMemo(() => [slice, setter], [slice, setter]) as [
    Value,
    Setter<Value>,
  ];
};

interface ListenerProps {
  id: string;
}

const Listener = ({ id }: ListenerProps) => {
  const value = useSelector(id);
  useEffect(() => {
    store[id] = JSON.stringify(value);
  }, [value]);
  return null;
};

interface StoreProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default ({ children, ...initial }: StoreProps) => {
  const persist = Object.keys(initial)
    .filter((k) => k.startsWith("$"))
    .map((k) => {
      const id = k.slice(1);
      initial[id] = store[id] ? JSON.parse(store[id]) : initial[k];
      delete initial[k];
      return id;
    });
  const state = useRef(initial);
  const subs: Array<(old: any) => void> = [];
  const subscribe = (fn: (old: any) => void) => {
    subs.push(fn);
    // Unsubscribe in the callback
    return () =>
      subs.splice(
        subs.findIndex((item) => item === fn),
        1,
      );
  };

  // Update the global, full state. This should trigger a re-render cascade on
  // all the subscriptions that are active
  const setState = (updated: any) => {
    const old = state.current;
    state.current = updated;
    // Reverse-iterate the array
    for (let i = subs.length - 1; i >= 0; i--) {
      subs[i](old);
    }
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
