import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Shield, HardDrive, Info, CheckCircle2 } from 'lucide-react';
import api, { getAssetUrl, API_BASE_URL } from '../services/api';

const Modal = ({ app, onClose }) => {
    if (!app) return null;

    const handleDownload = async () => {
        try {
            await api.post(`/apps/${app.id}/download`);
            window.location.href = getAssetUrl(app.downloadUrl);
        } catch (error) {
            console.error('Error tracking download', error);
            window.location.href = getAssetUrl(app.downloadUrl);
        }
    };

    const baseUrl = API_BASE_URL.replace('/api', '');

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative glass w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col md:flex-row">
                        {/* Sidebar / Top Info */}
                        <div className="w-full md:w-1/3 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
                            <div className="w-32 h-32 mx-auto md:mx-0 rounded-[2rem] bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl mb-8">
                                <img
                                    src={getAssetUrl(app.logoUrl)}
                                    alt={app.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <h2 className="text-3xl font-bold mb-2 text-center md:text-left">{app.name}</h2>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-8">
                                <span className="px-3 py-1 rounded-full bg-apple-accent text-[10px] font-bold uppercase tracking-wider">{app.category}</span>
                                <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider">v{app.version}</span>
                            </div>

                            <button
                                onClick={handleDownload}
                                className="w-full apple-button-primary flex items-center justify-center gap-2 text-lg py-4 mb-4"
                            >
                                <Download className="w-6 h-6" />
                                Download Windows
                            </button>

                            <div className="flex flex-col gap-3 text-apple-secondary text-sm">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4" />
                                    <span>Tamanho: {app.fileSize}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    <span>Verificado e Seguro</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Compatível com Windows 10/11</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 p-8 md:p-12 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <section className="mb-10">
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-apple-accent mb-4">Sobre o Aplicativo</h3>
                                <p className="text-apple-secondary leading-relaxed whitespace-pre-line text-lg">
                                    {app.fullDescription || app.shortDescription}
                                </p>
                            </section>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-apple-accent mb-4">Requisitos</h3>
                                    <div className="text-apple-secondary bg-white/5 rounded-2xl p-6 border border-white/5">
                                        <pre className="font-sans whitespace-pre-wrap text-sm leading-relaxed">
                                            {app.requirements || "Processador de 1GHz\n4GB RAM\nInternet banda larga"}
                                        </pre>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-apple-accent mb-4">Notas da Versão</h3>
                                    <div className="text-apple-secondary bg-white/5 rounded-2xl p-6 border border-white/5">
                                        <pre className="font-sans whitespace-pre-wrap text-sm leading-relaxed italic">
                                            {app.changelog || "• Estabilidade aprimorada\n• Correções de bugs menores\n• Melhorias de performance"}
                                        </pre>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default Modal;
