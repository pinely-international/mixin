import { describe, it, expect } from 'bun:test';
import { forEachSettings } from '../util';

import { mixin } from '../..';

describe('Static chain inheritance', () => {
	forEachSettings(() => {
		class TEST0 {
			static scope = 10;
		}
		class TEST1 extends TEST0 { }
		class TEST2 extends mixin(TEST1) { }

		it('should inherit static properties correctly in an A extends B extends C scenario', () => {
			expect(TEST2.scope).toBe(10);
		});
	});
});
