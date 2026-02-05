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
const dbPath = path.join(__dirname, '../data/docs.json');
const storagePath = path.join(__dirname, '../docs');

// Ensure directories exist
['markdown', 'pdfs'].forEach(dir => {
    const p = path.join(storagePath, dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ docs: [] }));
}

// Multer storage for PDFs or MD files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.type || 'markdown';
        cb(null, path.join('docs', type === 'pdf' ? 'pdfs' : 'markdown'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB for docs
});

const getDocs = () => {
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data).docs;
};

const saveDocs = (docs) => {
    fs.writeFileSync(dbPath, JSON.stringify({ docs }, null, 2));
};

const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

// GET all docs (metadata only for list)
router.get('/', (req, res) => {
    try {
        const docs = getDocs();
        res.json(docs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching docs' });
    }
});

// GET single doc (includes content if markdown)
router.get('/:id', (req, res) => {
    try {
        const docs = getDocs();
        const doc = docs.find(d => d.id === req.params.id);
        if (!doc) return res.status(404).json({ message: 'Doc not found' });

        if (doc.type === 'markdown' && doc.fileUrl) {
            const fullPath = path.join(__dirname, '..', doc.fileUrl);
            if (fs.existsSync(fullPath)) {
                doc.content = fs.readFileSync(fullPath, 'utf8');
            }
        }
        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doc' });
    }
});

// POST new doc
router.post('/', auth, upload.single('file'), (req, res) => {
    try {
        const { title, category, description, type, content } = req.body;
        const docs = getDocs();
        const id = uuidv4();
        let fileUrl = null;

        if (type === 'pdf' && req.file) {
            fileUrl = `/docs/pdfs/${req.file.filename}`;
        } else if (type === 'markdown') {
            const fileName = `${id}.md`;
            const filePath = path.join(storagePath, 'markdown', fileName);
            fs.writeFileSync(filePath, content || '');
            fileUrl = `/docs/markdown/${fileName}`;
        }

        const newDoc = {
            id,
            title,
            category,
            description,
            type,
            fileUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        docs.push(newDoc);
        saveDocs(docs);
        res.status(201).json(newDoc);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating doc' });
    }
});

// PUT update doc
router.put('/:id', auth, upload.single('file'), (req, res) => {
    try {
        const docs = getDocs();
        const index = docs.findIndex(d => d.id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Doc not found' });

        const { title, category, description, content } = req.body;
        const doc = docs[index];

        if (doc.type === 'markdown' && content !== undefined) {
            const fullPath = path.join(__dirname, '..', doc.fileUrl);
            fs.writeFileSync(fullPath, content);
        }

        if (doc.type === 'pdf' && req.file) {
            deleteFile(doc.fileUrl);
            doc.fileUrl = `/docs/pdfs/${req.file.filename}`;
        }

        docs[index] = {
            ...doc,
            title: title || doc.title,
            category: category || doc.category,
            description: description || doc.description,
            updatedAt: new Date().toISOString()
        };

        saveDocs(docs);
        res.json(docs[index]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating doc' });
    }
});

// DELETE doc
router.delete('/:id', auth, (req, res) => {
    try {
        const docs = getDocs();
        const doc = docs.find(d => d.id === req.params.id);
        if (!doc) return res.status(404).json({ message: 'Doc not found' });

        deleteFile(doc.fileUrl);
        const filteredDocs = docs.filter(d => d.id !== req.params.id);
        saveDocs(filteredDocs);
        res.json({ message: 'Doc deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting doc' });
    }
});

export default router;
