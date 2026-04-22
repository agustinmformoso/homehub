import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.token

  if (!token) {
    res.status(401).json({ message: 'No autenticado' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}
