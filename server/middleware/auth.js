import jwt from 'jsonwebtoken';

const extractToken = (req) => {
    return req.header('Authorization')?.replace('Bearer ', '');
};

export const authAdmin = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso restrito a administradores' });
        }
        
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

export const authUser = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

export const authOptional = (req, res, next) => {
    const token = extractToken(req);

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token inválido, continua sem usuário
        }
    }
    next();
};

const auth = authAdmin;
export default auth;
