import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const sanitizedEmail = email?.trim().toLowerCase();

    try {
        if (sanitizedEmail !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ email: sanitizedEmail }, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/me', (req, res) => {
    res.json({ message: 'Token valid' });
});

export default router;
