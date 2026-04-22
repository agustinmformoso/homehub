import { Router, Response } from 'express'
import Category from '../models/Category'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(verifyToken)

// Devuelve predefinidas + custom del usuario logueado
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const categories = await Category.find({
    $or: [{ type: 'predefined' }, { created_by: req.userId }],
  }).sort({ type: -1, name: 1 })

  res.json(categories)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body

  if (!name?.trim()) {
    res.status(400).json({ message: 'Nombre requerido' })
    return
  }

  const category = await Category.create({
    name: name.trim(),
    type: 'custom',
    created_by: req.userId,
  })

  res.status(201).json(category)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const category = await Category.findById(req.params.id)

  if (!category) {
    res.status(404).json({ message: 'Categoría no encontrada' })
    return
  }

  if (category.type === 'predefined') {
    res.status(403).json({ message: 'No se pueden eliminar categorías predefinidas' })
    return
  }

  if (category.created_by?.toString() !== req.userId) {
    res.status(403).json({ message: 'No autorizado' })
    return
  }

  await category.deleteOne()
  res.json({ message: 'Categoría eliminada' })
})

export default router
