import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../../infrastructure/auth/AuthContext';

interface NavbarProps {
    onDashboardClick?: () => void;
    showExitBuilder?: boolean;
}

export const Navbar = ({ onDashboardClick, showExitBuilder }: NavbarProps) => {
    const { signOut, user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <nav className="bg-white border-b border-charcoal-200 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex items-center cursor-pointer" onClick={onDashboardClick}>
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                R
                            </div>
                            <span className="font-bold text-xl text-charcoal-900 tracking-tight">
                                Roh ATS <span className="text-brand-600">Builder</span>
                            </span>
                        </div>
                    </div>

                    {/* Center Section - Optional (could be used for simple nav links later) */}
                    <div className="hidden md:flex items-center flex-1 justify-center px-8">
                        {showExitBuilder && (
                            <button
                                type="button"
                                onClick={onDashboardClick}
                                className="text-sm font-medium text-charcoal-500 hover:text-brand-600 transition-colors px-3 py-1 rounded-md hover:bg-charcoal-50 bg-charcoal-50"
                            >
                                Exit Builder
                            </button>
                        )}
                    </div>


                    {/* Right Section - User Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-charcoal-50 border border-charcoal-100">
                            <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
                                <User size={14} className="text-brand-600" />
                            </div>
                            <span className="text-sm font-medium text-charcoal-700 max-w-[150px] truncate">
                                {user?.user_metadata?.full_name || user?.email}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => signOut()}
                            className="p-2 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-charcoal-400 hover:text-charcoal-500 hover:bg-charcoal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-charcoal-200">
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        {showExitBuilder && (
                            <button
                                type="button"
                                onClick={onDashboardClick}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-charcoal-700 hover:text-charcoal-900 hover:bg-charcoal-50"
                            >
                                Exit Builder
                            </button>
                        )}
                        <div className="px-3 py-3 border-t border-charcoal-100 mt-2">
                            <p className="text-sm font-medium text-charcoal-500">Signed in as</p>
                            <p className="text-sm font-bold text-charcoal-900 truncate">{user?.email}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => signOut()}
                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};
