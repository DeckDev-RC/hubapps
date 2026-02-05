import React from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Info } from 'lucide-react';
import api, { getAssetUrl } from '../services/api';

const AppCard = ({ app, onClick }) => {
    const isNew = new Date(app.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const isUpdated = new Date(app.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && !isNew;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="glass group cursor-pointer p-6 rounded-3xl flex flex-col h-full hover:bg-white/[0.08] transition-all relative overflow-hidden"
            onClick={onClick}
        >
            {/* Badges */}
            <div className="absolute top-4 right-4 flex gap-2">
                {isNew && (
                    <span className="bg-apple-accent text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full">Novo</span>
                )}
                {isUpdated && (
                    <span className="bg-apple-success text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full">Atualizado</span>
                )}
            </div>

            <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                    <img
                        src={getAssetUrl(app.logoUrl)}
                        alt={app.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-apple-accent transition-colors">{app.name}</h3>
                    <span className="text-apple-secondary text-sm font-medium">{app.category}</span>
                </div>
            </div>

            <p className="text-apple-secondary text-sm line-clamp-2 mb-6 flex-grow leading-relaxed">
                {app.shortDescription}
            </p>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-white font-semibold text-sm">v{app.version}</span>
                    <span className="text-apple-secondary text-[11px] uppercase tracking-wider">{app.fileSize}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="w-10 h-10 rounded-full bg-apple-accent flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                    >
                        <Download className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default AppCard;
