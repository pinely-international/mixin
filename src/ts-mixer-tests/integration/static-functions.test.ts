import { describe, it, expect } from 'bun:test';
import { forEachSettings } from '../util';

import { mixin } from '../..';

describe('Static functions', () => {
	forEachSettings(() => {
		class ClassA {
			static staticFunction() {
				return 'A';
			}
		}

		class ClassB extends mixin(ClassA) { }

		// Note: the reason this test exists is because static functions aren't enumerable, unlike non-function static props
		it('should inherit static functions properly', () => {
			expect(ClassB.staticFunction).toBe(ClassA.staticFunction);
		});
	});
});
