import { mixin, hasInstance, MIXIN_METADATA } from './src/mixin';

class Foo1{};
class Bar1{};
class FooBar1 extends mixin(Foo1,Bar1){};
class Baz1 extends FooBar1{};

class Foo2{};
class Bar2{};
class FooBar2 extends mixin(Foo2,Bar2){};
class Baz2 extends FooBar2{};

class SuperFooBar extends mixin(Baz1,Baz2){};
class ExtraLayerJustForFun extends SuperFooBar{};

const instance=new ExtraLayerJustForFun();

function traceHasInstance(inst:any, ctor:any) {
  console.log('--- tracing hasInstance for', ctor.name);
  const seen = new Set<any>();
  let proto = Object.getPrototypeOf(inst);
  while(proto) {
    const c = proto.constructor;
    console.log('visiting proto ctor', c.name);
    if (c && !seen.has(c)) {
      seen.add(c);
      if (Object.prototype.hasOwnProperty.call(c, MIXIN_METADATA)) {
        const m:any = c[MIXIN_METADATA];
        if (m && Array.isArray(m.extends)) {
          console.log('  own meta.extends of', c.name, m.extends.map((x:any)=>x.name));
          for (const x of m.extends) seen.add(x);
        }
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  console.log('final seen', Array.from(seen).map((x:any)=>x.name));
  return seen.has(ctor);
}

console.log('custom hasInstance Foo2', traceHasInstance(instance, Foo2));
console.log('original hasInstance Foo2', hasInstance(instance, Foo2));
console.log('custom hasInstance Foo1', traceHasInstance(instance, Foo1));
console.log('original hasInstance Foo1', hasInstance(instance, Foo1));

