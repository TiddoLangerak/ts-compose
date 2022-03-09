// tuple types
type Tail<T extends any[]> = T extends [h: infer H, ...t: infer TAIL] ? TAIL : never;
type Head<T extends any[]> = T extends [h: infer H, ...t: infer TAIL] ? H : never;

// Util to force an infered argument to be an array
type InferArray<T extends any[]> = T;

// A tuple with a valid chain head, i.e. where the output of the first function is accepted as input of the second function
type ChainTuple2<I, O1, O2, REST extends any[]> = [
  h1: (i: I) => O1,
  h2: (i: O1) => O2,
  ...rest: REST
];

type ChainTuple1<I, O, REST extends any[]> = [
  h: (i: I) => O,
  ...rest: REST
];

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
  T extends ChainTuple1<infer I, infer O1, infer R>
    ? ChainTuple2<I, O1, any, any[]> 
    : ChainTuple1<any, any, any[]>
)

type IntentFunctionChainTail<T extends any[]> = 
  // Validate the tail, and capture the result in ValidatedTail
  // (Impl note: we use `extends infer T` to assign the result to `T`.
  //  However, we require it to be an array, so we constrain it with `InferArray`)
  IntentFunctionChain<Tail<T>> extends InferArray<infer ValidatedTail>
  ? (
    // If the tail is valid, then ValidatedTail will match the actual tail
    // We use extends as an == sign here.
    // I.e. we compare the tail with the validated version of the tail
    Tail<T> extends ValidatedTail
    // If the tail is validated, then we're good to go, and can return our input unchanged.
    ? T
    // If the tail is NOT valid, then we need to construct our validated version of the tail, such that we get the error at the right place
    : [Head<T>, ...ValidatedTail]
  )
  : never

/**
 * Chain guard. When valid, output is same as input. When not valid, output matches input up to error
 */
type IntentFunctionChain<T extends any[]> =
  T extends [(i: infer I) => infer O] // Base case: single function.
    ? T
    : (
      // Recursive case: test if the first 2 functions are valid
      T extends [(i1: infer I) => infer O1, (i2: infer O1) => infer O2, ...(infer REST)]
        ? IntentFunctionChainTail<T>
        : ChainError<T>
      )

function chain<T extends any[]>(...funcs: IntentFunctionChain<T>) {}

chain((i: string) => 3);
chain((i: string) => 3, (i: number) => i);
chain((i: string) => 3, (i: string) => i);
chain((i: string) => 3, (i: number) => i, (i: number) => i, (i: number) => i);
chain((i: string) => 3, (i: number) => i, (i: number) => i, (i: number) => i, (i: string) => i, (i:string) => i);
chain(3);
chain((i: string, j: number) => i);
chain();


