import { describe, expect, test } from 'vitest';
import { getImageError } from '../api/imageErrors';

const FALLBACK = 'Erreur générique';

describe('getImageError', () => {
    test('explains a file refused by nginx', () => {
        expect(getImageError({ response: { status: 413 } }, FALLBACK)).toContain('5 Mo');
    });

    test('explains a file too large for the API', () => {
        const err = { response: { status: 400, data: { message: 'Image too large' } } };

        expect(getImageError(err, FALLBACK)).toContain('5 Mo');
    });

    test('explains an unsupported format', () => {
        const err = { response: { status: 400, data: { message: 'Unsupported image format' } } };

        expect(getImageError(err, FALLBACK)).toContain('JPG, PNG ou WebP');
    });

    test('keeps the generic message for any other error', () => {
        expect(getImageError({ response: { status: 500 } }, FALLBACK)).toBe(FALLBACK);
        expect(getImageError(new Error('network'), FALLBACK)).toBe(FALLBACK);
    });
});
