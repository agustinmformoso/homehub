import { Schema, model, Document, Types } from 'mongoose'

export interface IExpense extends Document {
  user_id: Types.ObjectId
  amount: number
  category_id: Types.ObjectId
  description: string
  date: Date
  type: 'compartido' | 'personal'
  created_at: Date
}

const expenseSchema = new Schema<IExpense>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, default: '', trim: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['compartido', 'personal'], default: 'compartido' },
  created_at: { type: Date, default: Date.now },
})

expenseSchema.index({ user_id: 1, date: -1 })

export default model<IExpense>('Expense', expenseSchema)
