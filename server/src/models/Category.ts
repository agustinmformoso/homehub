import { Schema, model, Document, Types } from 'mongoose'

export interface ICategory extends Document {
  name: string
  type: 'predefined' | 'custom'
  created_by: Types.ObjectId | null
  created_at: Date
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['predefined', 'custom'], required: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  created_at: { type: Date, default: Date.now },
})

export default model<ICategory>('Category', categorySchema)
