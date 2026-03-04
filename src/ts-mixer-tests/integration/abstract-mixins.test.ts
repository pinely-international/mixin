import { describe, it } from 'bun:test';
import { forEachSettings } from '../util';

import { mixin } from '../../mixin';

describe('Abstract classes', () => {
	forEachSettings(() => {
		it('should inherit "abstractness" properly', () => {
			abstract class Foo { }
			abstract class Bar { }
			class Baz { }
			class Qux { }

			const FooBar = mixin(Foo, Bar);
			const BarBaz = mixin(Bar, Baz);
			const BazQux = mixin(Baz, Qux);

			new FooBar
			new BarBaz
			new BazQux
		});
	});
});
