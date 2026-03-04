import { describe, beforeEach } from 'bun:test';

export const forEachSettings = (runTests: () => void) => {
	// this implementation does not support alternate settings;
	// simply run the provided tests once
	runTests();
};

export type AssertEquals<T1, T2> = T1 extends T2 ? T2 extends T1 ? true : false : false;
