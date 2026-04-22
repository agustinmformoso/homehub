import { Router, Response } from 'express'
import MonthlyAlert from '../models/MonthlyAlert'
import AlertStatus from '../models/AlertStatus'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(verifyToken)

// Asegura que existan registros de AlertStatus para el mes/año del usuario
async function ensureStatusForMonth(userId: string, month: number, year: number) {
  const alerts = await MonthlyAlert.find({ user_id: userId, is_active: true })

  await Promise.all(
    alerts.map((alert) =>
      AlertStatus.findOneAndUpdate(
        { alert_id: alert._id, month, year },
        { $setOnInsert: { alert_id: alert._id, user_id: userId, month, year, paid_at: null } },
        { upsert: true, new: true }
      )
    )
  )
}

// Configuración de alertas del usuario
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const alerts = await MonthlyAlert.find({ user_id: req.userId })
    .populate('category_id', 'name')
    .sort({ created_at: 1 })

  res.json(alerts)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, category_id, scope } = req.body

  if (!name?.trim()) {
    res.status(400).json({ message: 'Nombre requerido' })
    return
  }

  const alert = await (await MonthlyAlert.create({
    user_id: req.userId,
    name: name.trim(),
    category_id: category_id ?? null,
    scope: scope ?? 'personal',
  })).populate('category_id', 'name')

  res.status(201).json(alert)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const alert = await MonthlyAlert.findOne({ _id: req.params.id, user_id: req.userId })

  if (!alert) {
    res.status(404).json({ message: 'Alerta no encontrada' })
    return
  }

  const { name, category_id, is_active, scope } = req.body

  if (name !== undefined) alert.name = name.trim()
  if (category_id !== undefined) alert.category_id = category_id
  if (is_active !== undefined) alert.is_active = is_active
  if (scope !== undefined) alert.scope = scope

  await alert.save()
  res.json(alert)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const alert = await MonthlyAlert.findOne({ _id: req.params.id, user_id: req.userId })

  if (!alert) {
    res.status(404).json({ message: 'Alerta no encontrada' })
    return
  }

  await alert.deleteOne()
  await AlertStatus.deleteMany({ alert_id: req.params.id })
  res.json({ message: 'Alerta eliminada' })
})

// Estado de alertas para un mes/año, filtrado opcionalmente por scope
router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const month = Number(req.query.month) || new Date().getMonth() + 1
  const year = Number(req.query.year) || new Date().getFullYear()
  const scope = req.query.scope as string | undefined

  await ensureStatusForMonth(req.userId!, month, year)

  const statuses = await AlertStatus.find({ user_id: req.userId, month, year })
    .populate({
      path: 'alert_id',
      populate: { path: 'category_id', select: 'name' },
    })
    .sort({ created_at: 1 })

  // Filtrar por scope si se especifica
  const filtered = scope
    ? statuses.filter((s) => (s.alert_id as any)?.scope === scope)
    : statuses

  res.json(filtered)
})

router.post('/status/:alertId/pay', async (req: AuthRequest, res: Response): Promise<void> => {
  const month = Number(req.query.month) || new Date().getMonth() + 1
  const year = Number(req.query.year) || new Date().getFullYear()

  const status = await AlertStatus.findOneAndUpdate(
    { alert_id: req.params.alertId, user_id: req.userId, month, year },
    { paid_at: new Date() },
    { new: true }
  )

  if (!status) {
    res.status(404).json({ message: 'Estado no encontrado' })
    return
  }

  res.json(status)
})

router.post('/status/:alertId/unpay', async (req: AuthRequest, res: Response): Promise<void> => {
  const month = Number(req.query.month) || new Date().getMonth() + 1
  const year = Number(req.query.year) || new Date().getFullYear()

  const status = await AlertStatus.findOneAndUpdate(
    { alert_id: req.params.alertId, user_id: req.userId, month, year },
    { paid_at: null },
    { new: true }
  )

  if (!status) {
    res.status(404).json({ message: 'Estado no encontrado' })
    return
  }

  res.json(status)
})

export default router
