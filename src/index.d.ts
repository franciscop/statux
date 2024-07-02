type SortCb = (a: any, b: any) => number;

type PropertyType = any[] | any;

type ArrayElement<ArrayType extends unknown[]> =
  ArrayType extends (infer ElementType)[] ? ElementType : never;

declare interface ArraySetter<Value extends unknown[]> {
  (newValue: Value | ((prev: Value) => Value)): Value;
  fill: (value: any, start?: number, end?: number) => Value;
  pop: () => Value;
  push: (...items: Value) => Value;
  reverse: () => Value;
  shift: () => Value;
  sort: (compareFn?: ((a: any, b: any) => number) | undefined) => Value;
  splice: (start: number, deleteCount?: number, ...items: Value) => Value;
  unshift: (...items: Value) => Value;
  append: (...items: Value) => Value;
  prepend: (...items: Value) => Value;

  concat: (...items: Value) => Value;
  slice: (start?: number | undefined, end?: number | undefined) => Value;
  filter: (fn: (value: any, index: number, array: Value) => any) => Value;
  map: (
    fn: (value: any, index: number, array: Value) => ArrayElement<Value>
  ) => Value;
  reduce: (
    fn: (
      previous: Value,
      current: ArrayElement<Value>,
      index: number,
      array: Value
    ) => Value,
    initial: Value
  ) => Value;
  reduceRight: (
    fn: (
      previous: Value,
      current: ArrayElement<Value>,
      index: number,
      array: Value
    ) => Value,
    initial: Value
  ) => Value;
  remove: (index: number) => Value;
}

declare interface NumberSetter<Value> {
  (newValue: Value | ((prev: Value) => Value)): Value;
  add: (value: number) => Value;
  substract: (value: number) => Value;
}

declare interface ObjectSetter<Value> {
  (newValue: Value | ((prev: Value) => Value)): Value;
  remove: (key: string) => Value;
  assign: (extra: {}) => Value;
  extend: (extra: {}) => Value;
}

declare interface UnknownSetter<Value> {
  (newValue: Value | ((prev: Value) => Value)): Value;
  [key: string]: (...args: any[]) => Value;
}

type Setter<Value> = Value extends any[]
  ? ArraySetter<Value>
  : Value extends Number
  ? NumberSetter<Value>
  : Value extends Object
  ? ObjectSetter<Value>
  : UnknownSetter<Value>;

type Selector<Value> = string | ((state: any) => Value);

export declare function useStore<Value>(sel?: string): [Value, Setter<Value>];
export declare function useSelector<Value>(sel?: Selector<Value>): Value;
export declare function useActions<Value>(sel?: Selector<Value>): Setter<Value>;
export default function Store() {}
