// tuple types
type Tail<T extends any[]> = T extends [h: infer H, ...t: infer TAIL] ? TAIL : never;
type Head<T extends any[]> = T extends [h: infer H, ...t: infer TAIL] ? H : never;

type ChainResult<F> =
  F extends [(i: infer I) => any, ...any[], (i_: any) => infer O]
    ? (i: I) => O
    : never;
// Error case
// This should be given a chain tuple where the error is in the first 2 arguments.
// If the first argument is invalid (i.e. not a unary function), then this
// will return a tuple with a unary function as head.
// If the first argument is valid, then we assume the second is invalid, and will
// return a tuple with valid first 2 arguments.
// E.g.:
// ChainError<[3]> = [any => any];
// ChainError<[I => O1, I2 => O2]> = [I => O1, O1 => any];
type ChainError<T extends any[]> =( 
  T extends [(i1: infer I) => infer O1, ...(infer REST)]
    ? [(i1: I) => O1, (i2: O1) => any, ...any[]]
    : [(i1: any) => any, ...any[]]
)

/**
 * Chain guard. When valid, output is same as input. When not valid, output matches input up to error
 */
type FunctionChain<T> =
  T extends [(i: infer I) => infer O] // Base case: single function.
    ? T
    : (
      // Recursive case: test if the first 2 functions are valid
      T extends [(i1: infer I) => infer O1, (i2: infer O1) => infer O2, ...(infer REST)]
        // And then recurse
        ? [Head<T>, ...FunctionChain<Tail<T>>]
        : ChainError<T>
      )

function chain<T extends any[]>(...funcs: FunctionChain<T>) : ChainResult<T> {
  return null as any;
}

chain((i: string) => 3);
const x = chain((i: string) => 3, (i: number) => i);
chain((i: string) => 3, (i: string) => i);
chain((i: string) => 3, (i: number) => i, (i: number) => i, (i: number) => i);
chain((i: string) => 3, (i: number) => i, (i: number) => i, (i: number) => i, (i: string) => i, (i:string) => i);
chain(3);
chain((i: string, j: number) => i);
chain();

const y: number = x("foo");
const y2: string = x("foo");
x(3);

const double = (i: number) => i * 2;
