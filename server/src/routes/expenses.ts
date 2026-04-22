import { Router, Response } from 'express'
import Expense from '../models/Expense'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(verifyToken)

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { month, year, user_id, category_id, type, search } = req.query

  const filter: Record<string, unknown> = {}

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1)
    const end = new Date(Number(year), Number(month), 1)
    filter.date = { $gte: start, $lt: end }
  }

  if (user_id) filter.user_id = user_id
  if (category_id) filter.category_id = category_id
  if (type) filter.type = type
  if (search) filter.description = { $regex: search, $options: 'i' }

  const expenses = await Expense.find(filter)
    .populate('user_id', 'display_name username')
    .populate('category_id', 'name')
    .sort({ date: -1, created_at: -1 })

  res.json(expenses)
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, category_id, description, date, type } = req.body

  if (!amount || !category_id || !date) {
    res.status(400).json({ message: 'Monto, categoría y fecha son requeridos' })
    return
  }

  const expense = await Expense.create({
    user_id: req.userId,
    amount,
    category_id,
    description: description ?? '',
    date: new Date(date),
    type: type ?? 'compartido',
  })

  const populated = await expense.populate([
    { path: 'user_id', select: 'display_name username' },
    { path: 'category_id', select: 'name' },
  ])

  res.status(201).json(populated)
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const expense = await Expense.findById(req.params.id)

  if (!expense) {
    res.status(404).json({ message: 'Gasto no encontrado' })
    return
  }

  if (expense.user_id.toString() !== req.userId) {
    res.status(403).json({ message: 'No autorizado' })
    return
  }

  const { amount, category_id, description, date, type } = req.body

  if (amount !== undefined) expense.amount = amount
  if (category_id !== undefined) expense.category_id = category_id
  if (description !== undefined) expense.description = description
  if (date !== undefined) expense.date = new Date(date)
  if (type !== undefined) expense.type = type

  await expense.save()

  const populated = await expense.populate([
    { path: 'user_id', select: 'display_name username' },
    { path: 'category_id', select: 'name' },
  ])

  res.json(populated)
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const expense = await Expense.findById(req.params.id)

  if (!expense) {
    res.status(404).json({ message: 'Gasto no encontrado' })
    return
  }

  if (expense.user_id.toString() !== req.userId) {
    res.status(403).json({ message: 'No autorizado' })
    return
  }

  await expense.deleteOne()
  res.json({ message: 'Gasto eliminado' })
})

export default router
