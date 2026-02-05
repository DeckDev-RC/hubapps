import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import auth from '../middleware/auth.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const dbPath = path.join(__dirname, '../data/apps.json');

// Multer storage
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
        fileSize: 500 * 1024 * 1024 // 500MB limit
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

// GET all apps
router.get('/', (req, res) => {
    try {
        const apps = getApps();
        res.json(apps);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching apps' });
    }
});

// GET single app
router.get('/:id', (req, res) => {
    try {
        const apps = getApps();
        const app = apps.find(a => a.id === req.params.id);
        if (!app) return res.status(404).json({ message: 'App not found' });
        res.json(app);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching app' });
    }
});

// POST new app
router.post('/', auth, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'installer', maxCount: 1 }]), (req, res) => {
    try {
        const { name, version, category, shortDescription, fullDescription, changelog, requirements } = req.body;
        const apps = getApps();

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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        apps.push(newApp);
        saveApps(apps);
        res.status(201).json(newApp);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating app' });
    }
});

// PUT update app
router.put('/:id', auth, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'installer', maxCount: 1 }]), (req, res) => {
    try {
        const apps = getApps();
        const index = apps.findIndex(a => a.id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'App not found' });

        const updatedData = { ...req.body };

        // If files are uploaded, update URLs
        if (req.files.logo) {
            deleteFile(apps[index].logoUrl);
            updatedData.logoUrl = `/logos/${req.files.logo[0].filename}`;
        }
        if (req.files.installer) {
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
        res.status(500).json({ message: 'Error updating app' });
    }
});

// DELETE app
router.delete('/:id', auth, (req, res) => {
    try {
        const apps = getApps();
        const app = apps.find(a => a.id === req.params.id);
        if (!app) return res.status(404).json({ message: 'App not found' });

        // Delete files from disk
        deleteFile(app.logoUrl);
        deleteFile(app.downloadUrl);

        const filteredApps = apps.filter(a => a.id !== req.params.id);
        saveApps(filteredApps);
        res.json({ message: 'App deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting app' });
    }
});

// GET stats
router.get('/stats/summary', auth, (req, res) => {
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
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// Increment download count
router.post('/:id/download', (req, res) => {
    try {
        const apps = getApps();
        const index = apps.findIndex(a => a.id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'App not found' });

        apps[index].downloads = (apps[index].downloads || 0) + 1;
        saveApps(apps);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error updating download count' });
    }
});

export default router;
