import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';

// Allowlist: anything not listed here is removed. A blocklist would let
// through every dangerous tag or attribute nobody thought of.
const commentSchema = {
    ...defaultSchema,
    tagNames: [
        'a', 'b', 'blockquote', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'hr', 'i', 'li', 'ol', 'p', 'pre', 's', 'strong', 'u', 'ul',
    ],
    attributes: { a: ['href', 'title'] },
    protocols: { href: ['http', 'https', 'mailto'] },
    // These are removed with their content, the others keep their inner text.
    strip: ['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template'],
};

// Runs in this order: rehypeRaw turns the HTML typed by the user into real
// nodes, then rehypeSanitize filters them. Without rehypeSanitize, that HTML
// would reach the page unfiltered.
const rehypePlugins = [rehypeRaw, [rehypeSanitize, commentSchema]];
const remarkPlugins = [remarkBreaks];

// The filter removes unsafe addresses: the text stays, without looking like a link.
const CommentLink = ({ href, title, children }) => {
    if (!href) return <span>{children}</span>;

    return (
        <a href={href} title={title} target="_blank" rel="nofollow noopener noreferrer ugc">
            {children}
        </a>
    );
};

const components = { a: CommentLink };

// React elements are built from the filtered tree: dangerouslySetInnerHTML is
// never used.
const CommentContent = ({ content }) => (
    <div className="comment-content">
        <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
            {content}
        </ReactMarkdown>
    </div>
);

export default CommentContent;
