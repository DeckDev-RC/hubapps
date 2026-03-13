import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authUser } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const getUsers = () => {
    const dbPath = path.join(__dirname, '../data/users.json');
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data).users;
};

const getDepartments = () => {
    const dbPath = path.join(__dirname, '../data/departments.json');
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data).departments;
};

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const sanitizedEmail = email?.trim().toLowerCase();

    if (!sanitizedEmail || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    try {
        if (sanitizedEmail === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
            const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
            if (!isMatch) {
                return res.status(400).json({ message: 'Credenciais inválidas' });
            }

            const token = jwt.sign(
                { email: sanitizedEmail, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            return res.json({
                token,
                user: {
                    email: sanitizedEmail,
                    name: 'Administrador',
                    role: 'admin'
                }
            });
        }

        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === sanitizedEmail);

        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        if (!user.active) {
            return res.status(400).json({ message: 'Usuário inativo. Contate o administrador.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        const departments = getDepartments();
        const department = departments.find(d => d.id === user.departmentId);

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: 'user',
                departmentId: user.departmentId
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: 'user',
                departmentId: user.departmentId,
                departmentName: department?.name || 'Sem departamento'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

router.get('/me', authUser, (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return res.json({
                email: req.user.email,
                name: 'Administrador',
                role: 'admin'
            });
        }

        const users = getUsers();
        const user = users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const departments = getDepartments();
        const department = departments.find(d => d.id === user.departmentId);

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'user',
            departmentId: user.departmentId,
            departmentName: department?.name || 'Sem departamento'
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

export default router;
