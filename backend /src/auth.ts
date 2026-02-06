import { sign, verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

export interface JwtPayload {
    userId: string;
    username: string;
}

/**
 * Hash a password using Bun's built-in password hashing
 */
export async function hashPassword(password: string): Promise<string> {
    return await Bun.password.hash(password, {
        algorithm: "bcrypt",
        cost: 10,
    });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return await Bun.password.verify(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JwtPayload): string {
    return sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
    try {
        return verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.slice(7);
}
