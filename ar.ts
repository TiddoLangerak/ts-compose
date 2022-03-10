type N = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

class __marker {};
type Drop<A extends any[], N extends keyof A> =
  A & { [key in N]: __marker } extends [...(infer H), __marker & infer P, ...(infer T)]
    ? [P, ...T]
    : never;

type D = Drop<N, 3>;
const x : D = [1,2,3];
const x2 : D = [3, 4, 5, 6, 7, 8, 9, 10];
const x3 : D = "Asdf";

function take(n: never) {};

take(null as any as Drop<N, 3>);
