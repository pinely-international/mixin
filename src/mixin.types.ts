import type { MIXIN_METADATA } from "./mixin.helpers"

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
  ? I
  : never

export type AbstractClass = abstract new () => unknown

export type MixinInstance<T extends AbstractClass> = UnionToIntersection<InstanceType<T>>
export type MixinConstructor<T extends AbstractClass> = new () => UnionToIntersection<InstanceType<T>>

export type MixinCallable = <T extends AbstractClass[]>(...constructors: T) => MixinConstructor<T[number]>
export type MixinNewable = new <T extends AbstractClass[]>(...constructors: T) => MixinInstance<T[number]>


export interface MixinMetadata {
  [MIXIN_METADATA]: { extendsSet: Set<Function>, extendsArray: Function[] }
}
