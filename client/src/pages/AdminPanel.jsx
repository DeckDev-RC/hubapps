import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, LogOut, Package, DownloadCloud, RotateCw, Trash2, Edit2,
    Search, Upload, X, Check, Loader2, BarChart3, Clock
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
    const [apps, setApps] = useState([]);
    const [stats, setStats] = useState({ totalApps: 0, totalDownloads: 0, lastUpdate: '' });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingApp, setEditingApp] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '', version: '', category: 'Produtividade', shortDescription: '',
        fullDescription: '', changelog: '', requirements: ''
    });
    const [files, setFiles] = useState({ logo: null, installer: null });
    const [previews, setPreviews] = useState({ logo: null });

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/admin');
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [appsRes, statsRes] = await Promise.all([
                api.get('/apps'),
                api.get('/apps/stats/summary')
            ]);
            setApps(appsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados');
            if (error.response?.status === 401) navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/admin');
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [type]: file }));
            if (type === 'logo') {
                setPreviews(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', version: '', category: 'Produtividade', shortDescription: '',
            fullDescription: '', changelog: '', requirements: ''
        });
        setFiles({ logo: null, installer: null });
        setPreviews({ logo: null });
        setEditingApp(null);
        setUploadProgress(0);
        setIsUploading(false);
    };

    const openForm = (app = null) => {
        if (app) {
            setEditingApp(app);
            setFormData({
                name: app.name,
                version: app.version,
                category: app.category,
                shortDescription: app.shortDescription,
                fullDescription: app.fullDescription,
                changelog: app.changelog,
                requirements: app.requirements
            });
            setPreviews({ logo: app.logoUrl.startsWith('/') ? `${api.defaults.baseURL.replace('/api', '')}${app.logoUrl}` : app.logoUrl });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (files.logo) data.append('logo', files.logo);
        if (files.installer) data.append('installer', files.installer);

        try {
            // Frontend validation: 500MB limit
            if (files.installer && files.installer.size > 500 * 1024 * 1024) {
                return toast.error('O instalador excede o limite de 500MB');
            }
            if (files.logo && files.logo.size > 5 * 1024 * 1024) {
                return toast.error('A logo excede o limite de 5MB');
            }

            setIsUploading(true);
            if (editingApp) {
                await api.put(`/apps/${editingApp.id}`, data, {
                    onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total))
                });
                toast.success('Aplicativo atualizado!');
            } else {
                await api.post('/apps', data, {
                    onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total))
                });
                toast.success('Aplicativo criado com sucesso!');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            if (error.response?.status === 413) {
                toast.error('Arquivo muito grande para o servidor (Limite: 500MB)');
            } else {
                toast.error(error.response?.data?.message || 'Erro ao salvar aplicativo');
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este aplicativo?')) {
            try {
                await api.delete(`/apps/${id}`);
                toast.success('Aplicativo removido');
                fetchData();
            } catch (error) {
                toast.error('Erro ao deletar');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#050505]">
            {/* Navbar Ad-hoc */}
            <nav className="glass sticky top-0 z-40 border-b border-white/5 px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-apple-accent rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold">Portal Diretor</span>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => openForm()}
                        className="apple-button-primary !py-1.5 !px-4 text-xs flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Novo App
                    </button>
                    <button onClick={handleLogout} className="text-apple-secondary hover:text-white transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-10">
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard icon={<Package className="text-blue-500" />} label="Total de Apps" value={stats.totalApps} />
                    <StatCard icon={<DownloadCloud className="text-green-500" />} label="Downloads Totais" value={stats.totalDownloads} />
                    <StatCard icon={<Clock className="text-orange-500" />} label="Último Update" value={stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : '-'} />
                </div>

                {/* Content Table */}
                <div className="glass rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h2 className="text-lg font-bold">Gerenciar Softwares</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-secondary" />
                            <input
                                type="text"
                                placeholder="Filtrar tabela..."
                                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-apple-accent"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-apple-secondary bg-white/[0.02]">
                                    <th className="p-6 font-medium">Nome</th>
                                    <th className="p-6 font-medium">Versão</th>
                                    <th className="p-6 font-medium">Downloads</th>
                                    <th className="p-6 font-medium">Data</th>
                                    <th className="p-6 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {apps.map(app => (
                                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6 flex items-center gap-4">
                                            <img src={`${api.defaults.baseURL.replace('/api', '')}${app.logoUrl}`} alt="" className="w-10 h-10 rounded-lg bg-white/5 object-cover" />
                                            <div>
                                                <div className="font-bold">{app.name}</div>
                                                <div className="text-xs text-apple-secondary">{app.category}</div>
                                            </div>
                                        </td>
                                        <td className="p-6"><span className="bg-white/5 px-2 py-1 rounded-md">v{app.version}</span></td>
                                        <td className="p-6 font-medium">{app.downloads}</td>
                                        <td className="p-6 text-apple-secondary">{new Date(app.updatedAt).toLocaleDateString()}</td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => openForm(app)} className="p-2 hover:bg-apple-accent/20 rounded-lg text-apple-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(app.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Admin Resource Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isUploading && setShowModal(false)} className="fixed inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative glass w-full max-w-3xl rounded-[2.5rem] bg-[#0a0a0a] overflow-hidden">
                            <form onSubmit={handleSubmit}>
                                <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">{editingApp ? 'Editar Aplicativo' : 'Adicionar Novo Aplicativo'}</h2>
                                    {!isUploading && (
                                        <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-white/10"><X className="w-6 h-6" /></button>
                                    )}
                                </div>

                                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Left Col: Info */}
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium mb-2 pl-1">Nome do Aplicativo</label>
                                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full apple-input" placeholder="Ex: Sistema de Gestão" required />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium mb-2 pl-1">Versão</label>
                                                    <input type="text" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} className="w-full apple-input" placeholder="1.0.0" required />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium mb-2 pl-1">Categoria</label>
                                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full apple-input appearance-none">
                                                        <option>Produtividade</option>
                                                        <option>Financeiro</option>
                                                        <option>RH</option>
                                                        <option>Utilitários</option>
                                                        <option>Comercial</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 pl-1">Descrição Breve</label>
                                                <textarea value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} className="w-full apple-input h-24 resize-none" placeholder="Ex: Ferramenta para gestão de fluxos..." required />
                                            </div>
                                        </div>

                                        {/* Right Col: Uploads */}
                                        <div className="space-y-6">
                                            {/* Logo Upload */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2 pl-1">Logo da Marca</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                        {previews.logo ? <img src={previews.logo} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-apple-secondary" />}
                                                    </div>
                                                    <label className="flex-grow apple-button-secondary !py-2 text-center text-sm cursor-pointer border-dashed border-2 border-white/10 bg-transparent hover:bg-white/5">
                                                        Selecionar Logo
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Installer Upload */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2 pl-1">Arquivo Executável (.exe / .msi)</label>
                                                <label className="w-full h-32 glass rounded-2xl border-dashed border-2 border-white/10 hover:border-apple-accent hover:bg-white/5 transition-all flex flex-col items-center justify-center cursor-pointer">
                                                    <DownloadCloud className={`w-8 h-8 mb-2 ${files.installer ? 'text-apple-success' : 'text-apple-secondary'}`} />
                                                    <span className="text-xs text-center px-4">
                                                        {files.installer ? files.installer.name : 'Arraste ou clique para enviar o instalador'}
                                                    </span>
                                                    <input type="file" className="hidden" accept=".exe,.msi" onChange={(e) => handleFileChange(e, 'installer')} />
                                                </label>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2 pl-1">Changelog / Notas</label>
                                                <textarea value={formData.changelog} onChange={(e) => setFormData({ ...formData, changelog: e.target.value })} className="w-full apple-input h-24 resize-none" placeholder="O que mudou nesta versão?" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <label className="block text-sm font-medium mb-2 pl-1">Requisitos do Sistema</label>
                                        <textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} className="w-full apple-input h-20 resize-none" placeholder="Ex: Win 10+, 4GB RAM..." />
                                    </div>
                                </div>

                                <div className="p-8 border-t border-white/10 bg-white/[0.01]">
                                    {isUploading ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span>Enviando dados...</span>
                                                <span className="font-bold text-apple-accent">{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-apple-accent"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4">
                                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 apple-button-secondary">Cancelar</button>
                                            <button type="submit" className="flex-1 apple-button-primary">{editingApp ? 'Guardar Alterações' : 'Publicar Aplicativo'}</button>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="glass p-6 rounded-3xl flex items-center gap-6">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center shadow-inner">
            {React.cloneElement(icon, { className: 'w-7 h-7' })}
        </div>
        <div>
            <div className="text-xs text-apple-secondary uppercase tracking-widest mb-1">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    </div>
);

export default AdminPanel;
