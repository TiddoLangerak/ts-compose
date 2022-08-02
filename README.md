# DISCLAIMER
The approach described below here is not complete, and probably better not used in anything production facing at the moment.

# Intended types: a new way to type function composition

## Introduction
A `pipe` function allows one to pipe/compose functions together:

```js
const double = (x) => x * 2;
const plusOne = (x) => x + 1;
const doubleAndPlusOne = pipe(double, plusOne);
```

Unfortunately, the pipe function and it's relatives (e.g. compose) are hard to type. The type of such a function should be something like this:

```ts
function chain<I, O1, O2, ...., R>(f1: (i: I) => O1, f2: (O1) => O2, ...., fn: (On) => R) : R {
  // snip
}
```

There's a problem however: this naive implementation has a variable number of template variables, and is potentially infinitely long. Neither of this is possible in TS. Therefore, commonly you'll see that functions like these get hardcoded typedefinitions for up to `n` arguments, or skip on typechecking altogether with the `any` type. But, I believe we can do better.

For the last couple of years I've been trying to solve this problem on and off, and I think I finally got it!

## Beyond infinity: a different approach to type definitions
Normally when we're creating types, we use types as a "blueprint". This blueprint tells typescript what to accept and what to reject, and then we let typescript do the typechecking. However, these do not work well with infinity: we can't create an inifite-sized blueprint. In some special cases, we can use some workarounds to effectively create an inifinite-sized blueprint, but this tends to only work for homogeneous types (i.e. finite set of generic parameters), not for heterogeneous types (infinite set of generic parameters, like our chain function).

So to type infinite heterogeneous types, we need a different approach. Instead of creating a blueprint, we would want to create a procedure that can validate the type once it's used. But how can we do that? This procedure must be written fully in the type system!

## Type intentions
To validate a type ourselves, at the very least we need some form of conditionals. Fortunately, typescript supports those with the `extends` clause. With that, we can create our first template for a procedure. Let's start simple, let's write a procedure that validates a String:

```ts
type ValidateString<S> =
  S extends string
    ? S
    : never
```

The way this works is that `ValidateString` is an "identity" type for string types. I.e. if you pass some string type to `ValidateString`, then it'll return the same type unchanged. E.g. `ValidateString<string> = string` and `ValidateString<"foo"> = "Foo"`.
If however you pass something that's NOT a string, then you'll get `never`: `ValidateString<number> = never`.

To see it in action, consider this:
```ts
const s : ValidateString<"foo"> = "foo"; // no error
const n : ValidateString<number> = 3; // type `number` is not assignable to type `never`
```

Now the above example is a bit silly, but when used in a generic function this becomes more useful:

```ts
function takeString<S>(s: ValidateString<S>) {}
takeString("foo"); // fine
takeString(3); // type `number` is not assignable to parameter of type `never`
```

So far, we still haven't done anything that we couldn't already do in Typescript, but we have found a new method to do typechecking. Now, let's try to use this to dynamically type a 2-argument chain function. What we want to implement is this:

```ts
function chain2<F extends any[]>(...funcs: ValidateFunctionChain2<F>) {}
```

We haven't hardcoded 2 arguments here, but we're going to do that in our validation. Let's use the same approach as before:

```ts
type ValidateFunctionChain2<F> =
  F extends [(i: infer I) => infer O1, (i2: infer O1) => infer O2]
    ? F
    : never;
```
Note the use of `infer` here: we don't know the types of the function ahead of time, but on the RHS of `extends` we can use `infer` to let typescript figure this out. So in our condition, we ask typescript to figure out 3 types (`I`, `O1`, `O2`) and construct a valid function chain from this.

And indeed, this is working as expected:

```ts
function strlen(i: string) : number { return i.length; }
function double(i: number) : number { return i * 2; }

const doubleStringLength = chain2(strlen, double); // No error
const invalid = chain2(double, strlen); // Error
```

However, there's one small annoyance here: in the invalid case, we get an error on the _first_ argument. Moreover, the error isn't very descriptive to tell us what's wrong, it just tells that we can't assign to `never`. Let's fix this:

As you might've noticed, the "else" branch is used as "error type": if the input is invalid, then the "else" branch becomes the expected type. So far we've used `never` - since nothing can be assigned to `never` - but we can also return some different type here. The only catch is that this type MUST be a valid type as well, and moreover it must NOT match the actual input type.

Now it's important to note here that if we get to the error branch, we don't actually know if we got a list of functions to begin with, or if the functions where valid. So we first need to check that. Also, I'll use a helper type to not overcomplicate the `ValidateFunctionChain2`:

```ts
type ValidateFunctionChain2Error<F> =
  // We first check if our function chain at least has a valid function as first argument
  F extends [(i: infer I) => infer O1, any]
    // If it does, then we can return some type that (partially) fills in the intended type of the second parameter
    ? [(i: I) => O1, (i2: O1) => any]
    // If it doesn't, then we'll need to signal that we expect 2 functions
    : [(i: any) => any, (i2: any) => any];
```

And now we can replace our `never` with this error:
```ts
type ValidateFunctionChain2<F> =
  F extends [(i: infer I) => infer O1, (i2: infer O1) => infer O2]
    ? F
    : ValidateFunctionChain2Error<F>;
```

And if we now use some invalid arguments, then we get a beautiful error message:
```ts
const invalid = chain2(double, strlen);
//                             ~~~~~~
// Argument of type '(i: string) => number' is not assignable to parameter of type '(i2: number) => any'.
const invalid2 = chain2(3);
//               ~~~~~~~~
// Expected 2 arguments, but got 1
const invalid3 = chain2(3, 4);
//                      ~
// Argument of type '(i: string) => number' is not assignable to parameter of type '(i2: number) => any'.
```

So just to recap how this works:
- If our arguments form a valid function chain, then `ValidateFunctionChain2` returns the type of the passed in function chain.
- If our arguments do NOT form a valid function chain, then `ValidateFunctionChain2` returns the _intended_ signature of the function chain. This won't match the actual signature, and thus we'll get a meaningful error.

## Recursion

Now that we can validate 2 arguments, we just need to extends it for `n` arguments with the help of some recursion:

```ts
type FunctionChain<T> =
  T extends [(i: infer I) => infer O] // Base case: single function
    ? T
    : (
      // Recursive case: test if the first 2 functions are matching
      T extends [(i1: infer I) => infer O1, (i2: infer O1) => infer O2, ...(infer REST)]
        // And then recurse
        ? [Head<T>, ...FunctionChain<Tail<T>>]
        : ChainError<T>
      )
```

For the full implementation of all helpers, see `chain.ts`

## Footnotes
1. After writing this, I found out that this approach doesn't work with functions that themselves use generic types in their arguments. This approach will therefore unfortunately still not work very well, and at the moment just hardcoding for the first `n` arguments still seems to be the only realistic option.

2. In this blog, I've been talking about "returning" types from the intents, but this is not technically what's happening. We're not passing the types of our functions to the intent. Instead, as you can see from the signature, we bind the _result_ of the intent to our functions. So typescript effectively has to work backwards. I can't pretend to be knowledgeable enough to explain how exactly this works, but it does.

3. This will still hit recursion limits, around 30ish, but we can possibly improve on this.
