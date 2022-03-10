function map<I extends [...any[]], F>(inputs: I, map: F): MapOutput<I, F> {
  return null as any
}

type MapOutput<I extends any[], F> = any;

type Wrapped<T> = { val: T };
function wrap<T>(val: T): Wrapped<T> {
  return { val };
}

// Not working :(
type Wrapout<I, F> = 
  F extends (i: I) => infer O 
    ? O
    : never;

type X = Wrapout<number, typeof wrap>;

type Y = Wrapout<number, ((i: number) => string) | ((i: string) => number)>;

const c: X = { val: 3 };
const i1: X = { val: "string" };
const i2: X = 3;

const y: Y = 3;
const y2: Y = "foo";

const correct: [Wrapped<number>, Wrapped<string>] = map([1, "foo"], wrap);
const incorrect: [Wrapped<number>, Wrapped<number>] = map([1, "foo"], wrap);
