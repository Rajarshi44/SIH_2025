import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sohojpaat-secret-key-2025";
const DEVICE_TOKEN = process.env.DEVICE_TOKEN || "esp32-device-token-xyz";

export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export function generateToken(userId: string, username: string): string {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: "7d" } // 7 days
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    return null;
  }
}

export function verifyDeviceToken(token: string): boolean {
  return token === DEVICE_TOKEN;
}

export function hashPassword(password: string): string {
  // In production, use bcrypt
  // For now, simple implementation
  return Buffer.from(password).toString("base64");
}

export function comparePassword(
  password: string,
  hashedPassword: string
): boolean {
  return hashPassword(password) === hashedPassword;
}

// Demo users
export const DEMO_USERS = [
  {
    userId: "user_1",
    username: "admin",
    password: hashPassword("admin123"),
  },
  {
    userId: "user_2",
    username: "operator",
    password: hashPassword("operator123"),
  },
];

export function authenticateUser(
  username: string,
  password: string
): { userId: string; username: string } | null {
  const user = DEMO_USERS.find((u) => u.username === username);
  if (!user) return null;
  if (!comparePassword(password, user.password)) return null;
  return { userId: user.userId, username: user.username };
}
