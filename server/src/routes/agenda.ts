import { Router, Response } from 'express'
import AgendaEntry from '../models/AgendaEntry'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(verifyToken)

// GET /api/agenda — entradas del usuario, ordenadas por fecha y hora
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const entries = await AgendaEntry.find({ user_id: req.userId }).sort({ date: 1, time: 1 })
  res.json(entries)
})

// POST /api/agenda — crear entrada
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { date, time, title } = req.body

  if (!date || !time || !title?.trim()) {
    res.status(400).json({ message: 'Fecha, hora y descripción son requeridas' })
    return
  }

  const entry = await AgendaEntry.create({
    user_id: req.userId,
    date,
    time,
    title: title.trim(),
  })

  res.status(201).json(entry)
})

// DELETE /api/agenda/:id — eliminar entrada propia
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const entry = await AgendaEntry.findById(req.params.id)

  if (!entry) {
    res.status(404).json({ message: 'Entrada no encontrada' })
    return
  }

  if (entry.user_id.toString() !== req.userId) {
    res.status(403).json({ message: 'No autorizado' })
    return
  }

  await entry.deleteOne()
  res.json({ message: 'Entrada eliminada' })
})

export default router
