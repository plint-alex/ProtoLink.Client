import { describe, expect, it } from 'vitest';
import { DEFAULT_HOME_ENTITY_ID, getDynamicHomePath } from './home';

/** Product home (`home_entity`); public Drive CloudRoot is a different id. */
const HOME_ENTITY_ID = '4cca22a8-bf99-4c52-a753-c820969925c3';
const PUBLIC_DRIVE_ID = '3e5a2d6e-27ca-4c8b-89e6-e3cb253c05d6';

describe('home constants', () => {
    it('points logo and / at home_entity for everyone, not the public Drive or user home', () => {
        expect(DEFAULT_HOME_ENTITY_ID).toBe(HOME_ENTITY_ID);
        expect(DEFAULT_HOME_ENTITY_ID).not.toBe(PUBLIC_DRIVE_ID);
        expect(getDynamicHomePath()).toBe(`/${HOME_ENTITY_ID}`);
        expect(getDynamicHomePath()).not.toBe('/user-1');
    });
});
