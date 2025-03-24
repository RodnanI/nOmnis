'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthProvider from '@/components/auth/SessionProvider';
import '@/app/globals.css';
import '@/components/chatbot/chatbot.css';

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="fullscreen-chat-layout">
            <AuthProvider>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </AuthProvider>
            <style jsx global>{`
                /* Force hide the header and footer specifically for this layout */
                header, footer, .global-nav {
                    display: none !important;
                }
                
                body, html {
                    overflow: hidden;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                }
                
                .fullscreen-chat-layout {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 9999;
                }
            `}</style>
        </div>
    );
}