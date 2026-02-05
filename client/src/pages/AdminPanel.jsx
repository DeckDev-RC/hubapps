import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, LogOut, Package, DownloadCloud, RotateCw, Trash2, Edit2,
    Search, Upload, X, Check, Loader2, BarChart3, Clock,
    FileText, Book, Settings, ChevronRight
} from 'lucide-react';
import api, { getAssetUrl } from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('softwares'); // 'softwares' or 'docs'
    const [apps, setApps] = useState([]);
    const [docs, setDocs] = useState([]);
    const [stats, setStats] = useState({ totalApps: 0, totalDownloads: 0, lastUpdate: '', totalDocs: 0 });
    const [loading, setLoading] = useState(true);

    // Modal & Editing State
    const [showModal, setShowModal] = useState(false);
    const [editingApp, setEditingApp] = useState(null);
    const [editingDoc, setEditingDoc] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Form State (Apps)
    const [appFormData, setAppFormData] = useState({
        name: '', version: '', category: 'Produtividade', shortDescription: '',
        fullDescription: '', changelog: '', requirements: ''
    });
    const [appFiles, setAppFiles] = useState({ logo: null, installer: null });
    const [appPreviews, setAppPreviews] = useState({ logo: null });

    // Form State (Docs)
    const [docFormData, setDocFormData] = useState({
        title: '', category: 'Geral', description: '', type: 'markdown', content: ''
    });
    const [docFile, setDocFile] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/admin');
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [appsRes, statsRes, docsRes] = await Promise.all([
                api.get('/apps'),
                api.get('/apps/stats/summary'),
                api.get('/docs')
            ]);
            setApps(appsRes.data);
            setStats({ ...statsRes.data, totalDocs: docsRes.data.length });
            setDocs(docsRes.data);
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

    // --- Softwares Handlers ---
    const handleAppFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setAppFiles(prev => ({ ...prev, [type]: file }));
            if (type === 'logo') {
                setAppPreviews(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
            }
        }
    };

    const resetAppForm = () => {
        setAppFormData({
            name: '', version: '', category: 'Produtividade', shortDescription: '',
            fullDescription: '', changelog: '', requirements: ''
        });
        setAppFiles({ logo: null, installer: null });
        setAppPreviews({ logo: null });
        setEditingApp(null);
    };

    const openAppForm = (app = null) => {
        setActiveTab('softwares');
        if (app) {
            setEditingApp(app);
            setAppFormData({
                name: app.name, version: app.version, category: app.category,
                shortDescription: app.shortDescription, fullDescription: app.fullDescription,
                changelog: app.changelog, requirements: app.requirements
            });
            setAppPreviews({ logo: getAssetUrl(app.logoUrl) });
        } else {
            resetAppForm();
        }
        setShowModal(true);
    };

    const handleAppSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(appFormData).forEach(key => data.append(key, appFormData[key]));
        if (appFiles.logo) data.append('logo', appFiles.logo);
        if (appFiles.installer) data.append('installer', appFiles.installer);

        try {
            if (appFiles.installer && appFiles.installer.size > 500 * 1024 * 1024) return toast.error('O instalador excede 500MB');
            setIsUploading(true);
            if (editingApp) {
                await api.put(`/apps/${editingApp.id}`, data, {
                    onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total))
                });
                toast.success('App atualizado!');
            } else {
                await api.post('/apps', data, {
                    onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total))
                });
                toast.success('App criado!');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar app');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // --- Docs Handlers ---
    const resetDocForm = () => {
        setDocFormData({
            title: '', category: 'Geral', description: '', type: 'markdown', content: ''
        });
        setDocFile(null);
        setEditingDoc(null);
    };

    const openDocForm = async (doc = null) => {
        setActiveTab('docs');
        if (doc) {
            setEditingDoc(doc);
            try {
                setLoading(true);
                const res = await api.get(`/docs/${doc.id}`);
                setDocFormData({
                    title: res.data.title,
                    category: res.data.category,
                    description: res.data.description,
                    type: res.data.type,
                    content: res.data.content || ''
                });
            } catch (error) {
                toast.error('Erro ao buscar conteúdo');
            } finally {
                setLoading(false);
            }
        } else {
            resetDocForm();
        }
        setShowModal(true);
    };

    const handleDocSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(docFormData).forEach(key => data.append(key, docFormData[key]));
        if (docFile) data.append('file', docFile);

        try {
            setIsUploading(true);
            if (editingDoc) {
                await api.put(`/docs/${editingDoc.id}`, data);
                toast.success('Documento atualizado!');
            } else {
                await api.post('/docs', data);
                toast.success('Documento criado!');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error('Erro ao salvar documento');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteApp = async (id) => {
        if (window.confirm('Excluir este app?')) {
            await api.delete(`/apps/${id}`);
            fetchData();
        }
    };

    const handleDeleteDoc = async (id) => {
        if (window.confirm('Excluir este documento?')) {
            await api.delete(`/docs/${id}`);
            fetchData();
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <nav className="glass sticky top-0 z-50 border-b border-white/5 px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-apple-accent rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold">Painel de Administração</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('softwares')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'softwares' ? 'bg-apple-accent text-white shadow-lg' : 'text-apple-secondary hover:text-white'}`}
                        >
                            Softwares
                        </button>
                        <button
                            onClick={() => setActiveTab('docs')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'docs' ? 'bg-apple-accent text-white shadow-lg' : 'text-apple-secondary hover:text-white'}`}
                        >
                            Documentação
                        </button>
                    </div>
                    <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <LogOut className="w-5 h-5 text-apple-secondary hover:text-white" />
                    </button>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {activeTab === 'softwares' ? 'Catálogo de Softwares' : 'Central de Documentos'}
                        </h1>
                        <p className="text-apple-secondary">Gerencie os recursos disponíveis para a empresa.</p>
                    </div>
                    <button
                        onClick={() => activeTab === 'softwares' ? openAppForm() : openDocForm()}
                        className="apple-button-primary flex items-center gap-2 self-start"
                    >
                        <Plus className="w-5 h-5" />
                        {activeTab === 'softwares' ? 'Novo App' : 'Novo Documento'}
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {activeTab === 'softwares' ? (
                        <>
                            <StatCard icon={<Package className="text-blue-500" />} label="Apps Ativos" value={stats.totalApps} />
                            <StatCard icon={<DownloadCloud className="text-green-500" />} label="Downloads" value={stats.totalDownloads} />
                            <StatCard icon={<Clock className="text-orange-500" />} label="Último Update" value={stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : '-'} />
                        </>
                    ) : (
                        <>
                            <StatCard icon={<Book className="text-purple-500" />} label="Documentos" value={stats.totalDocs} />
                            <StatCard icon={<FileText className="text-blue-500" />} label="Categorias" value={[...new Set(docs.map(d => d.category))].length} />
                            <StatCard icon={<Check className="text-green-500" />} label="Status Sistema" value="Online" />
                        </>
                    )}
                </div>

                <div className="glass rounded-[2rem] overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h2 className="font-bold flex items-center gap-2">
                            {activeTab === 'softwares' ? <Package className="w-4 h-4" /> : <Book className="w-4 h-4" />}
                            {activeTab === 'softwares' ? 'Lista de Softwares' : 'Biblioteca Digital'}
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-apple-secondary bg-white/[0.02]">
                                    <th className="p-6 font-medium">Nome / Título</th>
                                    <th className="p-6 font-medium">Categoria</th>
                                    <th className="p-6 font-medium">{activeTab === 'softwares' ? 'Versão' : 'Tipo'}</th>
                                    <th className="p-6 font-medium">Modificado em</th>
                                    <th className="p-6 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {activeTab === 'softwares' ? (
                                    apps.map(app => (
                                        <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6 flex items-center gap-4 text-white">
                                                <img src={getAssetUrl(app.logoUrl)} className="w-10 h-10 rounded-xl bg-white/5 object-cover" />
                                                <span className="font-bold">{app.name}</span>
                                            </td>
                                            <td className="p-6 text-apple-secondary">{app.category}</td>
                                            <td className="p-6"><span className="bg-white/5 px-2 py-1 rounded-md">v{app.version}</span></td>
                                            <td className="p-6 text-apple-secondary">{new Date(app.updatedAt).toLocaleDateString()}</td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openAppForm(app)} className="p-2 hover:bg-apple-accent/20 rounded-lg text-apple-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteApp(app.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    docs.map(doc => (
                                        <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6 font-bold flex items-center gap-3">
                                                {doc.type === 'pdf' ? <FileText className="w-4 h-4 text-apple-accent" /> : <Book className="w-4 h-4 text-blue-500" />}
                                                {doc.title}
                                            </td>
                                            <td className="p-6 text-apple-secondary">{doc.category}</td>
                                            <td className="p-6"><span className="bg-white/5 px-2 py-1 rounded-md uppercase text-[10px] font-bold tracking-widest">{doc.type}</span></td>
                                            <td className="p-6 text-apple-secondary">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openDocForm(doc)} className="p-2 hover:bg-apple-accent/20 rounded-lg text-apple-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Unified Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isUploading && setShowModal(false)} className="fixed inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative glass w-full max-w-4xl rounded-[2.5rem] bg-[#0a0a0a] overflow-hidden max-h-[90vh] flex flex-col">

                            {activeTab === 'softwares' ? (
                                <form onSubmit={handleAppSubmit} className="flex flex-col h-full">
                                    <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                        <h2 className="text-2xl font-bold">{editingApp ? 'Editar App' : 'Novo App'}</h2>
                                        {!isUploading && <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>}
                                    </div>
                                    <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div><label className="text-sm pl-1">Nome</label><input type="text" value={appFormData.name} onChange={e => setAppFormData({ ...appFormData, name: e.target.value })} className="w-full apple-input" required /></div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1"><label className="text-sm pl-1">Versão</label><input type="text" value={appFormData.version} onChange={e => setAppFormData({ ...appFormData, version: e.target.value })} className="w-full apple-input" required /></div>
                                                    <div className="flex-1"><label className="text-sm pl-1">Categoria</label><select value={appFormData.category} onChange={e => setAppFormData({ ...appFormData, category: e.target.value })} className="w-full apple-input appearance-none"><option>Produtividade</option><option>Financeiro</option><option>RH</option><option>Comercial</option></select></div>
                                                </div>
                                                <div><label className="text-sm pl-1">Descrição Breve</label><textarea value={appFormData.shortDescription} onChange={e => setAppFormData({ ...appFormData, shortDescription: e.target.value })} className="w-full apple-input h-24 resize-none" required /></div>
                                            </div>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-sm pl-1">Logo</label>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">{appPreviews.logo ? <img src={appPreviews.logo} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-apple-secondary" />}</div>
                                                        <label className="flex-grow apple-button-secondary !py-2 text-center text-xs cursor-pointer"><Upload className="w-3 h-3 inline mr-2" /> Escolher Logo<input type="file" className="hidden" accept="image/*" onChange={e => handleAppFileChange(e, 'logo')} /></label>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm pl-1">Instalador (.exe / .msi)</label>
                                                    <label className="w-full h-24 border-dashed border-2 border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-apple-accent hover:bg-white/5 transition-all mt-2 text-apple-secondary hover:text-white">
                                                        <DownloadCloud className="w-6 h-6 mb-1" />
                                                        <span className="text-[10px] break-all px-4">{appFiles.installer?.name || 'Clique para enviar'}</span>
                                                        <input type="file" className="hidden" accept=".exe,.msi" onChange={e => handleAppFileChange(e, 'installer')} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 border-t border-white/10 bg-white/[0.01]">
                                        <button type="submit" disabled={isUploading} className="w-full apple-button-primary">{isUploading ? `Enviando ${uploadProgress}%...` : 'Salvar Alterações'}</button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleDocSubmit} className="flex flex-col h-full">
                                    <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                        <h2 className="text-2xl font-bold">{editingDoc ? 'Editar Documento' : 'Novo Documento'}</h2>
                                        {!isUploading && <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>}
                                    </div>
                                    <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div><label className="text-sm pl-1">Título do Manual</label><input type="text" value={docFormData.title} onChange={e => setDocFormData({ ...docFormData, title: e.target.value })} className="w-full apple-input" required /></div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1"><label className="text-sm pl-1">Categoria</label><input type="text" value={docFormData.category} onChange={e => setDocFormData({ ...docFormData, category: e.target.value })} className="w-full apple-input" placeholder="Ex: Financeiro" required /></div>
                                                    <div className="flex-1"><label className="text-sm pl-1">Tipo</label><select value={docFormData.type} onChange={e => setDocFormData({ ...docFormData, type: e.target.value })} className="w-full apple-input appearance-none disabled:opacity-50" disabled={!!editingDoc}><option value="markdown">Markdown</option><option value="pdf">Arquivo PDF</option></select></div>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div><label className="text-sm pl-1">Descrição Rápida</label><textarea value={docFormData.description} onChange={e => setDocFormData({ ...docFormData, description: e.target.value })} className="w-full apple-input h-[104px] resize-none" required /></div>
                                            </div>
                                        </div>

                                        {docFormData.type === 'markdown' ? (
                                            <div className="space-y-4" data-color-mode="dark">
                                                <label className="text-sm pl-1">Conteúdo (Markdown)</label>
                                                <MDEditor
                                                    value={docFormData.content}
                                                    onChange={(val) => setDocFormData({ ...docFormData, content: val || '' })}
                                                    height={400}
                                                    preview="edit"
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <label className="text-sm pl-1">Fazer Upload do PDF</label>
                                                <label className="w-full h-40 border-dashed border-2 border-white/10 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-apple-accent hover:bg-white/5 transition-all text-apple-secondary hover:text-white">
                                                    <FileText className="w-10 h-10 mb-2" />
                                                    <span className="text-sm font-bold">{docFile ? docFile.name : 'Selecionar arquivo .pdf'}</span>
                                                    <input type="file" className="hidden" accept=".pdf" onChange={e => setDocFile(e.target.files[0])} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-8 border-t border-white/10 bg-white/[0.01]">
                                        <button type="submit" disabled={isUploading} className="w-full apple-button-primary">{isUploading ? 'Processando...' : 'Publicar Documento'}</button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="glass p-6 rounded-3xl flex items-center gap-6">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center shadow-inner text-white">
            {React.cloneElement(icon, { className: 'w-7 h-7' })}
        </div>
        <div>
            <div className="text-[10px] text-apple-secondary uppercase tracking-[0.2em] mb-1">{label}</div>
            <div className="text-2xl font-bold font-mono">{value}</div>
        </div>
    </div>
);

export default AdminPanel;
