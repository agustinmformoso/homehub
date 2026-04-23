import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()

const isProd = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  secure: isProd,
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ message: 'Usuario y contraseña requeridos' })
    return
  }

  const user = await User.findOne({ username: username.toLowerCase() })

  if (!user) {
    res.status(401).json({ message: 'Credenciales inválidas' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)

  if (!valid) {
    res.status(401).json({ message: 'Credenciales inválidas' })
    return
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  })

  res.cookie('token', token, COOKIE_OPTIONS)
  res.json({ _id: user._id, username: user.username, display_name: user.display_name })
})

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token')
  res.json({ message: 'Sesión cerrada' })
})

router.get('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.userId).select('-password_hash')

  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' })
    return
  }

  res.json(user)
})

export default router
