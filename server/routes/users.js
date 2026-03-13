import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const dbPath = path.join(__dirname, '../data/users.json');

const getUsers = () => {
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data).users;
};

const saveUsers = (users) => {
    const tempPath = `${dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify({ users }, null, 2));
    fs.renameSync(tempPath, dbPath);
};

const sanitizeUser = (user) => {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};

router.get('/', authAdmin, (req, res) => {
    try {
        const users = getUsers();
        res.json(users.map(sanitizeUser));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
});

router.get('/:id', authAdmin, (req, res) => {
    try {
        const users = getUsers();
        const user = users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(sanitizeUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuário' });
    }
});

router.post('/', authAdmin, async (req, res) => {
    try {
        const { name, email, password, departmentId, active } = req.body;

        if (!name?.trim() || !email?.trim() || !password || !departmentId) {
            return res.status(400).json({ 
                message: 'Nome, email, senha e departamento são obrigatórios' 
            });
        }

        const users = getUsers();
        const emailLower = email.trim().toLowerCase();
        
        const exists = users.some(u => u.email.toLowerCase() === emailLower);
        if (exists) {
            return res.status(400).json({ message: 'Já existe um usuário com este email' });
        }

        const deptPath = path.join(__dirname, '../data/departments.json');
        const deptData = JSON.parse(fs.readFileSync(deptPath));
        const deptExists = deptData.departments.some(d => d.id === departmentId);
        if (!deptExists) {
            return res.status(400).json({ message: 'Departamento não encontrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = {
            id: uuidv4(),
            name: name.trim(),
            email: emailLower,
            passwordHash,
            departmentId,
            role: 'user',
            active: active !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);
        res.status(201).json(sanitizeUser(newUser));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar usuário' });
    }
});

router.put('/:id', authAdmin, async (req, res) => {
    try {
        const { name, email, password, departmentId, active } = req.body;
        const users = getUsers();
        const index = users.findIndex(u => u.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        if (email) {
            const emailLower = email.trim().toLowerCase();
            const exists = users.some(
                u => u.id !== req.params.id && u.email.toLowerCase() === emailLower
            );
            if (exists) {
                return res.status(400).json({ message: 'Já existe um usuário com este email' });
            }
        }

        if (departmentId) {
            const deptPath = path.join(__dirname, '../data/departments.json');
            const deptData = JSON.parse(fs.readFileSync(deptPath));
            const deptExists = deptData.departments.some(d => d.id === departmentId);
            if (!deptExists) {
                return res.status(400).json({ message: 'Departamento não encontrado' });
            }
        }

        const updatedUser = {
            ...users[index],
            name: name?.trim() || users[index].name,
            email: email?.trim().toLowerCase() || users[index].email,
            departmentId: departmentId || users[index].departmentId,
            active: active !== undefined ? active : users[index].active,
            updatedAt: new Date().toISOString()
        };

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updatedUser.passwordHash = await bcrypt.hash(password, salt);
        }

        users[index] = updatedUser;
        saveUsers(users);
        res.json(sanitizeUser(updatedUser));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
});

router.delete('/:id', authAdmin, (req, res) => {
    try {
        const users = getUsers();
        const index = users.findIndex(u => u.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        users.splice(index, 1);
        saveUsers(users);
        res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir usuário' });
    }
});

export default router;
