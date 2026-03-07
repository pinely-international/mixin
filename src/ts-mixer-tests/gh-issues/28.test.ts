import { describe, it, expect } from 'bun:test';
import { forEachSettings } from '../util';

import { IsBoolean, IsIn, validate } from 'class-validator';
import mixin from '../../mixin';


describe('gh-issue #28', () => {
	forEachSettings(() => {
		it('should work', async () => {
			class Disposable {
				@IsBoolean()
				isDisposed: boolean = false
			}

			class Statusable {
				@IsIn(['red', 'green'])
				status: string = 'green';
			}

			class Statusable2 {
				@IsIn(['red', 'green'])
				other: string = 'green';
			}

			class ExtendedObject extends mixin(Disposable, Statusable) {
			}

			class ExtendedObject2 extends mixin(Statusable2, ExtendedObject) {
			}

			const extendedObject = new ExtendedObject2();
			extendedObject.status = 'blue';
			extendedObject.other = 'blue';
			// @ts-ignore
			extendedObject.isDisposed = undefined;

			const errors = await validate(extendedObject);
			const errorProps = errors.map(error => error.property);
			expect(errorProps).toContain('status');
			expect(errorProps).toContain('other');
			expect(errorProps).toContain('isDisposed');
		});
	});
});
