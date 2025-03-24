'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';
import './chatbot.css';

interface MessageContentProps {
    content: string;
}

export default function MessageContent({ content }: MessageContentProps) {
    // Apply syntax highlighting if code blocks are present
    useEffect(() => {
        if (content.includes('```')) {
            // Simpler approach to load Prism without language-specific imports
            import('prismjs').then((module) => {
                const Prism = module.default;
                if (Prism && typeof Prism.highlightAll === 'function') {
                    Prism.highlightAll();
                }
            }).catch(err => {
                console.error('Failed to load Prism for syntax highlighting:', err);
            });
        }
    }, [content]);

    // Define components with proper TypeScript typing
    const components: Components = {
        code({className, children, node, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            const codeProps = {...props} as React.HTMLProps<HTMLElement>;
            const isInline = !match && !className;
            
            if (!isInline && match) {
                return (
                    <pre className={className}>
                        <code className={className} {...codeProps}>
                            {children}
                        </code>
                    </pre>
                );
            }
            
            return (
                <code className={className} {...codeProps}>
                    {children}
                </code>
            );
        },
    };

    return (
        <div className="markdown-body bg-transparent">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}