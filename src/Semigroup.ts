/**
 * If a type `A` can form a `Semigroup` it has an **associative** binary operation.
 *
 * ```ts
 * interface Semigroup<A> {
 *   readonly concat: (second: A) => (first: A) => A
 * }
 * ```
 *
 * Associativity means the following equality must hold for any choice of `x`, `y`, and `z`.
 *
 * ```ts
 * x |> concat(y |> concat(z)) <-> x |> concat(y) |> concat(z)
 * ```
 *
 * @since 3.0.0
 */
import { Endomorphism } from './function'
import { Magma } from './Magma'
import { max, min, Ord } from './Ord'

/**
 * @category type classes
 * @since 3.0.0
 */
export interface Semigroup<A> extends Magma<A> {}

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

/**
 * Given a sequence of `as`, concat them and return the total.
 *
 * If `as` is empty, return the provided `startWith` value.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 *
 * const sum = S.fold(S.semigroupSum)(0)
 *
 * assert.deepStrictEqual(sum([1, 2, 3]), 6)
 * assert.deepStrictEqual(sum([]), 0)
 *
 * @since 3.0.0
 */
export const fold = <A>(S: Semigroup<A>) => (startWith: A) => (as: ReadonlyArray<A>): A =>
  as.reduce((a, acc) => S.concat(acc)(a), startWith)

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

/**
 * The dual of a `Semigroup`, obtained by swapping the arguments of `concat`.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe('a', S.getDualSemigroup(S.semigroupString).concat('b')), 'ba')
 *
 * @category combinators
 * @since 3.0.0
 */
export const getDualSemigroup = <A>(S: Semigroup<A>): Semigroup<A> => ({
  concat: (second) => (first) => S.concat(first)(second)
})

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * Always return the first argument.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe(1, S.getFirstSemigroup<number>().concat(2)), 1)
 *
 * @category instances
 * @since 3.0.0
 */
export const getFirstSemigroup = <A = never>(): Semigroup<A> => ({
  concat: () => (first) => first
})

/**
 * Always return the last argument.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe(1, S.getLastSemigroup<number>().concat(2)), 2)
 *
 * @category instances
 * @since 3.0.0
 */
export const getLastSemigroup = <A = never>(): Semigroup<A> => ({
  concat: (second) => () => second
})

/**
 * Given a struct of semigroups returns a semigroup for the struct.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * interface Point {
 *   readonly x: number
 *   readonly y: number
 * }
 *
 * const semigroupPoint = S.getStructSemigroup<Point>({
 *   x: S.semigroupSum,
 *   y: S.semigroupSum
 * })
 *
 * assert.deepStrictEqual(pipe({ x: 1, y: 2 }, semigroupPoint.concat({ x: 3, y: 4 })), { x: 4, y: 6 })
 *
 * @category instances
 * @since 3.0.0
 */
export const getStructSemigroup = <A>(semigroups: { [K in keyof A]: Semigroup<A[K]> }): Semigroup<A> => ({
  concat: (second) => (first) => {
    const r: A = {} as any
    /* istanbul ignore next */
    for (const key in semigroups) {
      if (semigroups.hasOwnProperty(key)) {
        r[key] = semigroups[key].concat(second[key])(first[key])
      }
    }
    return r
  }
})

/**
 * Given a tuple of semigroups returns a semigroup for the tuple.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * const S1 = S.getTupleSemigroup(S.semigroupString, S.semigroupSum)
 * assert.deepStrictEqual(pipe(['a', 1], S1.concat(['b', 2])), ['ab', 3])
 *
 * const S2 = S.getTupleSemigroup(S.semigroupString, S.semigroupSum, S.semigroupAll)
 * assert.deepStrictEqual(pipe(['a', 1, true], S2.concat(['b', 2, false])), ['ab', 3, false])
 *
 * @category instances
 * @since 3.0.0
 */
export const getTupleSemigroup = <A extends ReadonlyArray<unknown>>(
  ...semigroups: { [K in keyof A]: Semigroup<A[K]> }
): Semigroup<A> => ({
  concat: (second) => (first) => semigroups.map((s, i) => s.concat(second[i])(first[i])) as any
})

/**
 * Unary functions form a semigroup as long as you can provide a semigroup for the codomain.
 *
 * @example
 * import { Predicate, pipe } from 'fp-ts/function'
 * import * as S from 'fp-ts/Semigroup'
 *
 * const f: Predicate<number> = (n) => n <= 2
 * const g: Predicate<number> = (n) => n >= 0
 *
 * const S1 = S.getFunctionSemigroup(S.semigroupAll)<number>()
 *
 * assert.deepStrictEqual(pipe(f, S1.concat(g))(1), true)
 * assert.deepStrictEqual(pipe(f, S1.concat(g))(3), false)
 *
 * const S2 = S.getFunctionSemigroup(S.semigroupAny)<number>()
 *
 * assert.deepStrictEqual(pipe(f, S2.concat(g))(1), true)
 * assert.deepStrictEqual(pipe(f, S2.concat(g))(3), true)
 *
 * @category instances
 * @since 3.0.0
 */
