import { mixin } from "./mixin"


const SYM = Symbol("decor")
function decorator(target: any, key: string) {
  (target[SYM] ||= []).push(key)
}

class A {
  @decorator test1 = 1
  method1() { return this.test1 }
  // [SYM]?: string[]
}

class B {
  @decorator test2 = 2
  method2() { return this.test2 }
  // [SYM]?: string[]
}

class C {
  @decorator test3 = 3
  method3() { return this.test3 }
  // [SYM]?: string[]
}


class Base {
  @decorator test1 = 1
  method1() { return this.test1 }

  @decorator test2 = 2
  method2() { return this.test2 }

  @decorator test3 = 3
  method3() { return this.test3 }

  [SYM]?: string[]
}
class Derived extends Base {
  test = "data"
  method() { return this.test }
}



console.time("First time mixin")
mixin(A, B, C)
console.timeEnd("First time mixin")

console.time("Second time mixin")
mixin(A, B, C)
console.timeEnd("Second time mixin")


time("mixin", () => mixin(A, B, C))
time("Light", () => class Light { })

class Light { }

class Mixed extends mixin(A, B, C) { }
const MixedEmpty = mixin()
const MixedLight = mixin(Light)

class DerivedMixed extends mixin(A, B, C) { }




time("Mixed", () => new Mixed)
time("DerivedMixed", () => new DerivedMixed)
time("Derived", () => new Derived)

const derived = new Derived
const derivedMixed = new DerivedMixed

time("derived instanceof Base", () => derived instanceof Base)
time("derivedMixed instanceof Mixed", () => derivedMixed instanceof Mixed)
time("derivedMixed instanceof C", () => derivedMixed instanceof C)
time("derivedMixed instanceof mixin(A, B, C)", () => derivedMixed instanceof mixin(A, B, C))



console.group("instanceof")

class Plain { }
class Overridden { static [Symbol.hasInstance](instance: any) { return true } }
const object = {}

time("instanceof (plain)", () => object instanceof Plain)
time("instanceof (plain fallback)", () => Function.prototype[Symbol.hasInstance].call(object, Plain))
time("instanceof (overridden)", () => object instanceof Overridden)

console.groupEnd()

function time(label: string, callback: () => void) {
  label += ` (${1000}x)`

  // Warmup.
  for (let i = 0; i < 1_000; i++) callback()

  // Measure.
  console.time(label)
  for (let i = 0; i < 1_000; i++) callback()
  console.timeEnd(label)
}