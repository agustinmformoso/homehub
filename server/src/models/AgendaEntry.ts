import { Schema, model, Types } from 'mongoose'

interface IAgendaEntry {
  user_id: Types.ObjectId
  date: string  // YYYY-MM-DD
  time: string  // HH:MM
  title: string
  createdAt: Date
}

const AgendaEntrySchema = new Schema<IAgendaEntry>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date:    { type: String, required: true },
    time:    { type: String, required: true },
    title:   { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export default model<IAgendaEntry>('AgendaEntry', AgendaEntrySchema)
