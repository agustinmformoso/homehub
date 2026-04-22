import { Router, Response } from 'express'
import Expense from '../models/Expense'
import User from '../models/User'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(verifyToken)

function getMonthRange(month: number, year: number) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  }
}

// Dashboard compartido: totales por usuario + listado completo
router.get('/shared', async (req: AuthRequest, res: Response): Promise<void> => {
  const month = Number(req.query.month) || new Date().getMonth() + 1
  const year = Number(req.query.year) || new Date().getFullYear()
  const { start, end } = getMonthRange(month, year)

  const expenses = await Expense.find({ date: { $gte: start, $lt: end } })
    .populate('user_id', 'display_name username')
    .populate('category_id', 'name')
    .sort({ date: -1, created_at: -1 })

  const users = await User.find().select('_id display_name username')

  const byUser = users.map((user) => {
    const total = expenses
      .filter((e) => e.user_id._id?.toString() === user._id.toString())
      .reduce((sum, e) => sum + e.amount, 0)
    return { user: { _id: user._id, display_name: user.display_name, username: user.username }, total }
  })

  const combined = expenses.reduce((sum, e) => sum + e.amount, 0)

  res.json({ totals: { combined, byUser }, expenses })
})

// Dashboard personal: total + breakdown por categoría + listado propio
router.get('/personal', async (req: AuthRequest, res: Response): Promise<void> => {
  const month = Number(req.query.month) || new Date().getMonth() + 1
  const year = Number(req.query.year) || new Date().getFullYear()
  const { start, end } = getMonthRange(month, year)

  const expenses = await Expense.find({
    user_id: req.userId,
    date: { $gte: start, $lt: end },
  })
    .populate('user_id', 'display_name username')
    .populate('category_id', 'name')
    .sort({ date: -1, created_at: -1 })

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Agrupar por categoría
  const categoryMap = new Map<string, { name: string; total: number }>()

  for (const expense of expenses) {
    const cat = expense.category_id as unknown as { _id: string; name: string }
    const key = cat._id.toString()
    if (!categoryMap.has(key)) {
      categoryMap.set(key, { name: cat.name, total: 0 })
    }
    categoryMap.get(key)!.total += expense.amount
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([id, { name, total: catTotal }]) => ({
      category: { _id: id, name },
      total: catTotal,
      percentage: total > 0 ? Math.round((catTotal / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  res.json({ total, byCategory, expenses })
})

export default router
