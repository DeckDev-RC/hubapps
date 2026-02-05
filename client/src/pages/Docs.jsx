import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api, { getAssetUrl } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import {
    Search, Book, FileText, ChevronRight,
    Menu, X, Loader2, Download, ExternalLink,
    AlertCircle, Clock, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mermaid Renderer Component
const Mermaid = ({ chart }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && chart) {
            mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });
            mermaid.contentLoaded();

            // Re-render specifically for this component if needed
            // (Standard contentLoaded often works for initialized charts)
        }
    }, [chart]);

    return (
        <div className="mermaid bg-white/5 p-6 rounded-2xl my-8 overflow-x-auto flex justify-center" ref={ref}>
            {chart}
        </div>
    );
};

const Docs = () => {
    const [docs, setDocs] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [selectedDocContent, setSelectedDocContent] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/docs');
            const data = response.data;
            setDocs(data);

            // Extract unique categories
            const cats = [...new Set(data.map(d => d.category))];
            setCategories(cats);

            // Select first doc by default if exists
            if (data.length > 0) {
                handleSelectDoc(data[0]);
            }
        } catch (error) {
            console.error('Error fetching docs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDoc = async (doc) => {
        setSelectedDoc(doc);
        setSidebarOpen(false);
        if (doc.type === 'markdown') {
            try {
                setContentLoading(true);
                const response = await api.get(`/docs/${doc.id}`);
                setSelectedDocContent(response.data.content || '');
                // Initialize mermaid after content load
                setTimeout(() => {
                    mermaid.run();
                }, 100);
            } catch (error) {
                console.error('Error fetching doc content', error);
            } finally {
                setContentLoading(false);
            }
        } else {
            setSelectedDocContent('');
        }
    };

    const filteredDocs = docs.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedDocs = categories.reduce((acc, cat) => {
        acc[cat] = filteredDocs.filter(d => d.category === cat);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col">
            <Header />

            <div className="flex-grow flex pt-20">
                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <aside className={`
                    fixed lg:sticky top-20 bottom-0 left-0 z-40 w-80 lg:w-72 
                    bg-[#0a0a0a] border-r border-white/5 overflow-y-auto custom-scrollbar
                    transition-transform duration-300 transform
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-6 space-y-6">
                        {/* Internal Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-secondary" />
                            <input
                                type="text"
                                placeholder="Pesquisar manuais..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-apple-accent"
                            />
                        </div>

                        {/* Navigation List */}
                        <nav className="space-y-8">
                            {categories.map(cat => (
                                <div key={cat} className="space-y-3">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-secondary ml-1">
                                        {cat}
                                    </h3>
                                    <div className="space-y-1">
                                        {groupedDocs[cat]?.map(doc => (
                                            <button
                                                key={doc.id}
                                                onClick={() => handleSelectDoc(doc)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                                                    ${selectedDoc?.id === doc.id
                                                        ? 'bg-apple-accent/10 text-apple-accent font-bold'
                                                        : 'text-apple-secondary hover:bg-white/5 hover:text-white'}
                                                `}
                                            >
                                                {doc.type === 'pdf' ? <FileText className="w-4 h-4" /> : <Book className="w-4 h-4" />}
                                                <span className="truncate">{doc.title}</span>
                                                {selectedDoc?.id === doc.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 min-w-0 bg-[#050505] p-6 lg:p-12">
                    {/* Mobile Header */}
                    <div className="flex items-center gap-4 mb-8 lg:hidden">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 bg-white/5 rounded-lg border border-white/10"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold">Documentação</h1>
                    </div>

                    {loading ? (
                        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 text-apple-accent animate-spin" />
                            <span className="text-apple-secondary">Carregando conhecimentos...</span>
                        </div>
                    ) : selectedDoc ? (
                        <div className="max-w-4xl mx-auto">
                            {/* Doc Header */}
                            <header className="mb-12">
                                <div className="flex items-center gap-2 text-apple-secondary text-sm mb-4">
                                    <span className="bg-white/5 px-2 py-1 rounded-md">{selectedDoc.category}</span>
                                    <span>/</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedDoc.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
                                    {selectedDoc.title}
                                </h1>
                                <p className="text-xl text-apple-secondary leading-relaxed">
                                    {selectedDoc.description}
                                </p>
                            </header>

                            {/* Divider */}
                            <div className="h-px bg-white/5 w-full mb-12" />

                            {/* Content Body */}
                            <div className="prose prose-invert max-w-none">
                                {contentLoading ? (
                                    <div className="py-20 flex justify-center">
                                        <Loader2 className="w-12 h-12 text-apple-accent animate-spin" />
                                    </div>
                                ) : selectedDoc.type === 'pdf' ? (
                                    <div className="space-y-6">
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                                            <FileText className="w-16 h-16 text-apple-accent mx-auto mb-6" />
                                            <h3 className="text-xl font-bold mb-2">Este documento é um PDF</h3>
                                            <p className="text-apple-secondary mb-8">
                                                Para garantir a melhor experiência de leitura, você pode visualizar o PDF
                                                integrado ou baixá-lo para consulta offline.
                                            </p>
                                            <div className="flex flex-wrap justify-center gap-4">
                                                <a
                                                    href={getAssetUrl(selectedDoc.fileUrl)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="apple-button-primary flex items-center gap-2"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Abrir Visualizador
                                                </a>
                                                <a
                                                    href={getAssetUrl(selectedDoc.fileUrl)}
                                                    download
                                                    className="apple-button-secondary flex items-center gap-2"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download PDF
                                                </a>
                                            </div>
                                        </div>

                                        {/* Embedded PDF Preview */}
                                        <div className="w-full h-[800px] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                            <iframe
                                                src={`${getAssetUrl(selectedDoc.fileUrl)}#toolbar=0`}
                                                className="w-full h-full border-none"
                                                title={selectedDoc.title}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="markdown-content">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ node, inline, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    if (!inline && match && match[1] === 'mermaid') {
                                                        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                                    }
                                                    return (
                                                        <code className={`${className} bg-white/5 px-1.5 py-0.5 rounded text-apple-accent`} {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                                h1: ({ children }) => <h2 className="text-3xl font-bold mt-12 mb-6 border-b border-white/5 pb-4">{children}</h2>,
                                                h2: ({ children }) => <h3 className="text-2xl font-bold mt-10 mb-5">{children}</h3>,
                                                h3: ({ children }) => <h4 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2"><Hash className="w-4 h-4 text-apple-accent" /> {children}</h4>,
                                                p: ({ children }) => <p className="text-apple-secondary text-lg leading-relaxed mb-6">{children}</p>,
                                                ul: ({ children }) => <ul className="space-y-3 mb-8 ml-4">{children}</ul>,
                                                ol: ({ children }) => <ol className="space-y-3 mb-8 ml-4 list-decimal">{children}</ol>,
                                                li: ({ children }) => <li className="text-apple-secondary flex gap-3 text-lg">
                                                    <span className="text-apple-accent mt-1.5 shrink-0"><ChevronRight className="w-4 h-4" /></span>
                                                    {children}
                                                </li>,
                                                blockquote: ({ children }) => (
                                                    <div className="bg-apple-accent/5 border-l-4 border-apple-accent p-6 rounded-r-2xl my-8 italic">
                                                        {children}
                                                    </div>
                                                ),
                                                table: ({ children }) => (
                                                    <div className="overflow-x-auto my-8 rounded-2xl border border-white/5">
                                                        <table className="w-full text-left">{children}</table>
                                                    </div>
                                                ),
                                                thead: ({ children }) => <thead className="bg-white/5 text-sm uppercase tracking-wider">{children}</thead>,
                                                th: ({ children }) => <th className="p-4 font-bold">{children}</th>,
                                                td: ({ children }) => <td className="p-4 border-t border-white/5">{children}</td>,
                                                img: ({ src, alt, ...props }) => (
                                                    <div className="my-10 space-y-3">
                                                        <img
                                                            src={getAssetUrl(src)}
                                                            alt={alt}
                                                            className="rounded-3xl border border-white/10 shadow-2xl mx-auto max-h-[600px] object-contain"
                                                            {...props}
                                                        />
                                                        {alt && <p className="text-center text-sm text-apple-secondary italic">{alt}</p>}
                                                    </div>
                                                ),
                                            }}
                                        >
                                            {selectedDocContent}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
                            <div className="p-4 bg-white/5 rounded-3xl">
                                <Book className="w-12 h-12 text-apple-secondary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Nenhum documento selecionado</h3>
                                <p className="text-apple-secondary">Escolha um manual na barra lateral para começar.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default Docs;
