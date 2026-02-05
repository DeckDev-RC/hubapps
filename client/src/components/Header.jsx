import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor, ShieldCheck } from 'lucide-react';

const Header = () => {
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

                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2.5 rounded-xl hover:bg-white/10 transition-colors">
                        <ShieldCheck className="w-5 h-5 text-apple-secondary" />
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
