import { describe, it, expect, beforeEach } from 'bun:test';
import { forEachSettings } from '../util';

import { mixin } from '../..';

describe('Overriding use case', () => {
	forEachSettings(() => {
		class Foo {
			public getFoo() {
				return 'foo'
			}
		}

		class Bar {
			public getBar() {
				return 'bar';
			}
		}

		class FooBar extends mixin(Foo, Bar) {
			public getFoo() {
				return 'not foo'
			}

			public getBar() {
				return 'not bar';
			}
		}

		let fb: FooBar;
		beforeEach(() => {
			fb = new FooBar();
		});

		it('should properly override base methods', () => {
			expect(fb.getFoo()).toBe('not foo');
		});

		it('should properly override mixed in methods', () => {
			expect(fb.getBar()).toBe('not bar');
		});
	});
});
