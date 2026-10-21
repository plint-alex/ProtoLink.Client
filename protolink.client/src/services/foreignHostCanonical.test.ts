import { describe, expect, it } from 'vitest';
import {
    buildForeignHostCanonicalUrl,
    isPrimaryProtoLinkHost,
    normalizeHostname,
    shouldRedirectForeignHostRoot,
} from './foreignHostCanonical';

describe('foreignHostCanonical', () => {
    describe('normalizeHostname', () => {
        it('lowercases and strips default ports', () => {
            expect(normalizeHostname('Plintec.RU')).toBe('plintec.ru');
            expect(normalizeHostname('plintec.ru:443')).toBe('plintec.ru');
            expect(normalizeHostname('plintec.ru:80')).toBe('plintec.ru');
            expect(normalizeHostname('WWW.Protolink.RU:443')).toBe('www.protolink.ru');
        });

        it('strips non-default ports and unwraps IPv6 brackets', () => {
            expect(normalizeHostname('localhost:57252')).toBe('localhost');
            expect(normalizeHostname('[::1]:8080')).toBe('::1');
            expect(normalizeHostname('[::1]')).toBe('::1');
        });
    });

    describe('isPrimaryProtoLinkHost', () => {
        it('treats product + local hosts as primary', () => {
            expect(isPrimaryProtoLinkHost('protolink.ru')).toBe(true);
            expect(isPrimaryProtoLinkHost('www.protolink.ru')).toBe(true);
            expect(isPrimaryProtoLinkHost('PROTOLINK.RU:443')).toBe(true);
            expect(isPrimaryProtoLinkHost('localhost')).toBe(true);
            expect(isPrimaryProtoLinkHost('localhost:57252')).toBe(true);
            expect(isPrimaryProtoLinkHost('127.0.0.1')).toBe(true);
            expect(isPrimaryProtoLinkHost('[::1]')).toBe(true);
        });

        it('treats foreign domains as non-primary', () => {
            expect(isPrimaryProtoLinkHost('plintec.ru')).toBe(false);
            expect(isPrimaryProtoLinkHost('Plintec.RU:443')).toBe(false);
            expect(isPrimaryProtoLinkHost('example.com')).toBe(false);
        });
    });

    describe('buildForeignHostCanonicalUrl', () => {
        it('builds https://protolink.ru/{hostname} and preserves query', () => {
            expect(buildForeignHostCanonicalUrl('plintec.ru')).toBe('https://protolink.ru/plintec.ru');
            expect(buildForeignHostCanonicalUrl('Plintec.RU:443', '?lang=ru')).toBe(
                'https://protolink.ru/plintec.ru?lang=ru'
            );
            expect(buildForeignHostCanonicalUrl('plintec.ru', 'lang=en')).toBe(
                'https://protolink.ru/plintec.ru?lang=en'
            );
        });
    });

    describe('shouldRedirectForeignHostRoot', () => {
        it('redirects foreign host only on /', () => {
            expect(shouldRedirectForeignHostRoot('plintec.ru', '/')).toBe(true);
            expect(shouldRedirectForeignHostRoot('plintec.ru', '')).toBe(true);
            expect(shouldRedirectForeignHostRoot('plintec.ru', '/plintec.ru')).toBe(false);
            expect(shouldRedirectForeignHostRoot('plintec.ru', '/foo')).toBe(false);
        });

        it('never redirects primary hosts', () => {
            expect(shouldRedirectForeignHostRoot('protolink.ru', '/')).toBe(false);
            expect(shouldRedirectForeignHostRoot('www.protolink.ru', '/')).toBe(false);
            expect(shouldRedirectForeignHostRoot('localhost:57252', '/')).toBe(false);
        });
    });
});
