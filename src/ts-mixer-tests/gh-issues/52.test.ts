import { describe, it, expect } from 'bun:test';
import { forEachSettings } from '../util';

import mixin from '../../mixin';

describe('gh-issue #52', () => {
    forEachSettings(() => {
        it('should support class decorators that do not return anything', async () => {
            const nonReturningClassDecorator = (target: Function) => {
                expect(target).not.toBeUndefined();
            };

            expect(() => {
                @nonReturningClassDecorator
                @nonReturningClassDecorator
                class Foo { }
                class Bar { }

                const FooBar = mixin(Foo, Bar);
                new FooBar();
            }).not.toThrow();
        })
    })
});
