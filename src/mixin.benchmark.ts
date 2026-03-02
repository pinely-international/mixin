import { barplot, bench, run } from "mitata"
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

class Light { }

const Mixed = mixin(A, B, C)
const MixedEmpty = mixin()
const MixedLight = mixin(Light)

const extInst = new Derived
const mixInst = new Mixed


function benchMany(name: string, fn: () => void) {
  bench(name, () => {
    for (let i = 0; i < 1_000; i++) fn()
  })
}

barplot(() => {
  benchMany("instantiate a class", () => new Light())
  benchMany("instantiate extended class", () => new Derived())
  benchMany("instantiate mixed class", () => new Mixed())
  benchMany("instantiate mixed class (empty)", () => new MixedEmpty())
  benchMany("instantiate mixed class (light)", () => new MixedLight())
})

barplot(() => {
  benchMany("call method on extended instance", () => extInst.method1())
  benchMany("call method on mixed instance", () => mixInst.method1())
})

barplot(() => {
  benchMany("access decorator metadata on mixed prototype", () => Mixed.prototype[SYM]?.length)
  benchMany("access decorator metadata on derived prototype", () => Derived.prototype[SYM]?.length)
})


await run()