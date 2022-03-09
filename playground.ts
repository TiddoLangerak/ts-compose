type ValidateString<A> = 
  A extends string
    ? A
    : never;

function takeString<A>(a: ValidateString<A>) {}

takeString("foo");
takeString(3);

type ValidateFunctionChain2Error<F> =
  F extends [(i: infer I) => infer O1, any]
    ? [(i: I) => O1, (i2: O1) => any]
    : [(i: any) => any, (i2: any) => any];

type ValidateFunctionChain2<F> =
  F extends [(i: infer I) => infer O1, (i2: infer O1) => infer O2]
    ? F
    : ValidateFunctionChain2Error<F>;

function chain2<F extends any[]>(...funcs: ValidateFunctionChain2<F>) {}

function strlen(i: string) : number { return i.length; }
function double(i: number) : number { return i * 2; }

const doubleStringLength = chain2(strlen, double);
const invalid = chain2(double, strlen);
const invalid2 = chain2(3);
const invalid3 = chain2(3, 4);
