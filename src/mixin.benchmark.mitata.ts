import { barplot, bench, run } from "mitata"
import mixin from "./mixin"


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


@mixin.member
class OptimizedA { }
@mixin.member
class OptimizedB { }
class Optimized extends mixin(OptimizedA, OptimizedB) { }


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

class Light { }

class Mixed extends mixin(A, B, C) { }
const MixedEmpty = mixin()
const MixedLight = mixin(Light)

const derived = new Derived
const mixed = new Mixed
const optimized = new Optimized


barplot(() => {
  bench("instantiate a class", () => new Light())
  bench("instantiate extended class", () => new Derived())
  bench("instantiate mixed class", () => new Mixed())
  bench("instantiate mixed class (empty)", () => new MixedEmpty())
  bench("instantiate mixed class (light)", () => new MixedLight())
})

barplot(() => {
  bench("call method on extended instance", () => derived.method1())
  bench("call method on mixed instance", () => mixed.method1())
})

barplot(() => {
  bench("access decorator metadata on mixed prototype", () => Mixed.prototype[SYM]?.length)
  bench("access decorator metadata on derived prototype", () => Derived.prototype[SYM]?.length)
})

barplot(() => {
  bench("check Mixed instanceof C", () => mixed instanceof C)
  bench("check Mixed instanceof mixin", () => mixed instanceof mixin(A, B, C))
  bench("check Derived instanceof Base", () => derived instanceof Base)
})

barplot(() => {
  bench("check Mixed instanceof Mixed", () => mixed instanceof Mixed)
  bench("check Mixed instanceof C", () => mixed instanceof C)
  bench("check Mixed instanceof mixin", () => mixed instanceof mixin(A, B, C))
})

barplot(() => {
  bench("new Mixed", () => new Mixed)
  bench("new Optimized", () => new Optimized)
  bench("check Derived instanceof Base", () => derived instanceof Base)
  bench("check Mixed instanceof mixin", () => mixed instanceof mixin(A, B))
  bench("check Mixed instanceof mixin (Optimized)", () => optimized instanceof mixin(OptimizedA, OptimizedB))
})

barplot(() => {
  class Plain { }
  class Overridden { static [Symbol.hasInstance](instance: any) { return true } }

  const object = {}

  bench("instanceof (plain)", () => object instanceof Plain)
  bench("instanceof (plain fallback)", () => Function.prototype[Symbol.hasInstance].call(object, Plain))
  bench("instanceof (overridden)", () => object instanceof Overridden)
})


await run()