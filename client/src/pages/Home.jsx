import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import AppGrid from '../components/AppGrid';
import AppCard from '../components/AppCard';
import Modal from '../components/Modal';
import api from '../services/api';
import { motion } from 'framer-motion';

const Home = () => {
    const [apps, setApps] = useState([]);
    const [filteredApps, setFilteredApps] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);

    useEffect(() => {
        fetchApps();
    }, []);

    useEffect(() => {
        const filtered = apps.filter(app =>
            app.name.toLowerCase().includes(search.toLowerCase()) ||
            app.category.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredApps(filtered);
    }, [search, apps]);

    const fetchApps = async () => {
        try {
            const response = await api.get('/apps');
            setApps(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching apps', error);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="pt-32 pb-20 px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                            Softwares que moldam o <br className="hidden md:block" /> futuro do seu trabalho.
                        </h1>
                        <p className="text-xl text-apple-secondary max-w-2xl mx-auto mb-12">
                            Explore nosso hub oficial de ferramentas corporativas. Desenvolvidas para máxima performance no seu Windows.
                        </p>
                    </motion.div>
                </section>

                <SearchBar value={search} onChange={setSearch} />

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-apple-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {filteredApps.length > 0 ? (
                            <AppGrid>
                                {filteredApps.map(app => (
                                    <AppCard
                                        key={app.id}
                                        app={app}
                                        onClick={() => setSelectedApp(app)}
                                    />
                                ))}
                            </AppGrid>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-xl text-apple-secondary">Nenhum aplicativo encontrado para "{search}"</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />

            <Modal app={selectedApp} onClose={() => setSelectedApp(null)} />
        </div>
    );
};

export default Home;
