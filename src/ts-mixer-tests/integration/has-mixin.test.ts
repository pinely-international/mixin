import { describe, it, expect } from 'bun:test';
import { forEachSettings, AssertEquals } from '../util';

import { mixin } from '../..';
import { hasInstance } from '../../mixin';

const hasMixin = hasInstance

describe('hasMixin(...)', () => {
	class Foo { }
	class Bar { }
	class FooBar extends mixin(Foo, Bar) { }
	const fooBar: any = new FooBar();

	forEachSettings(() => {
		it('should have the proper type narrowing', () => {
			if (hasMixin(fooBar, FooBar)) {
				const test: AssertEquals<typeof fooBar, FooBar> = true;
			}
		});

		it('should work as a replacement for `instanceof`', () => {
			expect(hasMixin(fooBar, FooBar)).toBe(true);
		});

		it('should work for constituents', () => {
			expect(hasMixin(fooBar, Foo)).toBe(true);
			expect(hasMixin(fooBar, Bar)).toBe(true);
		});

		it('should work with abstract classes', () => {
			abstract class Baz { }
			class FooBaz extends mixin(Foo, Baz) { }
			const fooBaz: any = new FooBaz();
			expect(hasMixin(fooBaz, Baz)).toBe(true);
		});

		it('should work for cases where the mixin is buried deep in the proto chain', () => {
			class Foo1 { }
			class Bar1 { }
			class FooBar1 extends mixin(Foo1, Bar1) { }
			class Baz1 extends FooBar1 { }

			class Foo2 { }
			class Bar2 { }
			class FooBar2 extends mixin(Foo2, Bar2) { }
			class Baz2 extends FooBar2 { }

			class SuperFooBar extends mixin(Baz1, Baz2) { }
			class ExtraLayerJustForFun extends SuperFooBar { }
			class NonRelatedClassJustAsASanityCheck { }

			const instance: any = new ExtraLayerJustForFun();

			expect(hasMixin(instance, NonRelatedClassJustAsASanityCheck)).toBe(false);


			expect(hasMixin(instance, Foo1)).toBe(true);
			expect(hasMixin(instance, Bar1)).toBe(true);
			expect(hasMixin(instance, Baz1)).toBe(true);
			// mixing Baz2 brings along its ancestry (Foo2/Bar2) even though those
			// prototypes are not on the chain.
			expect(hasMixin(instance, Foo2)).toBe(true);
			expect(hasMixin(instance, Bar2)).toBe(true);
			expect(hasMixin(instance, Baz2)).toBe(true);
			expect(hasMixin(instance, Baz2)).toBe(true);
			expect(hasMixin(instance, Baz2)).toBe(true);
		});
	});
});
