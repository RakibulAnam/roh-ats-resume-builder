import React, { useState } from 'react';
import { supabase } from '../infrastructure/supabase/client';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle, XCircle } from 'lucide-react';

export const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    // UX States
    const [passwordError, setPasswordError] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);

    const clearErrors = () => {
        setAuthError(null);
        if (passwordError) setPasswordError('');
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        // Client-side Validation
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Welcome back!');
                // AuthProvider will handle redirect
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                if (error) throw error;
                toast.success('Account created successfully!');
            }
        } catch (error) {
            console.error("Auth error:", error);
            const message = error instanceof Error ? error.message : 'Authentication failed';
            setAuthError(message);
            // toast.error(message); // Optional: keep toast or rely on UI
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    {/* Branding */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl text-white font-bold text-2xl mb-4 shadow-lg shadow-indigo-200">
                            R
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Roh ATS <span className="text-indigo-600">Builder</span></h2>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-xl font-semibold text-gray-800 mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {isLogin
                                ? 'Enter your credentials to access your dashboard'
                                : 'Start building your career profile today'}
                        </p>
                    </div>

                    {/* Auth Error Alert using API response */}
                    {authError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-red-800">Authentication Failed</h3>
                                <p className="text-sm text-red-600 mt-1">
                                    {authError === "Invalid login credentials"
                                        ? "Incorrect email or password. Please try again."
                                        : authError}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        value={fullName}
                                        onChange={(e) => {
                                            setFullName(e.target.value);
                                            clearErrors();
                                        }}
                                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                    <div className="absolute left-3 top-2.5 text-gray-400">
                                        <ArrowRight size={18} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        clearErrors();
                                    }}
                                    className={`w-full px-4 py-2 pl-10 border rounded-lg outline-none transition-all ${authError
                                            ? 'border-red-300 focus:ring-red-200'
                                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                        }`}
                                    placeholder="you@example.com"
                                />
                                <div className="absolute left-3 top-2.5 text-gray-400">
                                    <Mail size={18} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        clearErrors();
                                    }}
                                    className={`w-full px-4 py-2 pl-10 border rounded-lg outline-none transition-all ${passwordError || authError
                                            ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                        }`}
                                    placeholder="••••••••"
                                />
                                <div className="absolute left-3 top-2.5 text-gray-400">
                                    <Lock size={18} />
                                </div>
                            </div>
                            {passwordError && (
                                <p className="mt-1 text-sm text-red-500 font-medium flex items-center gap-1 animate-pulse">
                                    <AlertCircle size={14} />
                                    {passwordError}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                clearErrors();
                            }}
                            className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                        >
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
