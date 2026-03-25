import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL: JWT_SECRET environment variable is required in production!');
    }
    console.warn('WARNING: JWT_SECRET is not defined. Using insecure default secret.');
}
const ACTUAL_SECRET = SECRET_KEY || 'insecure-default-secret-key-12345';

export const generateToken = (payload: object) => {
    return jwt.sign(payload, ACTUAL_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, ACTUAL_SECRET);
    } catch (error) {
        return null;
    }
};
