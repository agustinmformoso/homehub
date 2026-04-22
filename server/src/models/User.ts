import { Schema, model, Document } from 'mongoose'

export interface IUser extends Document {
  username: string
  password_hash: string
  display_name: string
  created_at: Date
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  display_name: { type: String, required: true, trim: true },
  created_at: { type: Date, default: Date.now },
})

export default model<IUser>('User', userSchema)
