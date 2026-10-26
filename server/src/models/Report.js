import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  author: { type: String, default: 'City operations' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, required: true, enum: ['Roads & pavements', 'Waste management', 'Street lighting', 'Water & drainage', 'Public spaces', 'Other'] },
  location: { type: String, required: true, trim: true, maxlength: 180 },
  imageUrl: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [commentSchema]
}, { timestamps: true })

reportSchema.index({ title: 'text', description: 'text', location: 'text' })
export default mongoose.model('Report', reportSchema)
