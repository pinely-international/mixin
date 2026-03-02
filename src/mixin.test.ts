import { describe, it, expect } from "bun:test"
import { mixin, MixinSymbol } from "./mixin"

class Person {
  name!: string
  age!: number
  private gender!: "aircraft"
}

class Profile {
  name!: string
  avatar!: string
  protected something!: {}

  protected _test = 111
  public get test() { return this._test }
}

class Unrelated { }

describe("mixin helper", () => {
  it("combines prototypes and allows instanceof checks", () => {
    class User extends mixin(Person, Profile) {
      id!: number
    }

    const user = new User()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // console.log('Profile metadata:', (Profile as any)[MixinSymbol])
    expect(user).toBeInstanceOf(User)
    expect(user).toBeInstanceOf(Person)
    expect(user).toBeInstanceOf(Profile)

    // repeated invocation should return the same class (cached)
    const MAgain = mixin(Person, Profile)
    expect(MAgain).toBe(mixin(Person, Profile))
    expect(user).toBeInstanceOf(MAgain)
  })

  it("does not match when extra classes are mixed", () => {
    class User extends mixin(Person, Profile) {
      id!: number
    }

    const user = new User()
    const MixedSame = mixin(Person, Profile)
    const MixedUn = mixin(Person, Profile, Unrelated)

    // sanity checks (no output intended)
    // console.log('MixedSame === MixedUn', MixedSame === MixedUn)
    // console.log('protos equal', MixedSame.prototype === MixedUn.prototype)
    // console.log('user instanceof MixedSame', user instanceof MixedSame)
    // console.log('user instanceof MixedUn', user instanceof MixedUn)

    expect(MixedSame).not.toBe(MixedUn)
    expect(user).not.toBeInstanceOf(MixedUn)
  })

  it("does not introduce any issues accessing mixin properties/methods", () => {
    class User1 extends mixin(Person, Profile) { }
    const user1 = new User1
    expect(user1.test).toBe(111)

    class User2 extends mixin(Person, Profile) {
      protected override _test = 222
    }
    const user2 = new User2
    expect(user2.test).toBe(222)
  })

  it("decorator metadata is preserved when mixing classes", () => {
    const SYM = Symbol("decor")

    function decoA(target: any, key: string) {
      (target[SYM] ||= []).push("A-" + key)
    }
    function decoB(target: any, key: string) {
      (target[SYM] ||= []).push("B-" + key)
    }

    class A {
      @decoA
      shared!: string
      @decoA
      onlyA!: number
    }

    class B {
      @decoB
      shared!: string
      @decoB
      onlyB!: boolean
    }

    const Mixed = mixin(A, B)
    // decorator metadata from both classes should live on Mixed.prototype
    expect(Mixed.prototype[SYM]).toContain("A-shared")
    expect(Mixed.prototype[SYM]).toContain("B-shared")
    expect(Mixed.prototype[SYM]).toContain("A-onlyA")
    expect(Mixed.prototype[SYM]).toContain("B-onlyB")

    // different-property decorators should also be merged
    class C {
      @decoA
      foo!: string
    }
    class D {
      @decoB
      bar!: string
    }
    const Mixed2 = mixin(C, D)
    expect(Mixed2.prototype[SYM]).toContain("A-foo")
    expect(Mixed2.prototype[SYM]).toContain("B-bar")
  })

  it("stores metadata on base constructors", () => {
    const M1 = mixin(Person)
    const M2 = mixin(Profile)

    // inspect the arrays each should contain the returned class
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta1 = (Person as any)[MixinSymbol]?.mixed as any[]
    const meta2 = (Profile as any)[MixinSymbol]?.mixed as any[]

    expect(meta1).toContain(M1)
    expect(meta2).toContain(M2)
  })

  it("executes all constructors when instantiating", () => {
    let ranPerson = false
    let ranProfile = false

    class P extends Person {
      constructor() {
        super()
        ranPerson = true
      }
    }

    class Q extends Profile {
      constructor() {
        super()
        ranProfile = true
      }
    }

    const Mixed = mixin(P, Q)
    new Mixed()

    expect(ranPerson).toBe(true)
    expect(ranProfile).toBe(true)
  })
})
