import { describe, it, expect, beforeEach } from 'bun:test';
import { forEachSettings } from '../util';

import { mixin } from '../..';

describe('Basic use case', () => {
	forEachSettings(() => {
		class BaseClass {
			public readonly hasBase: boolean = true;
		}

		class FooMixin {
			public readonly foo: string = 'foo';

			public makeFoo(): string {
				return this.foo;
			}
		}

		class BarMixin {
			public readonly bar: string = 'bar';

			public makeBar(): string {
				return this.bar;
			}
		}

		class FooBar extends mixin(BaseClass, FooMixin, BarMixin) {
			public makeFooBar() {
				return this.makeFoo() + this.makeBar();
			}
		}

		let fb: FooBar;
		beforeEach(() => {
			fb = new FooBar();
		});

		it('should inherit all instance properties', () => {
			expect(fb.hasBase).toBe(true);
			expect(fb.foo).toBe('foo');
			expect(fb.bar).toBe('bar');
		});

		it('should inherit all methods', () => {
			expect(fb.makeFoo()).toBe('foo');
			expect(fb.makeBar()).toBe('bar');
			expect(fb.makeFooBar()).toBe('foobar');
		});
	});
});
