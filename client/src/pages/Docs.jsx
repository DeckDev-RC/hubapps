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
    AlertCircle, Clock, Hash, List, Info,
    AlertTriangle, Zap, StopCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mermaid Renderer Component
const Mermaid = ({ chart }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && chart) {
            mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });
            mermaid.contentLoaded();
        }
    }, [chart]);

    return (
        <div className="mermaid bg-white/5 p-6 rounded-2xl my-8 overflow-x-auto flex justify-center" ref={ref}>
            {chart}
        </div>
    );
};

// Custom Alert Component (GitHub style [!NOTE])
const Adminition = ({ type, children }) => {
    const configs = {
        note: { icon: <Info className="w-5 h-5" />, color: 'blue', label: 'NOTA' },
        tip: { icon: <Zap className="w-5 h-5" />, color: 'green', label: 'DICA' },
        important: { icon: <AlertCircle className="w-5 h-5" />, color: 'purple', label: 'IMPORTANTE' },
        warning: { icon: <AlertTriangle className="w-5 h-5" />, color: 'orange', label: 'AVISO' },
        caution: { icon: <StopCircle className="w-5 h-5" />, color: 'red', label: 'CUIDADO' }
    };

    const config = configs[type.toLowerCase()] || configs.note;
    const colorClass = {
        blue: 'border-blue-500/50 bg-blue-500/5 text-blue-200',
        green: 'border-green-500/50 bg-green-500/5 text-green-200',
        purple: 'border-purple-500/50 bg-purple-500/5 text-purple-200',
        orange: 'border-orange-500/50 bg-orange-500/5 text-orange-200',
        red: 'border-red-500/50 bg-red-500/5 text-red-200'
    }[config.color];

    return (
        <div className={`my-8 border-l-4 p-6 rounded-r-2xl ${colorClass} shadow-lg`}>
            <div className="flex items-center gap-2 mb-3 font-bold text-xs tracking-widest uppercase opacity-80">
                {config.icon}
                {config.label}
            </div>
            <div className="text-sm md:text-base leading-relaxed">
                {children}
            </div>
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
    const [toc, setToc] = useState([]);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/docs');
            const data = response.data;
            setDocs(data);
            const cats = [...new Set(data.map(d => d.category))];
            setCategories(cats);
            if (data.length > 0) handleSelectDoc(data[0]);
        } catch (error) {
            console.error('Error fetching docs', error);
        } finally {
            setLoading(false);
        }
    };

    const extractToc = (content) => {
        const lines = content.split('\n');
        const headings = [];
        lines.forEach(line => {
            const match = line.match(/^(#{2,3})\s+(.+)$/);
            if (match) {
                headings.push({
                    level: match[1].length,
                    text: match[2].trim(),
                    id: match[2].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                });
            }
        });
        setToc(headings);
    };

    const handleSelectDoc = async (doc) => {
        setSelectedDoc(doc);
        setSidebarOpen(false);
        if (doc.type === 'markdown') {
            try {
                setContentLoading(true);
                const response = await api.get(`/docs/${doc.id}`);
                const content = response.data.content || '';
                setSelectedDocContent(content);
                extractToc(content);
                setTimeout(() => { mermaid.run(); }, 100);
            } catch (error) {
                console.error('Error fetching doc content', error);
            } finally {
                setContentLoading(false);
            }
        } else {
            setSelectedDocContent('');
            setToc([]);
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
        <div className="min-h-screen bg-[#050505] flex flex-col text-white">
            <Header />

            <div className="flex-grow flex pt-20">
                {/* Main Sidebar (Documents) */}
                <aside className={`
                    fixed lg:sticky top-20 bottom-0 left-0 z-40 w-80 lg:w-72 
                    bg-[#050505] border-r border-white/5 overflow-y-auto custom-scrollbar
                    transition-transform duration-300 transform
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-6 space-y-8">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-secondary" />
                            <input
                                type="text" placeholder="Pesquisar manuais..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-apple-accent"
                            />
                        </div>

                        <nav className="space-y-8">
                            {categories.map(cat => (
                                <div key={cat} className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-apple-secondary/50 ml-1">
                                        {cat}
                                    </h3>
                                    <div className="space-y-1">
                                        {groupedDocs[cat]?.map(doc => (
                                            <button
                                                key={doc.id} onClick={() => handleSelectDoc(doc)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                                                    ${selectedDoc?.id === doc.id
                                                        ? 'bg-apple-accent/10 text-apple-accent font-bold'
                                                        : 'text-apple-secondary hover:bg-white/5 hover:text-white'}
                                                `}
                                            >
                                                {doc.type === 'pdf' ? <FileText className="w-4 h-4" /> : <Book className="w-4 h-4" />}
                                                <span className="truncate">{doc.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 bg-[#050505] p-6 lg:p-12 xl:p-20 overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-[60vh] flex flex-col items-center justify-center gap-4"
                            >
                                <Loader2 className="w-8 h-8 text-apple-accent animate-spin" />
                            </motion.div>
                        ) : selectedDoc ? (
                            <motion.div
                                key={selectedDoc.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="max-w-4xl mx-auto"
                            >
                                <header className="mb-16">
                                    <div className="flex items-center gap-2 text-apple-secondary text-[10px] font-bold uppercase tracking-widest mb-6">
                                        <span className="bg-white/5 px-2 py-1 rounded-md">{selectedDoc.category}</span>
                                        <span>/</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedDoc.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <h1 className="text-4xl lg:text-6xl font-extrabold mb-8 tracking-tight text-white leading-[1.1]">
                                        {selectedDoc.title}
                                    </h1>
                                    <p className="text-lg md:text-xl text-apple-secondary leading-relaxed font-medium">
                                        {selectedDoc.description}
                                    </p>
                                </header>

                                <div className="prose prose-invert max-w-none">
                                    {contentLoading ? (
                                        <div className="py-20 flex justify-center"><Loader2 className="w-12 h-12 text-apple-accent animate-spin" /></div>
                                    ) : selectedDoc.type === 'pdf' ? (
                                        <div className="space-y-8">
                                            <div className="w-full h-[800px] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black/20">
                                                <iframe src={`${getAssetUrl(selectedDoc.fileUrl)}#toolbar=0`} className="w-full h-full border-none" title={selectedDoc.title} />
                                            </div>
                                            <div className="flex justify-center gap-4">
                                                <a href={getAssetUrl(selectedDoc.fileUrl)} download className="apple-button-secondary flex items-center gap-2">
                                                    <Download className="w-4 h-4" /> Download PDF
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="markdown-content selection:bg-apple-accent/30">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    code({ node, inline, className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        if (!inline && match && match[1] === 'mermaid') return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                                        return (
                                                            <code className={`${className} bg-white/5 px-1.5 py-0.5 rounded text-apple-accent font-mono text-sm`} {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    },
                                                    blockquote: ({ children }) => {
                                                        // Check for GitHub-style alerts in blockquote text
                                                        const text = String(children[1]?.props?.children || '');
                                                        const alertMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

                                                        if (alertMatch) {
                                                            const type = alertMatch[1];
                                                            // Remove the [!TYPE] marker from the content
                                                            const rest = React.Children.toArray(children).slice(1);
                                                            // For the first paragraph, remove the marker text
                                                            if (rest[0]?.props?.children) {
                                                                const inner = rest[0].props.children;
                                                                if (typeof inner === 'string') {
                                                                    rest[0] = React.cloneElement(rest[0], {}, inner.replace(/^\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, ''));
                                                                }
                                                            }
                                                            return <Adminition type={type}>{rest}</Adminition>;
                                                        }

                                                        return (
                                                            <div className="bg-white/5 border-l-4 border-apple-accent/50 p-6 rounded-r-2xl my-8 italic text-apple-secondary">
                                                                {children}
                                                            </div>
                                                        );
                                                    },
                                                    h2: ({ children }) => {
                                                        const id = String(children[0]).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                                        return <h2 id={id} className="group text-3xl font-bold mt-16 mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
                                                            <Hash className="w-5 h-5 text-apple-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            {children}
                                                        </h2>;
                                                    },
                                                    h3: ({ children }) => {
                                                        const id = String(children[0]).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                                        return <h3 id={id} className="text-2xl font-bold mt-12 mb-6 text-white/90">{children}</h3>;
                                                    },
                                                    p: ({ children }) => <p className="text-apple-secondary text-lg leading-[1.8] mb-8 font-normal">{children}</p>,
                                                    ul: ({ children }) => <ul className="space-y-4 mb-10 ml-2">{children}</ul>,
                                                    li: ({ children }) => <li className="text-apple-secondary flex gap-3 text-lg leading-relaxed">
                                                        <span className="text-apple-accent mt-2 shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-current" /></span>
                                                        <div>{children}</div>
                                                    </li>,
                                                    img: ({ src, alt, ...props }) => (
                                                        <div className="my-14 text-center">
                                                            <img src={getAssetUrl(src)} alt={alt} className="rounded-[2rem] border border-white/10 shadow-2xl mx-auto max-h-[700px] object-contain hover:scale-[1.01] transition-transform duration-500" {...props} />
                                                            {alt && <p className="mt-4 text-xs text-apple-secondary font-medium tracking-wide uppercase">{alt}</p>}
                                                        </div>
                                                    ),
                                                }}
                                            >
                                                {selectedDocContent}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
                                <Book className="w-16 h-16 text-apple-secondary/20" />
                                <h3 className="text-xl font-bold text-apple-secondary">Selecione um manual lateral</h3>
                            </div>
                        )}
                    </AnimatePresence>
                </main>

                {/* Table of Contents (Right Sidebar) */}
                <aside className="display-none xl:block w-72 h-[calc(100vh-80px)] sticky top-20 p-8 border-l border-white/5 overflow-y-auto">
                    <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-apple-secondary">
                            <List className="w-3 h-3" /> Nesta página
                        </h4>
                        <nav className="space-y-4">
                            {toc.length > 0 ? toc.map((item, i) => (
                                <a
                                    key={i} href={`#${item.id}`}
                                    className={`
                                        block text-sm transition-all hover:text-white
                                        ${item.level === 3 ? 'pl-4 text-apple-secondary/60' : 'text-apple-secondary font-medium'}
                                    `}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    {item.text}
                                </a>
                            )) : (
                                <span className="text-xs text-apple-secondary/30 italic">Nenhum tópico encontrado</span>
                            )}
                        </nav>
                    </div>
                </aside>
            </div>

            <Footer />
        </div>
    );
};

export default Docs;
