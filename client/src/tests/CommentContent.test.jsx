import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import CommentContent from '../components/CommentContent';

const ALLOWED_TAGS = new Set([
    'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'DIV', 'EM', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'HR', 'I', 'LI', 'OL', 'P', 'PRE', 'S', 'STRONG', 'U', 'UL',
]);
const ALLOWED_ATTRIBUTES = new Set(['href', 'title', 'target', 'rel', 'class']);
const SAFE_HREF = /^(https?:|mailto:|\/|#|[^:]*$)/i;

const renderContent = (content) => render(<CommentContent content={content} />).container;

// Checks the resulting DOM as a whole, so a payload is caught whatever trick it uses.
const expectSafeDom = (container) => {
    container.querySelectorAll('*').forEach((element) => {
        expect(ALLOWED_TAGS).toContain(element.tagName);

        [...element.attributes].forEach(({ name, value }) => {
            expect(ALLOWED_ATTRIBUTES).toContain(name);
            if (name === 'class') expect(value).toBe('comment-content');
            if (name === 'href') expect(value.replace(/\s/g, '')).toMatch(SAFE_HREF);
        });
    });
};

describe('CommentContent', () => {
    describe('supported formats', () => {
        test('displays plain text and keeps its line breaks', () => {
            const container = renderContent('Ligne 1\nLigne 2');

            expect(container).toHaveTextContent('Ligne 1 Ligne 2');
            expect(container.querySelector('br')).not.toBeNull();
        });

        test('keeps comparison signs in plain text', () => {
            expect(renderContent('si a < b et b > c')).toHaveTextContent('si a < b et b > c');
        });

        test('renders Markdown', () => {
            const container = renderContent('**gras** et *italique*\n\n- un\n- deux\n\n`code`');

            expect(container.querySelector('strong')).toHaveTextContent('gras');
            expect(container.querySelector('em')).toHaveTextContent('italique');
            expect(container.querySelectorAll('li')).toHaveLength(2);
            expect(container.querySelector('code')).toHaveTextContent('code');
        });

        test('renders safe HTML', () => {
            const container = renderContent('<strong>gras</strong> et <em>italique</em><ul><li>un</li></ul>');

            expect(container.querySelector('strong')).toHaveTextContent('gras');
            expect(container.querySelector('em')).toHaveTextContent('italique');
            expect(container.querySelector('li')).toHaveTextContent('un');
        });

        test('shows code examples as text instead of interpreting them', () => {
            const container = renderContent('`<script>alert(1)</script>`');

            expect(container.querySelector('code')).toHaveTextContent('<script>alert(1)</script>');
            expect(container.querySelector('script')).toBeNull();
        });
    });

    describe('links', () => {
        test.each([
            ['Markdown', '[site](https://example.com)'],
            ['HTML', '<a href="https://example.com">site</a>'],
        ])('hardens a %s link', (format, content) => {
            renderContent(content);

            const link = screen.getByRole('link', { name: 'site' });

            expect(link).toHaveAttribute('href', 'https://example.com');
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'nofollow noopener noreferrer ugc');
        });

        test('keeps mailto links', () => {
            renderContent('[écrire](mailto:contact@example.com)');

            expect(screen.getByRole('link', { name: 'écrire' })).toHaveAttribute('href', 'mailto:contact@example.com');
        });

        test.each([
            ['javascript in Markdown', '[clic](javascript:alert(1))'],
            ['javascript in HTML', '<a href="javascript:alert(1)">clic</a>'],
            ['mixed case', '<a href="JaVaScRiPt:alert(1)">clic</a>'],
            ['HTML entities', '<a href="&#106;avascript:alert(1)">clic</a>'],
            ['hexadecimal entities', '<a href="&#x6A;avascript:alert(1)">clic</a>'],
            ['an embedded tab', '<a href="java\tscript:alert(1)">clic</a>'],
            ['an embedded newline', '<a href="java\nscript:alert(1)">clic</a>'],
            ['a leading space', '<a href=" javascript:alert(1)">clic</a>'],
            ['a data URL', '<a href="data:text/html,<script>alert(1)</script>">clic</a>'],
            ['a vbscript URL', '<a href="vbscript:alert(1)">clic</a>'],
        ])('removes a dangerous link using %s', (label, content) => {
            const container = renderContent(content);

            expect(container).toHaveTextContent('clic');
            expect(container.querySelector('a')).toBeNull();
        });
    });

    describe('XSS payloads', () => {
        test.each([
            ['script tag', '<script>alert(1)</script>'],
            ['uppercase script tag', '<SCRIPT>alert(1)</SCRIPT>'],
            ['external script', '<script src="https://evil.example/x.js"></script>'],
            ['image onerror', '<img src=x onerror="alert(1)">'],
            ['Markdown image', '![x](https://evil.example/pixel.png)'],
            ['svg onload', '<svg onload="alert(1)"></svg>'],
            ['svg script', '<svg><script>alert(1)</script></svg>'],
            ['svg animate', '<svg><animate onbegin="alert(1)" attributeName="x" /></svg>'],
            ['math element', '<math><a xlink:href="javascript:alert(1)">x</a></math>'],
            ['iframe', '<iframe src="https://evil.example"></iframe>'],
            ['iframe srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
            ['object', '<object data="javascript:alert(1)"></object>'],
            ['embed', '<embed src="https://evil.example/x.swf">'],
            ['form hijack', '<form action="https://evil.example"><input name="password"><button>OK</button></form>'],
            ['style tag', '<style>body{display:none}</style>'],
            ['style attribute', '<p style="position:fixed;top:0;left:0">faux bandeau</p>'],
            ['stylesheet', '<link rel="stylesheet" href="https://evil.example/x.css">'],
            ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
            ['base tag', '<base href="https://evil.example/">'],
            ['event on allowed tag', '<p onclick="alert(1)">clic</p>'],
            ['mouse event on link', '<a href="https://example.com" onmouseover="alert(1)">x</a>'],
            ['autofocus event', '<input autofocus onfocus="alert(1)">'],
            ['details ontoggle', '<details open ontoggle="alert(1)">x</details>'],
            ['video source error', '<video><source onerror="alert(1)"></video>'],
            ['body onload', '<body onload="alert(1)">'],
            ['DOM clobbering', '<p id="getElementById" name="body">x</p>'],
            ['fake interface class', '<p class="btn btn-primary">Cliquez ici</p>'],
            ['broken tag', '<img src=x onerror=alert(1)//'],
            ['mutation through noscript', '<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
            ['HTML comment trick', '<!--><img src=x onerror=alert(1)>-->'],
            ['payload inside Markdown', '**gras <img src=x onerror=alert(1)>**'],
        ])('neutralises: %s', (label, payload) => {
            expectSafeDom(renderContent(payload));
        });

        test('removes the content of a script, not only the tag', () => {
            expect(renderContent('<script>alert(1)</script>')).not.toHaveTextContent('alert');
        });
    });
});
