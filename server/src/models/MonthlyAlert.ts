import { Schema, model, Document, Types } from 'mongoose'

export interface IMonthlyAlert extends Document {
  user_id: Types.ObjectId
  name: string
  category_id: Types.ObjectId | null
  is_active: boolean
  scope: 'compartido' | 'personal'
  created_at: Date
}

const monthlyAlertSchema = new Schema<IMonthlyAlert>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  category_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  is_active: { type: Boolean, default: true },
  scope: { type: String, enum: ['compartido', 'personal'], default: 'personal' },
  created_at: { type: Date, default: Date.now },
})

export default model<IMonthlyAlert>('MonthlyAlert', monthlyAlertSchema)
