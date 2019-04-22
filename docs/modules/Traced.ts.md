---
title: Traced.ts
nav_order: 85
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Traced (interface)](#traced-interface)
- [URI (type alias)](#uri-type-alias)
- [URI (constant)](#uri-constant)
- [traced (constant)](#traced-constant)
- [censor (function)](#censor-function)
- [getComonad (function)](#getcomonad-function)
- [listen (function)](#listen-function)
- [listens (function)](#listens-function)
- [tracks (function)](#tracks-function)

---

# Traced (interface)

**Signature**

```ts
export interface Traced<P, A> {
  (p: P): A
}
```

Added in v1.16.0

# URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

# URI (constant)

**Signature**

```ts
export const URI = ...
```

# traced (constant)

**Signature**

```ts
export const traced: Functor2<URI> = ...
```

Added in v1.16.0

# censor (function)

Apply a function to the current position

**Signature**

```ts
export const censor = <P, A>(wa: Traced<P, A>, f: (p: P) => P): Traced<P, A> => ...
```

Added in v1.16.0

# getComonad (function)

**Signature**

```ts
export function getComonad<P>(monoid: Monoid<P>): Comonad2C<URI, P> { ... }
```

Added in v1.16.0

# listen (function)

Get the current position

**Signature**

```ts
export const listen = <P, A>(wa: Traced<P, A>): Traced<P, [A, P]> => ...
```

Added in v1.16.0

# listens (function)

Get a value which depends on the current position

**Signature**

```ts
export const listens = <P, A, B>(wa: Traced<P, A>, f: (p: P) => B): Traced<P, [A, B]> => ...
```

Added in v1.16.0

# tracks (function)

Extracts a value at a relative position which depends on the current value.

**Signature**

```ts
export const tracks = <P, A>(M: Monoid<P>, f: (a: A) => P) => (wa: Traced<P, A>): A => ...
```

Added in v1.16.0