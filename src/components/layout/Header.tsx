'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserMenu from '../auth/UserMenu';
import { useSession, signOut } from "next-auth/react";

export default function Header() {
    const { data: session, status } = useSession();
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();

    // Add scroll listener
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Simplified navigation
    const navItems = [
        { name: 'Preferences', href: '/preferences', requiresAuth: true },
        { name: 'Chat', href: '/chat', requiresAuth: true },
        { name: 'Statistics', href: '/statistics', requiresAuth: true },
    ];

    const isLoading = status === 'loading';
    const user = session?.user;

    return (
        <header
            className={`fixed w-full z-50 transition-all duration-300 ${
                isScrolled
                    ? 'bg-background/80 backdrop-blur-md shadow-sm py-3'
                    : 'bg-transparent py-5'
            }`}
        >
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link href="/" className="group flex items-center">
                    <div
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3"
                    >
                        <span className="text-white font-bold text-xl">O</span>
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 group-hover:from-purple-500 group-hover:to-blue-500 transition-all duration-300">
                        Omnis
                    </span>
                </Link>

                <nav className="hidden md:flex items-center space-x-8">
                    {/* Only show nav items that don't require auth or user is authenticated */}
                    {navItems
                        .filter(item => !item.requiresAuth || !!user)
                        .map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`relative text-foreground hover:text-primary transition-colors duration-300 py-2 ${
                                    pathname === item.href ? 'text-primary font-medium' : ''
                                }`}
                            >
                                {item.name}
                                {pathname === item.href && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                                )}
                            </Link>
                        ))}
                </nav>

                <div>
                    {isLoading ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-400 animate-pulse"></div>
                    ) : user ? (
                        <UserMenu
                            user={{
                                name: user.name || undefined,
                                email: user.email || undefined,
                                image: user.image || undefined
                            }}
                            onLogout={() => signOut({ callbackUrl: '/' })}
                        />
                    ) : (
                        <Link
                            href="/login"
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-5 py-2 rounded-full transition-all duration-300 shadow-lg"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}