import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Monitor, ShieldCheck, LogOut, User, Building2 } from 'lucide-react';
import { authService } from '../services/api';

const Header = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const isAdmin = authService.isAdmin();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-black/50 border-b border-white/10">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-apple-accent rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <Monitor className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Hub de Aplicativos</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link to="/" className="text-sm font-medium hover:text-apple-accent transition-colors">Portfólio</Link>
                    <Link to="/docs" className="text-sm font-medium hover:text-apple-accent transition-colors">Documentação</Link>
                    <a href="https://wa.me/550000000000" target="_blank" className="text-sm font-medium hover:text-apple-accent transition-colors">Suporte</a>
                </nav>

                <div className="flex items-center gap-3">
                    {user.name && (
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl">
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">{user.name}</p>
                                <p className="text-[10px] text-apple-secondary flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {user.departmentName || 'Admin'}
                                </p>
                            </div>
                            <div className="w-9 h-9 bg-apple-accent rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    )}
                    
                    {isAdmin && (
                        <Link to="/admin/dashboard" className="p-2.5 rounded-xl hover:bg-white/10 transition-colors" title="Painel Admin">
                            <ShieldCheck className="w-5 h-5 text-apple-secondary hover:text-apple-accent transition-colors" />
                        </Link>
                    )}
                    
                    <button 
                        onClick={handleLogout}
                        className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                        title="Sair"
                    >
                        <LogOut className="w-5 h-5 text-apple-secondary hover:text-red-500 transition-colors" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
