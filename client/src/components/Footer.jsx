import React from 'react';

const Footer = () => {
    return (
        <footer className="border-t border-white/10 py-12 mt-20">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-xl font-bold mb-4">Hub de Aplicativos</h3>
                        <p className="text-apple-secondary max-w-xs leading-relaxed">
                            Distribuição oficial de softwares corporativos. Segurança, agilidade e performance para sua empresa.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Recursos</h4>
                        <ul className="space-y-2 text-apple-secondary text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Status do Servidor</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Suporte</h4>
                        <ul className="space-y-2 text-apple-secondary text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Contatar TI</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Manuais</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-white/5 text-center text-apple-secondary text-xs">
                    © 2026 Empresa Corp. Todos os direitos reservados. Design estilo Apple.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
