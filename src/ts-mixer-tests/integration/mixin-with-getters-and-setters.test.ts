import { describe, it, expect } from 'bun:test';
import { forEachSettings } from '../util';

import { mixin } from '../..';

describe('Mixins with getters and setters', () => {
	forEachSettings(() => {
		it('should copy props correctly when the prototype has a getter/setter', () => {
			let externalValue = 0;

			class Base { }
			class HasGetter {
				public get externalValue() {
					return externalValue;
				}
			}

			const Mixed = mixin(Base, HasGetter);

			let hg = new HasGetter();
			let mx = new Mixed();

			expect(hg.externalValue).toBe(0);
			expect(mx.externalValue).toBe(0);

			externalValue++;

			expect(hg.externalValue).toBe(1);
			expect(mx.externalValue).toBe(1);
		});
	});
});