export const getFunctionSemigroup = <S>(S: Semigroup<S>) => <A = never>(): Semigroup<(a: A) => S> => ({
  concat: (second) => (first) => (a) => S.concat(second(a))(first(a))
})

/**
 * Get a semigroup where `concat` will return the minimum, based on the provided order.
 *
 * @example
 * import * as O from 'fp-ts/Ord'
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * const S1 = S.getMeetSemigroup(O.ordNumber)
 *
 * assert.deepStrictEqual(pipe(1, S1.concat(2)), 1)
 *
 * @category instances
 * @since 3.0.0
 */
export const getMeetSemigroup = <A>(O: Ord<A>): Semigroup<A> => ({
  concat: min(O)
})

/**
 * Get a semigroup where `concat` will return the maximum, based on the provided order.
 *
 * @example
 * import * as O from 'fp-ts/Ord'
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * const S1 = S.getJoinSemigroup(O.ordNumber)
 *
 * assert.deepStrictEqual(pipe(1, S1.concat(2)), 2)
 *
 * @category instances
 * @since 3.0.0
 */
export const getJoinSemigroup = <A>(O: Ord<A>): Semigroup<A> => ({
  concat: max(O)
})

/**
 * Return a semigroup for objects, preserving their type.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * interface Person {
 *   name: string
 *   age: number
 * }
 *
 * const S1 = S.getObjectSemigroup<Person>()
 * assert.deepStrictEqual(pipe({ name: 'name', age: 23 }, S1.concat({ name: 'name', age: 24 })), { name: 'name', age: 24 })
 *
 * @category instances
 * @since 3.0.0
 */
export const getObjectSemigroup = <A extends object = never>(): Semigroup<A> => ({
  concat: (second) => (first) => Object.assign({}, first, second)
})

/**
 * `boolean` semigroup under conjunction.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe(true, S.semigroupAll.concat(true)), true)
 * assert.deepStrictEqual(pipe(true, S.semigroupAll.concat(false)), false)
 *
 * @category instances
 * @since 3.0.0
 */
export const semigroupAll: Semigroup<boolean> = {
  concat: (second) => (first) => first && second
}

/**
 * `boolean` semigroup under disjunction.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe(true, S.semigroupAny.concat(true)), true)
 * assert.deepStrictEqual(pipe(true, S.semigroupAny.concat(false)), true)
 * assert.deepStrictEqual(pipe(false, S.semigroupAny.concat(false)), false)
 *
 * @category instances
 * @since 3.0.0
 */
export const semigroupAny: Semigroup<boolean> = {
  concat: (second) => (first) => first || second
}

/**
 * `number` semigroup under addition.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe(2, S.semigroupSum.concat(3)), 5)
 *
 * @category instances
 * @since 3.0.0
 */
export const semigroupSum: Semigroup<number> = {
  concat: (second) => (first) => first + second
}

/**
 * `number` semigroup under multiplication.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe(2, S.semigroupProduct.concat(3)), 6)
 *
 * @category instances
 * @since 3.0.0
 */
export const semigroupProduct: Semigroup<number> = {
  concat: (second) => (first) => first * second
}

/**
 * `string` semigroup under concatenation.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe('a', S.semigroupString.concat('b')), 'ab')
 *
 * @category instances
 * @since 3.0.0
 */
export const semigroupString: Semigroup<string> = {
  concat: (second) => (first) => first + second
}

/**
 * @category instances
 * @since 3.0.0
 */
export const semigroupVoid: Semigroup<void> = {
  concat: () => () => undefined
}

/**
 * You can glue items between and stay associative.
 *
 * @example
 * import * as S from 'fp-ts/Semigroup'
 * import { pipe } from 'fp-ts/function'
 *
 * const S1 = S.getIntercalateSemigroup(' ')(S.semigroupString)
 *
 * assert.strictEqual(pipe('a', S1.concat('b')), 'a b')
 * assert.strictEqual(pipe('a', S1.concat('b'), S1.concat('c')), 'a b c')
 *
 * @category instances
 * @since 3.0.0
 */
export const getIntercalateSemigroup = <A>(a: A): Endomorphism<Semigroup<A>> => (S) => ({
  concat: (second) => (first) => S.concat(S.concat(second)(a))(first)
})
