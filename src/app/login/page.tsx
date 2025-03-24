import LoginForm from '@/components/auth/LoginForm';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';

export default async function LoginPage() {
    // If user is already logged in, redirect to homepage
    const session = await getServerSession(authOptions);
    if (session) {
        redirect('/');
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent blur-3xl opacity-70"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent blur-3xl opacity-70"></div>
            </div>

            <LoginForm />
        </div>
    );
}