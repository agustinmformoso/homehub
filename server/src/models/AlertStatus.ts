import { Schema, model, Document, Types } from 'mongoose'

export interface IAlertStatus extends Document {
  alert_id: Types.ObjectId
  user_id: Types.ObjectId
  month: number
  year: number
  paid_at: Date | null
  created_at: Date
}

const alertStatusSchema = new Schema<IAlertStatus>({
  alert_id: { type: Schema.Types.ObjectId, ref: 'MonthlyAlert', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  paid_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
})

// un registro por alerta/mes/año
alertStatusSchema.index({ alert_id: 1, month: 1, year: 1 }, { unique: true })

export default model<IAlertStatus>('AlertStatus', alertStatusSchema)
