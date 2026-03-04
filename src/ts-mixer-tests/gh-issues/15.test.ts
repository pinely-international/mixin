import { describe, it, expect } from 'bun:test';
import { forEachSettings } from '../util';

import { IsBoolean, IsIn, validate } from 'class-validator';
import { mixin } from '../../mixin';


describe('gh-issue #15', () => {
	forEachSettings(() => {
		class Disposable {
			@IsBoolean()
			isDisposed: boolean = false;
		}

		class Statusable {
			@IsIn(['bound', 'open'])
			status: string = 'test';
		}

		class ExtendedObject extends mixin(Disposable, Statusable) { }

		it('should inherit class-validators properly', async () => {
			const extendedObject = new ExtendedObject();

			const errors = await validate(extendedObject);

			expect(errors.length).not.toBe(0);
		});
	});
});
