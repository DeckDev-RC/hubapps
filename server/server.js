import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import appRoutes from './routes/apps.js';
import authRoutes from './routes/auth.js';
import docRoutes from './routes/docs.js';
import userRoutes from './routes/users.js';
import departmentRoutes from './routes/departments.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure directories exist
const dirs = ['uploads', 'logos', 'data', 'docs/markdown', 'docs/pdfs'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
});

// Initialize JSON data files if not exists
const dataFiles = [
  { file: 'apps.json', initial: { apps: [] } },
  { file: 'users.json', initial: { users: [] } },
  { file: 'departments.json', initial: { departments: [] } }
];

dataFiles.forEach(({ file, initial }) => {
  const filePath = path.join(__dirname, 'data', file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2));
    console.log(`Initialized ${file}`);
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/logos', express.static(path.join(__dirname, 'logos')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// API Routes
app.use('/api/apps', appRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Hub Apps API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
