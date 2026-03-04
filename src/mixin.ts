import { CompositeMap } from "./CompositeMap"

type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
  ? I
  : never

type ABC = abstract new () => unknown

type Mixin<T extends ABC> = MixinConstructor<T>
type MixinConstructor<T extends ABC> = new () => UnionToIntersection<InstanceType<T>>

export const MIXIN_METADATA: unique symbol = Symbol("mixin.metadata")
export const MIXIN_CLASS: unique symbol = Symbol("mixin.class")
const mixinCache = new CompositeMap<object[], object>()

class MixinEmpty { }
// export function mixin<T extends ABC[], Base extends abstract new (atLeastOne: any, ...args: never[]) => any>(base: Base, ...constructors: T): Mixin<T[number]>
export function mixin<T extends ABC[]>(...constructors: T): Mixin<T[number]> {
  if (constructors.length === 0) return MixinEmpty as never

  const mixin = mixinCache.get(constructors)
  if (mixin != null) return mixin as never

  const properties = new Map<object, symbol[]>()

  for (const C of constructors as any[]) {
    properties.set(C, Object.getOwnPropertySymbols(new C))
  }

  // extend the first constructor for native instantiation speed
  const [First, ...Rest] = constructors as any[]
  const Mixin = class Mixin extends First {
    constructor() {
      super()
      // copy over instance properties from the remaining constructors
      for (const C of Rest) {
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

    static [MIXIN_METADATA]: MixinMetadata[typeof MIXIN_METADATA] = { extends: [] }
  }

  Mixin[MIXIN_METADATA].extends.push(...constructors.flatMap(c => [...(c as any)[MIXIN_METADATA]?.extends ?? [], c]))

  mixinCache.set(constructors, Mixin)


  // copy prototype members (including symbols) from every input class
  for (const constructor of constructors) {
    copyPrototypeMembers(Mixin, constructor)
    copyStaticMembers(Mixin, constructor)
    overrideInstanceOf(Mixin, constructor)
  }

  return Mixin as never
}

export namespace mixin {
  export function member<T extends new (...args: []) => any>(target: T & Partial<MixinMember>): T {
    if (MIXIN_CLASS in target) return target

    return class extends target {
      static [MIXIN_CLASS] = { baseIn: [] }
      static [Symbol.hasInstance](instance: any) {
        if (!(instance && typeof instance === "object")) {
          return super[Symbol.hasInstance].call(this, instance)
        }

        return hasInstance(instance, this)
      }
    }
  }
}


function defineProperty(o: any, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
  try {
    Object.defineProperty(o, p, attributes)
  } catch {
    // ignore
  }
}

interface MixinMetadata {
  [MIXIN_METADATA]: { extends: Function[] }
}

interface MixinMember {
  [MIXIN_CLASS]: { baseIn: Function[] }
}

// export function hasInstance(instance: object, constructor: Function & Partial<MixinMetadata> & Partial<MixinMember>): boolean {
//   if (instance.constructor === constructor) return true
//   if (instance.constructor)
//     // if (constructor[MIXIN_METADATA]?.extends.some(x => x instanceof instance.constructor)) return true

//     // if (instance.constructor)
//     // if (constructor[MIXIN_CLASS]?.baseIn) return true

//     return false
// }

// walk an instance's prototype chain and aggregate all relevant constructors
// including any mixin sets.  This is used both by Symbol.hasInstance overrides
// and the exported `hasInstance` helper shown in the tests.
export function hasInstance(instance: any, constructor: any): boolean {
  if (!(instance && typeof instance === "object")) return false

  const seen = new Set<any>()
  let proto = Object.getPrototypeOf(instance)

  while (proto) {
    const ctor = proto.constructor
    if (ctor && !seen.has(ctor)) {
      seen.add(ctor)

      // only consider metadata that lives directly on the constructor;
      // subclasses inherit the same object, which would otherwise cause the
      // mixin list to be treated as if every subclass mixed in the same set.
      let meta: any
      if (Object.prototype.hasOwnProperty.call(ctor, MIXIN_METADATA)) {
        meta = ctor[MIXIN_METADATA]
      }
      if (meta && Array.isArray(meta.extends)) {
        for (const c of meta.extends) {
          seen.add(c)
        }
      }
    }
    proto = Object.getPrototypeOf(proto)
  }

  return seen.has(constructor)
}


function copyReflectMetadata(target: any, source: any) {
  if (typeof Reflect !== "object" || typeof Reflect.getMetadataKeys !== "function") {
    return
  }
  for (const key of Reflect.getMetadataKeys(source)) {
    try {
      const value = Reflect.getMetadata(key, source)
      Reflect.defineMetadata(key, value, target)
    } catch {
      // ignore any failures - some metadata keys may be read-only
    }
  }
}

function copyStaticMembers(Mixin: any, constructor: any) {
  for (const key of Object.getOwnPropertyNames(constructor)) {
    if (key === "name") continue
    if (key === "length") continue
    if (key === "prototype") continue

    const descriptor = Object.getOwnPropertyDescriptor(constructor, key)!
    defineProperty(Mixin, key, descriptor)
  }
  for (const symbol of Object.getOwnPropertySymbols(constructor)) {
    if (symbol === MIXIN_CLASS) continue
    if (symbol === MIXIN_METADATA) continue
    if (symbol === Symbol.hasInstance) continue

    const descriptor = Object.getOwnPropertyDescriptor(constructor, symbol)!
    defineProperty(Mixin, symbol, descriptor)
  }

  // static metadata (decorators) should also be copied
  copyReflectMetadata(Mixin, constructor)
}

function copyPrototypeMembers(Mixin: any, constructor: any) {
  const proto = constructor.prototype
  if (proto === Object.prototype) return

  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === "constructor") continue
    const descriptor = Object.getOwnPropertyDescriptor(proto, key)!
    // if target already has an array value and the new one is also an
    // array, merge them to avoid overwriting decorator metadata
    if (
      descriptor &&
      "value" in descriptor &&
      Array.isArray(descriptor.value) &&
      Array.isArray((Mixin.prototype as any)[key])
    ) {
      // create combined array without duplicates
      const existing = (Mixin.prototype as any)[key] as any[]
      (Mixin.prototype as any)[key] = Array.from(new Set([...existing, ...descriptor.value]))
    } else {
      Object.defineProperty(Mixin.prototype, key, descriptor)
    }
  }
  for (const symbol of Object.getOwnPropertySymbols(proto)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, symbol)!
    if (
      descriptor &&
      "value" in descriptor &&
      Array.isArray(descriptor.value) &&
      Array.isArray((Mixin.prototype as any)[symbol])
    ) {
      const existing = (Mixin.prototype as any)[symbol] as any[]
      (Mixin.prototype as any)[symbol] = Array.from(new Set([...existing, ...descriptor.value]))
    } else {
      Object.defineProperty(Mixin.prototype, symbol, descriptor)
    }
  }

  // also copy any reflect metadata attached to the prototype
  copyReflectMetadata(Mixin.prototype, proto)
}

function overrideInstanceOf(Mixin: any, constructor: any) {
  let meta: any = constructor[MIXIN_CLASS]
  if (!meta) {
    meta = { baseIn: [] }
    Object.defineProperty(constructor, MIXIN_CLASS, { value: meta, configurable: true })
  }

  if (meta.baseIn.includes(Mixin)) return Mixin as never
  meta.baseIn.push(Mixin)

  const fallback = constructor[Symbol.hasInstance]
  defineProperty(constructor, Symbol.hasInstance, {
    value(this: any, instance: any) {
      if (!(instance && typeof instance === "object")) {
        return fallback.call(this, instance)
      }

      return hasInstance(instance, this)
    }
  })
}