import { describe, it, expect } from 'bun:test';
import { forEachSettings } from '../util';

import { mixin } from '../..';

describe('Overriding values provided by mixin', () => {
	forEachSettings(() => {
		class Foo {
			foo = 'foo';
			method() {
				return 'foo';
			}
		}

		class Bar {
			bar = 'bar';
			method() {
				return 'bar';
			}
		}

		describe('using `extends Mixin(...)`', () => {
			class MixedWithExtends extends mixin(Foo, Bar) {
				foo = 'not foo';

				method() {
					return 'not foo';
				}
			}

			let m = new MixedWithExtends();

			it('should prefer properties on the class over the mixed classes', () => {
				expect(m.foo).toBe('not foo');
				expect(m.method()).toBe('not foo');
			});
		});
	});
});
