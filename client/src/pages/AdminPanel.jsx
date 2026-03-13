import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, LogOut, Package, DownloadCloud, Trash2, Edit2,
    Upload, X, Check, Clock, Users, Building2,
    FileText, Book, Settings, Eye, EyeOff
} from 'lucide-react';
import api, { getAssetUrl } from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('softwares');
    const [apps, setApps] = useState([]);
    const [docs, setDocs] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ totalApps: 0, totalDownloads: 0, lastUpdate: '', totalDocs: 0 });
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingApp, setEditingApp] = useState(null);
    const [editingDoc, setEditingDoc] = useState(null);
    const [editingDept, setEditingDept] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const [appFormData, setAppFormData] = useState({
        name: '', version: '', category: 'Produtividade', shortDescription: '',
        fullDescription: '', changelog: '', requirements: '', allowedDepartments: []
    });
    const [appFiles, setAppFiles] = useState({ logo: null, installer: null });
    const [appPreviews, setAppPreviews] = useState({ logo: null });

    const [docFormData, setDocFormData] = useState({
        title: '', category: 'Geral', description: '', type: 'markdown', content: ''
    });
    const [docFile, setDocFile] = useState(null);

    const [deptFormData, setDeptFormData] = useState({ name: '', description: '' });
    
    const [userFormData, setUserFormData] = useState({
        name: '', email: '', password: '', departmentId: '', active: true
    });
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/admin');
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [appsRes, statsRes, docsRes, deptsRes, usersRes] = await Promise.all([
                api.get('/apps/all'),
                api.get('/apps/stats/summary'),
                api.get('/docs'),
                api.get('/departments'),
                api.get('/users')
            ]);
            setApps(appsRes.data);
            setStats({ ...statsRes.data, totalDocs: docsRes.data.length });
            setDocs(docsRes.data);
            setDepartments(deptsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados');
            if (error.response?.status === 401) navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
            fullDescription: '', changelog: '', requirements: '', allowedDepartments: []
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
                changelog: app.changelog, requirements: app.requirements,
                allowedDepartments: app.allowedDepartments || []
            });
            setAppPreviews({ logo: getAssetUrl(app.logoUrl) });
        } else {
            resetAppForm();
        }
        setShowModal(true);
    };

    const toggleDepartmentSelection = (deptId) => {
        setAppFormData(prev => ({
            ...prev,
            allowedDepartments: prev.allowedDepartments.includes(deptId)
                ? prev.allowedDepartments.filter(id => id !== deptId)
                : [...prev.allowedDepartments, deptId]
        }));
    };

    // --- Departments Handlers ---
    const resetDeptForm = () => {
        setDeptFormData({ name: '', description: '' });
        setEditingDept(null);
    };

    const openDeptForm = (dept = null) => {
        setActiveTab('departments');
        if (dept) {
            setEditingDept(dept);
            setDeptFormData({ name: dept.name, description: dept.description || '' });
        } else {
            resetDeptForm();
        }
        setShowModal(true);
    };

    const handleDeptSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDept) {
                await api.put(`/departments/${editingDept.id}`, deptFormData);
                toast.success('Departamento atualizado!');
            } else {
                await api.post('/departments', deptFormData);
                toast.success('Departamento criado!');
            }
            setShowModal(false);
            resetDeptForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar departamento');
        }
    };

    const handleDeleteDept = async (id) => {
        if (window.confirm('Excluir este departamento?')) {
            try {
                await api.delete(`/departments/${id}`);
                toast.success('Departamento excluído!');
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Erro ao excluir departamento');
            }
        }
    };

    // --- Users Handlers ---
    const resetUserForm = () => {
        setUserFormData({ name: '', email: '', password: '', departmentId: '', active: true });
        setEditingUser(null);
        setShowPassword(false);
    };

    const openUserForm = (user = null) => {
        setActiveTab('users');
        if (user) {
            setEditingUser(user);
            setUserFormData({
                name: user.name,
                email: user.email,
                password: '',
                departmentId: user.departmentId,
                active: user.active
            });
        } else {
            resetUserForm();
        }
        setShowModal(true);
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...userFormData };
            if (!payload.password && editingUser) {
                delete payload.password;
            }
            
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, payload);
                toast.success('Usuário atualizado!');
            } else {
                await api.post('/users', payload);
                toast.success('Usuário criado!');
            }
            setShowModal(false);
            resetUserForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar usuário');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Excluir este usuário?')) {
            try {
                await api.delete(`/users/${id}`);
                toast.success('Usuário excluído!');
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Erro ao excluir usuário');
            }
        }
    };

    const getDepartmentName = (deptId) => {
        const dept = departments.find(d => d.id === deptId);
        return dept?.name || 'Sem departamento';
    };

    const handleMdFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setDocFormData(prev => ({ ...prev, content: event.target.result }));
                toast.success('Arquivo Markdown carregado!');
            };
            reader.readAsText(file);
        }
    };

    const handleAppSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(appFormData).forEach(key => {
            if (key === 'allowedDepartments') {
                data.append(key, JSON.stringify(appFormData[key]));
            } else {
                data.append(key, appFormData[key]);
            }
        });
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'softwares' ? 'bg-apple-accent text-white shadow-lg' : 'text-apple-secondary hover:text-white'}`}
                        >
                            Softwares
                        </button>
                        <button
                            onClick={() => setActiveTab('docs')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'docs' ? 'bg-apple-accent text-white shadow-lg' : 'text-apple-secondary hover:text-white'}`}
                        >
                            Docs
                        </button>
                        <button
                            onClick={() => setActiveTab('departments')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'departments' ? 'bg-apple-accent text-white shadow-lg' : 'text-apple-secondary hover:text-white'}`}
                        >
                            Departamentos
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-apple-accent text-white shadow-lg' : 'text-apple-secondary hover:text-white'}`}
                        >
                            Usuários
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
                            {activeTab === 'softwares' && 'Catálogo de Softwares'}
                            {activeTab === 'docs' && 'Central de Documentos'}
                            {activeTab === 'departments' && 'Departamentos'}
                            {activeTab === 'users' && 'Usuários'}
                        </h1>
                        <p className="text-apple-secondary">
                            {activeTab === 'softwares' && 'Gerencie os aplicativos disponíveis para a empresa.'}
                            {activeTab === 'docs' && 'Gerencie os documentos e manuais.'}
                            {activeTab === 'departments' && 'Gerencie os departamentos da empresa.'}
                            {activeTab === 'users' && 'Gerencie os usuários e suas permissões.'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (activeTab === 'softwares') openAppForm();
                            else if (activeTab === 'docs') openDocForm();
                            else if (activeTab === 'departments') openDeptForm();
                            else if (activeTab === 'users') openUserForm();
                        }}
                        className="apple-button-primary flex items-center gap-2 self-start"
                    >
                        <Plus className="w-5 h-5" />
                        {activeTab === 'softwares' && 'Novo App'}
                        {activeTab === 'docs' && 'Novo Documento'}
                        {activeTab === 'departments' && 'Novo Departamento'}
                        {activeTab === 'users' && 'Novo Usuário'}
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {activeTab === 'softwares' && (
                        <>
                            <StatCard icon={<Package className="text-blue-500" />} label="Apps Ativos" value={stats.totalApps} />
                            <StatCard icon={<DownloadCloud className="text-green-500" />} label="Downloads" value={stats.totalDownloads} />
                            <StatCard icon={<Clock className="text-orange-500" />} label="Último Update" value={stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : '-'} />
                        </>
                    )}
                    {activeTab === 'docs' && (
                        <>
                            <StatCard icon={<Book className="text-purple-500" />} label="Documentos" value={stats.totalDocs} />
                            <StatCard icon={<FileText className="text-blue-500" />} label="Categorias" value={[...new Set(docs.map(d => d.category))].length} />
                            <StatCard icon={<Check className="text-green-500" />} label="Status Sistema" value="Online" />
                        </>
                    )}
                    {activeTab === 'departments' && (
                        <>
                            <StatCard icon={<Building2 className="text-purple-500" />} label="Departamentos" value={departments.length} />
                            <StatCard icon={<Users className="text-blue-500" />} label="Total Usuários" value={users.length} />
                            <StatCard icon={<Check className="text-green-500" />} label="Status Sistema" value="Online" />
                        </>
                    )}
                    {activeTab === 'users' && (
                        <>
                            <StatCard icon={<Users className="text-blue-500" />} label="Usuários Ativos" value={users.filter(u => u.active).length} />
                            <StatCard icon={<Users className="text-red-500" />} label="Inativos" value={users.filter(u => !u.active).length} />
                            <StatCard icon={<Building2 className="text-purple-500" />} label="Departamentos" value={departments.length} />
                        </>
                    )}
                </div>

                <div className="glass rounded-[2rem] overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h2 className="font-bold flex items-center gap-2">
                            {activeTab === 'softwares' && <><Package className="w-4 h-4" /> Lista de Softwares</>}
                            {activeTab === 'docs' && <><Book className="w-4 h-4" /> Biblioteca Digital</>}
                            {activeTab === 'departments' && <><Building2 className="w-4 h-4" /> Lista de Departamentos</>}
                            {activeTab === 'users' && <><Users className="w-4 h-4" /> Lista de Usuários</>}
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-apple-secondary bg-white/[0.02]">
                                    {activeTab === 'softwares' && (
                                        <>
                                            <th className="p-6 font-medium">Nome</th>
                                            <th className="p-6 font-medium">Categoria</th>
                                            <th className="p-6 font-medium">Versão</th>
                                            <th className="p-6 font-medium">Departamentos</th>
                                            <th className="p-6 font-medium text-right">Ações</th>
                                        </>
                                    )}
                                    {activeTab === 'docs' && (
                                        <>
                                            <th className="p-6 font-medium">Título</th>
                                            <th className="p-6 font-medium">Categoria</th>
                                            <th className="p-6 font-medium">Tipo</th>
                                            <th className="p-6 font-medium">Modificado em</th>
                                            <th className="p-6 font-medium text-right">Ações</th>
                                        </>
                                    )}
                                    {activeTab === 'departments' && (
                                        <>
                                            <th className="p-6 font-medium">Nome</th>
                                            <th className="p-6 font-medium">Descrição</th>
                                            <th className="p-6 font-medium">Usuários</th>
                                            <th className="p-6 font-medium">Criado em</th>
                                            <th className="p-6 font-medium text-right">Ações</th>
                                        </>
                                    )}
                                    {activeTab === 'users' && (
                                        <>
                                            <th className="p-6 font-medium">Nome</th>
                                            <th className="p-6 font-medium">Email</th>
                                            <th className="p-6 font-medium">Departamento</th>
                                            <th className="p-6 font-medium">Status</th>
                                            <th className="p-6 font-medium text-right">Ações</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {activeTab === 'softwares' && apps.map(app => (
                                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6 flex items-center gap-4 text-white">
                                            <img src={getAssetUrl(app.logoUrl)} className="w-10 h-10 rounded-xl bg-white/5 object-cover" />
                                            <span className="font-bold">{app.name}</span>
                                        </td>
                                        <td className="p-6 text-apple-secondary">{app.category}</td>
                                        <td className="p-6"><span className="bg-white/5 px-2 py-1 rounded-md">v{app.version}</span></td>
                                        <td className="p-6 text-apple-secondary">
                                            {!app.allowedDepartments || app.allowedDepartments.length === 0 
                                                ? <span className="text-green-500 text-xs">Todos</span>
                                                : <span className="text-xs">{app.allowedDepartments.map(id => getDepartmentName(id)).join(', ')}</span>
                                            }
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openAppForm(app)} className="p-2 hover:bg-apple-accent/20 rounded-lg text-apple-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteApp(app.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {activeTab === 'docs' && docs.map(doc => (
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
                                ))}
                                {activeTab === 'departments' && departments.map(dept => (
                                    <tr key={dept.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6 font-bold flex items-center gap-3">
                                            <Building2 className="w-4 h-4 text-purple-500" />
                                            {dept.name}
                                        </td>
                                        <td className="p-6 text-apple-secondary">{dept.description || '-'}</td>
                                        <td className="p-6">
                                            <span className="bg-white/5 px-2 py-1 rounded-md">
                                                {users.filter(u => u.departmentId === dept.id).length} usuários
                                            </span>
                                        </td>
                                        <td className="p-6 text-apple-secondary">{new Date(dept.createdAt).toLocaleDateString()}</td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openDeptForm(dept)} className="p-2 hover:bg-apple-accent/20 rounded-lg text-apple-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteDept(dept.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {activeTab === 'users' && users.map(user => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6 font-bold flex items-center gap-3">
                                            <Users className="w-4 h-4 text-blue-500" />
                                            {user.name}
                                        </td>
                                        <td className="p-6 text-apple-secondary">{user.email}</td>
                                        <td className="p-6 text-apple-secondary">{getDepartmentName(user.departmentId)}</td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {user.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openUserForm(user)} className="p-2 hover:bg-apple-accent/20 rounded-lg text-apple-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

                            {activeTab === 'softwares' && (
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
                                        <div className="mt-8">
                                            <label className="text-sm pl-1 block mb-3">Departamentos Autorizados</label>
                                            <p className="text-xs text-apple-secondary mb-4">Selecione quais departamentos podem ver este app. Se nenhum for selecionado, todos terão acesso.</p>
                                            <div className="flex flex-wrap gap-2">
                                                {departments.map(dept => (
                                                    <button
                                                        key={dept.id}
                                                        type="button"
                                                        onClick={() => toggleDepartmentSelection(dept.id)}
                                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                                            appFormData.allowedDepartments.includes(dept.id)
                                                                ? 'bg-apple-accent text-white'
                                                                : 'bg-white/5 text-apple-secondary hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {dept.name}
                                                    </button>
                                                ))}
                                                {departments.length === 0 && (
                                                    <p className="text-apple-secondary text-sm">Nenhum departamento cadastrado ainda.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 border-t border-white/10 bg-white/[0.01]">
                                        <button type="submit" disabled={isUploading} className="w-full apple-button-primary">{isUploading ? `Enviando ${uploadProgress}%...` : 'Salvar Alterações'}</button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'docs' && (
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
                                                <div className="flex items-center justify-between pl-1">
                                                    <label className="text-sm font-bold">Conteúdo (Markdown)</label>
                                                    <label className="text-[10px] bg-apple-accent/20 text-apple-accent px-2 py-1 rounded-md cursor-pointer hover:bg-apple-accent/30 transition-colors">
                                                        Upar arquivo .md
                                                        <input type="file" className="hidden" accept=".md" onChange={handleMdFileUpload} />
                                                    </label>
                                                </div>
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

                            {activeTab === 'departments' && (
                                <form onSubmit={handleDeptSubmit} className="flex flex-col h-full">
                                    <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                        <h2 className="text-2xl font-bold">{editingDept ? 'Editar Departamento' : 'Novo Departamento'}</h2>
                                        <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                                    </div>
                                    <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-6">
                                        <div>
                                            <label className="text-sm pl-1 block mb-2">Nome do Departamento</label>
                                            <input
                                                type="text"
                                                value={deptFormData.name}
                                                onChange={e => setDeptFormData({ ...deptFormData, name: e.target.value })}
                                                className="w-full apple-input"
                                                placeholder="Ex: Tecnologia da Informação"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm pl-1 block mb-2">Descrição (opcional)</label>
                                            <textarea
                                                value={deptFormData.description}
                                                onChange={e => setDeptFormData({ ...deptFormData, description: e.target.value })}
                                                className="w-full apple-input h-32 resize-none"
                                                placeholder="Breve descrição do departamento..."
                                            />
                                        </div>
                                    </div>
                                    <div className="p-8 border-t border-white/10 bg-white/[0.01]">
                                        <button type="submit" className="w-full apple-button-primary">
                                            {editingDept ? 'Salvar Alterações' : 'Criar Departamento'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'users' && (
                                <form onSubmit={handleUserSubmit} className="flex flex-col h-full">
                                    <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                        <h2 className="text-2xl font-bold">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                                        <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                                    </div>
                                    <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm pl-1 block mb-2">Nome Completo</label>
                                                <input
                                                    type="text"
                                                    value={userFormData.name}
                                                    onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                                                    className="w-full apple-input"
                                                    placeholder="João da Silva"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm pl-1 block mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    value={userFormData.email}
                                                    onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                                                    className="w-full apple-input"
                                                    placeholder="joao@empresa.com"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm pl-1 block mb-2">
                                                    {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={userFormData.password}
                                                        onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                                                        className="w-full apple-input pr-12"
                                                        placeholder="••••••••"
                                                        required={!editingUser}
                                                        minLength={6}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-secondary hover:text-white transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm pl-1 block mb-2">Departamento</label>
                                                <select
                                                    value={userFormData.departmentId}
                                                    onChange={e => setUserFormData({ ...userFormData, departmentId: e.target.value })}
                                                    className="w-full apple-input appearance-none"
                                                    required
                                                >
                                                    <option value="">Selecione um departamento</option>
                                                    {departments.map(dept => (
                                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm pl-1 block mb-3">Status do Usuário</label>
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setUserFormData({ ...userFormData, active: true })}
                                                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                                                        userFormData.active
                                                            ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                                                            : 'bg-white/5 text-apple-secondary hover:bg-white/10'
                                                    }`}
                                                >
                                                    <Check className="w-4 h-4 inline mr-2" />
                                                    Ativo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setUserFormData({ ...userFormData, active: false })}
                                                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                                                        !userFormData.active
                                                            ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                                                            : 'bg-white/5 text-apple-secondary hover:bg-white/10'
                                                    }`}
                                                >
                                                    <X className="w-4 h-4 inline mr-2" />
                                                    Inativo
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 border-t border-white/10 bg-white/[0.01]">
                                        <button type="submit" className="w-full apple-button-primary">
                                            {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                                        </button>
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
