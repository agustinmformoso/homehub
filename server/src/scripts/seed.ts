import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User'
import Category from '../models/Category'

const PREDEFINED_CATEGORIES = [
  'Expensas / Alquiler',
  'Servicios (luz, gas, agua)',
  'Internet / Telefonía',
  'Supermercado',
  'Streaming',
  'Transporte',
  'Salud',
  'Educación',
  'Restaurantes / Salidas',
  'Ropa',
  'Otros',
]

// Editá estos valores antes de correr el seed
const USERS = [
  { username: 'agustin', password: 'agus@123', display_name: 'Agustín' },
  { username: 'clara',  password: 'claris@123', display_name: 'Claris' },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI as string)
  console.log('MongoDB conectado')

  // Categorías predefinidas
  for (const name of PREDEFINED_CATEGORIES) {
    await Category.findOneAndUpdate(
      { name, type: 'predefined' },
      { name, type: 'predefined', created_by: null },
      { upsert: true }
    )
  }
  console.log(`${PREDEFINED_CATEGORIES.length} categorías predefinidas listas`)

  // Usuarios
  for (const { username, password, display_name } of USERS) {
    const exists = await User.findOne({ username })
    if (exists) {
      console.log(`Usuario "${username}" ya existe, saltando`)
      continue
    }
    const password_hash = await bcrypt.hash(password, 12)
    await User.create({ username, password_hash, display_name })
    console.log(`Usuario "${username}" creado`)
  }

  await mongoose.disconnect()
  console.log('Seed completado')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
