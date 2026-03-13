import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { authAdmin, authUser, authOptional } from '../middleware/auth.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const dbPath = path.join(__dirname, '../data/apps.json');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'logo') {
            cb(null, 'logos/');
        } else {
            cb(null, 'uploads/');
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

const getApps = () => {
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data).apps;
};

const saveApps = (apps) => {
    const tempPath = `${dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify({ apps }, null, 2));
    fs.renameSync(tempPath, dbPath);
};

const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

const filterAppsByDepartment = (apps, user) => {
    if (!user) return [];
    if (user.role === 'admin') return apps;
    
    return apps.filter(app => {
        if (!app.allowedDepartments || app.allowedDepartments.length === 0) {
            return true;
        }
        return app.allowedDepartments.includes(user.departmentId);
    });
};

router.get('/', authUser, (req, res) => {
    try {
        const apps = getApps();
        const filteredApps = filterAppsByDepartment(apps, req.user);
        res.json(filteredApps);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar aplicativos' });
    }
});

router.get('/all', authAdmin, (req, res) => {
    try {
        const apps = getApps();
        res.json(apps);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar aplicativos' });
    }
});

router.get('/stats/summary', authAdmin, (req, res) => {
    try {
        const apps = getApps();
        const totalDownloads = apps.reduce((sum, app) => sum + (app.downloads || 0), 0);
        const lastUpdate = apps.length > 0
            ? apps.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0].updatedAt
            : null;

        res.json({
            totalApps: apps.length,
            totalDownloads,
            lastUpdate
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
});

router.get('/:id', authUser, (req, res) => {
    try {
        const apps = getApps();
        const app = apps.find(a => a.id === req.params.id);
        if (!app) return res.status(404).json({ message: 'Aplicativo não encontrado' });
        
        const filteredApps = filterAppsByDepartment([app], req.user);
        if (filteredApps.length === 0) {
            return res.status(403).json({ message: 'Acesso não autorizado a este aplicativo' });
        }
        
        res.json(app);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar aplicativo' });
    }
});

router.post('/', authAdmin, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'installer', maxCount: 1 }]), (req, res) => {
    try {
        const { name, version, category, shortDescription, fullDescription, changelog, requirements, allowedDepartments } = req.body;
        const apps = getApps();

        let parsedDepartments = [];
        if (allowedDepartments) {
            try {
                parsedDepartments = typeof allowedDepartments === 'string' 
                    ? JSON.parse(allowedDepartments) 
                    : allowedDepartments;
            } catch {
                parsedDepartments = [];
            }
        }

        const newApp = {
            id: uuidv4(),
            name,
            version,
            category,
            shortDescription,
            fullDescription,
            changelog,
            requirements,
            logoUrl: `/logos/${req.files.logo[0].filename}`,
            downloadUrl: `/uploads/${req.files.installer[0].filename}`,
            fileSize: `${(req.files.installer[0].size / (1024 * 1024)).toFixed(1)} MB`,
            downloads: 0,
            allowedDepartments: parsedDepartments,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        apps.push(newApp);
        saveApps(apps);
        res.status(201).json(newApp);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar aplicativo' });
    }
});

router.put('/:id', authAdmin, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'installer', maxCount: 1 }]), (req, res) => {
    try {
        const apps = getApps();
        const index = apps.findIndex(a => a.id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Aplicativo não encontrado' });

        const updatedData = { ...req.body };

        if (updatedData.allowedDepartments) {
            try {
                updatedData.allowedDepartments = typeof updatedData.allowedDepartments === 'string'
                    ? JSON.parse(updatedData.allowedDepartments)
                    : updatedData.allowedDepartments;
            } catch {
                updatedData.allowedDepartments = apps[index].allowedDepartments || [];
            }
        }

        if (req.files?.logo) {
            deleteFile(apps[index].logoUrl);
            updatedData.logoUrl = `/logos/${req.files.logo[0].filename}`;
        }
        if (req.files?.installer) {
            deleteFile(apps[index].downloadUrl);
            updatedData.downloadUrl = `/uploads/${req.files.installer[0].filename}`;
            updatedData.fileSize = `${(req.files.installer[0].size / (1024 * 1024)).toFixed(1)} MB`;
        }

        apps[index] = {
            ...apps[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };

        saveApps(apps);
        res.json(apps[index]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar aplicativo' });
    }
});

router.delete('/:id', authAdmin, (req, res) => {
    try {
        const apps = getApps();
        const app = apps.find(a => a.id === req.params.id);
        if (!app) return res.status(404).json({ message: 'Aplicativo não encontrado' });

        deleteFile(app.logoUrl);
        deleteFile(app.downloadUrl);

        const filteredApps = apps.filter(a => a.id !== req.params.id);
        saveApps(filteredApps);
        res.json({ message: 'Aplicativo excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir aplicativo' });
    }
});

router.post('/:id/download', authUser, (req, res) => {
    try {
        const apps = getApps();
        const index = apps.findIndex(a => a.id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Aplicativo não encontrado' });

        const filteredApps = filterAppsByDepartment([apps[index]], req.user);
        if (filteredApps.length === 0) {
            return res.status(403).json({ message: 'Acesso não autorizado a este aplicativo' });
        }

        apps[index].downloads = (apps[index].downloads || 0) + 1;
        saveApps(apps);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registrar download' });
    }
});

export default router;
