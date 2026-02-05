import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            toast.success('Bem-vindo ao painel administrativo');
            navigate('/admin/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao realizar login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-apple-bg">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-apple-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mx-auto mb-6">
                        <ShieldCheck className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Acesso Restrito</h1>
                    <p className="text-apple-secondary">Entre com suas credenciais de administrador</p>
                </div>

                <div className="glass p-8 rounded-[2rem]">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 pl-1">Email Corporativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                className="w-full apple-input"
                                placeholder="exemplo@empresa.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 pl-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="w-full apple-input"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full apple-button-primary flex items-center justify-center gap-2 py-3.5"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Entrar no Painel
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-apple-secondary text-sm">
                    Apenas usuários autorizados podem acessar esta área.
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
