import { Router } from 'express'
import Report from '../models/Report.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, category, location, search } = req.query
    const query = req.user.role === 'admin' ? {} : { user: req.user._id }
    if (status && status !== 'All statuses') query.status = status
    if (category && category !== 'All categories') query.category = category
    if (location) query.location = new RegExp(location, 'i')
    if (search) query.$text = { $search: search }
    const reports = await Report.find(query).populate('user', 'name email').sort({ createdAt: -1 })
    res.json({ reports })
  } catch (error) { next(error) }
})

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id }
    const [total, pending, active, resolved] = await Promise.all(['', 'Pending', 'In Progress', 'Resolved'].map(status => Report.countDocuments(status ? { ...query, status } : query)))
    res.json({ stats: { total, pending, active, resolved } })
  } catch (error) { next(error) }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { title, description, category, location, imageUrl } = req.body
    if (!title || !description || !category || !location) return res.status(400).json({ message: 'Title, description, category, and location are required' })
    const report = await Report.create({ title, description, category, location, imageUrl, user: req.user._id })
    res.status(201).json({ report })
  } catch (error) { next(error) }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found' })
    if (req.user.role !== 'admin' && report.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'You can only update your own reports' })
    if (req.body.status && req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can change report status' })
    if (req.body.comment) report.comments.push({ text: req.body.comment, author: req.user.name })
    if (req.body.status) report.status = req.body.status
    if (req.user.role === 'admin' && req.body.resolutionNote) report.comments.push({ text: req.body.resolutionNote, author: req.user.name })
    await report.save()
    res.json({ report })
  } catch (error) { next(error) }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const report = await Report.findOneAndDelete(req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id })
    if (!report) return res.status(404).json({ message: 'Report not found' })
    res.json({ message: 'Report deleted' })
  } catch (error) { next(error) }
})

router.post('/:id/comments', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!req.body.text?.trim()) return res.status(400).json({ message: 'Comment text is required' })
    const report = await Report.findByIdAndUpdate(req.params.id, { $push: { comments: { text: req.body.text, author: req.user.name } } }, { new: true })
    if (!report) return res.status(404).json({ message: 'Report not found' })
    res.status(201).json({ report })
  } catch (error) { next(error) }
})

export default router
