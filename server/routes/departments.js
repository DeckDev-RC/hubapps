import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const dbPath = path.join(__dirname, '../data/departments.json');

const getDepartments = () => {
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data).departments;
};

const saveDepartments = (departments) => {
    const tempPath = `${dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify({ departments }, null, 2));
    fs.renameSync(tempPath, dbPath);
};

router.get('/', authAdmin, (req, res) => {
    try {
        const departments = getDepartments();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar departamentos' });
    }
});

router.get('/:id', authAdmin, (req, res) => {
    try {
        const departments = getDepartments();
        const department = departments.find(d => d.id === req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Departamento não encontrado' });
        }
        res.json(department);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar departamento' });
    }
});

router.post('/', authAdmin, (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Nome do departamento é obrigatório' });
        }

        const departments = getDepartments();
        
        const exists = departments.some(d => d.name.toLowerCase() === name.trim().toLowerCase());
        if (exists) {
            return res.status(400).json({ message: 'Já existe um departamento com este nome' });
        }

        const newDepartment = {
            id: uuidv4(),
            name: name.trim(),
            description: description?.trim() || '',
            createdAt: new Date().toISOString()
        };

        departments.push(newDepartment);
        saveDepartments(departments);
        res.status(201).json(newDepartment);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar departamento' });
    }
});

router.put('/:id', authAdmin, (req, res) => {
    try {
        const { name, description } = req.body;
        const departments = getDepartments();
        const index = departments.findIndex(d => d.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ message: 'Departamento não encontrado' });
        }

        if (name) {
            const exists = departments.some(
                d => d.id !== req.params.id && d.name.toLowerCase() === name.trim().toLowerCase()
            );
            if (exists) {
                return res.status(400).json({ message: 'Já existe um departamento com este nome' });
            }
        }

        departments[index] = {
            ...departments[index],
            name: name?.trim() || departments[index].name,
            description: description !== undefined ? description.trim() : departments[index].description
        };

        saveDepartments(departments);
        res.json(departments[index]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar departamento' });
    }
});

router.delete('/:id', authAdmin, (req, res) => {
    try {
        const departments = getDepartments();
        const index = departments.findIndex(d => d.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ message: 'Departamento não encontrado' });
        }

        const usersPath = path.join(__dirname, '../data/users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath));
        const hasUsers = usersData.users.some(u => u.departmentId === req.params.id);
        
        if (hasUsers) {
            return res.status(400).json({ 
                message: 'Não é possível excluir departamento com usuários vinculados' 
            });
        }

        departments.splice(index, 1);
        saveDepartments(departments);
        res.json({ message: 'Departamento excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir departamento' });
    }
});

export default router;
