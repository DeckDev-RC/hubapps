import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AppGrid = ({ children }) => {
    return (
        <div className="container mx-auto px-6">
            <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {children}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AppGrid;
