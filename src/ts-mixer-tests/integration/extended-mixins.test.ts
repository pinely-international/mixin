import { describe, it, expect, beforeEach } from 'bun:test';
import { forEachSettings } from '../util';

import { mixin } from '../..';

describe('Using a mixin that extends another class', () => {
	forEachSettings(() => {
		class Foo {
			public readonly foo: string = 'foo';

			public getFoo() {
				return this.foo;
			}
		}

		class Bar extends Foo { }

		class Baz { }

		class BarBaz extends mixin(Bar, Baz) { }

		let bb: BarBaz;
		beforeEach(() => {
			bb = new BarBaz();
		});

		it('should be able to access properties from the class that the Mixin extends', () => {
			expect(bb.foo).toBe('foo');
		});

		it('should be able to use methods available on the class that the Mixin extends', () => {
			expect(bb.getFoo()).toBe('foo');
		});
	});
});
