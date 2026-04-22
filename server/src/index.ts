import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import mongoose from 'mongoose'

import authRoutes from './routes/auth'
import expenseRoutes from './routes/expenses'
import categoryRoutes from './routes/categories'
import dashboardRoutes from './routes/dashboard'
import alertRoutes from './routes/alerts'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: (origin, callback) => {
    // En dev aceptamos cualquier origen (localhost o IP local de red)
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }
    const allowed = process.env.CLIENT_URL || 'http://localhost:5173'
    callback(origin && origin !== allowed ? new Error('CORS no permitido') : null, true)
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/alerts', alertRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('MongoDB conectado')
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`))
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err)
    process.exit(1)
  })
