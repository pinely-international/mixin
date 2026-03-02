
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
  ? I
  : never




type ABC = abstract new (...args: never[]) => unknown

type Mixin<T extends ABC> = MixinConstructor<T>
type MixinConstructor<T extends ABC> = new () => UnionToIntersection<InstanceType<T>>

export const MixinSymbol = Symbol("Mixin.class")
const CACHE_KEY = Symbol("mixin.class")
const mixinCache = new Map<any, any>()

export function mixin<T extends (abstract new () => void)[]>(...constructors: T): Mixin<T[number]> {
  if (constructors.length === 0) {
    return class Mixed { } as never
  }

  // check nested map cache for existing mixed class
  let node = mixinCache
  for (const C of constructors) {
    let next = node.get(C)
    if (!next) {
      next = new Map()
      node.set(C, next)
    }
    node = next
  }
  if (node.has(CACHE_KEY)) return node.get(CACHE_KEY)

  // precompute instance symbol lists for each constructor (keys not needed
  // if using Object.assign on additional bases)
  const properties: Map<object, symbol[]> = new Map

  for (const C of constructors) {
    const sample = Reflect.construct(C, [])
    properties.set(C, Object.getOwnPropertySymbols(sample))
  }

  // extend the first constructor for native instantiation speed
  const [First, ...Rest] = constructors as any[]
  class Mixin extends First {
    constructor() {
      super()
      // copy over instance properties from the remaining constructors
      for (const C of Rest as any[]) {
        const instance = new C

        // plain assignment for enumerable fields
        for (const key in instance) (this as any)[key] = instance[key]

        // copy symbols separately
        const symbols = properties.get(C)!
        for (const symbol of symbols) {
          (this as any)[symbol] = instance[symbol]
        }
      }
    }

    // record the list of constructors on the mixed class itself
    static [MixinSymbol] = { bases: constructors.slice() }
  }


  // store the class in cache before returning so recursive mixins still
  // yield the same reference (and prevent infinite loops)
  node.set(CACHE_KEY, Mixin)

  // note: metadata will be stored on each base class rather than the
  // prototype. the metadata array contains all Mixed classes built from
  // that base. this allows a single hasInstance override per base.

  // copy prototype members (including symbols) from every input class
  for (const C of constructors) {
    const proto = C.prototype
    if (proto === Object.prototype) continue

    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === "constructor") continue
      const desc = Object.getOwnPropertyDescriptor(proto, key)!
      // if target already has an array value and the new one is also an
      // array, merge them to avoid overwriting decorator metadata
      if (
        desc &&
        "value" in desc &&
        Array.isArray(desc.value) &&
        Array.isArray((Mixin.prototype as any)[key])
      ) {
        // create combined array without duplicates
        const existing = (Mixin.prototype as any)[key] as any[]
        (Mixin.prototype as any)[key] = Array.from(new Set([...existing, ...desc.value]))
      } else {
        Object.defineProperty(Mixin.prototype, key, desc)
      }
    }
    for (const sym of Object.getOwnPropertySymbols(proto)) {
      const desc = Object.getOwnPropertyDescriptor(proto, sym)!
      if (
        desc &&
        "value" in desc &&
        Array.isArray(desc.value) &&
        Array.isArray((Mixin.prototype as any)[sym])
      ) {
        const existing = (Mixin.prototype as any)[sym] as any[]
        (Mixin.prototype as any)[sym] = Array.from(new Set([...existing, ...desc.value]))
      } else {
        Object.defineProperty(Mixin.prototype, sym, desc)
      }
    }
  }

  // copy static members from all constructors as well
  for (const C of constructors) {
    for (const key of Object.getOwnPropertyNames(C)) {
      if (key === "prototype" || key === "name" || key === "length") continue
      const desc = Object.getOwnPropertyDescriptor(C, key)!
      try {
        Object.defineProperty(Mixin, key, desc)
      } catch {
        // ignore readonly/unconfigurable properties
      }
    }
    for (const sym of Object.getOwnPropertySymbols(C)) {
      if (sym === Symbol.hasInstance || sym === MixinSymbol) continue
      const desc = Object.getOwnPropertyDescriptor(C, sym)!
      try {
        Object.defineProperty(Mixin, sym, desc)
      } catch {
        // ignore
      }
    }
  }

  // ensure each base class has a single patched Symbol.hasInstance that
  // consults the metadata array stored directly on the class. the first
  // time we see a base we create the array and install the override later
  // mixin calls will just append to the list.
  for (const C of constructors) {
    let meta: any = (C as any)[MixinSymbol]
    if (!meta) {
      meta = { mixed: [] }
      Object.defineProperty(C, MixinSymbol, { value: meta, configurable: true })
    }

    if (!meta.mixed.includes(Mixin)) {
      meta.mixed.push(Mixin)
    }

    const currentHas = (C as any)[Symbol.hasInstance]
    if (!currentHas || !(currentHas as any).__mixinPatched) {
      const original = currentHas
      Object.defineProperty(C, Symbol.hasInstance, {
        value(obj: any) {
          if (!(obj && typeof obj === "object")) {
            return typeof original === "function" ? original.call(this, obj) : false
          }

          const me: any = this
          const myMeta: any = me[MixinSymbol]
          const isTestingMixed = myMeta && myMeta.bases

          if (isTestingMixed) {
            const myBases: any[] = myMeta.bases
            for (const M of (C as any)[MixinSymbol].mixed as any[]) {
              if (M.prototype.isPrototypeOf(obj)) {
                const theirMeta: any = (M as any)[MixinSymbol]
                const theirBases: any[] = theirMeta?.bases || []
                if (
                  theirBases.length === myBases.length &&
                  theirBases.every((x, i) => x === myBases[i])
                ) {
                  return true
                }
              }
            }
          } else {
            for (const M of (C as any)[MixinSymbol].mixed as any[]) {
              if (M.prototype.isPrototypeOf(obj)) {
                return true
              }
            }
          }

          if (typeof original === "function") {
            return original.call(this, obj)
          }
          return false
        },
      });
      (C as any)[Symbol.hasInstance].__mixinPatched = true
    }
  }

  return Mixin as never
}
