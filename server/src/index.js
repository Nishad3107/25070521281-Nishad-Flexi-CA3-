import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import reportRoutes from './routes/reports.js'

const app = express()
const port = process.env.PORT || 5051

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static('uploads'))
app.get('/api/health', (_req, res) => res.json({ success: true, service: 'CivicFix API', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
app.use('/api/auth', authRoutes)
app.use('/api/reports', reportRoutes)
app.use((error, _req, res, _next) => res.status(error.status || 500).json({ message: error.message || 'Unexpected server error' }))

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicfix')
  .then(() => app.listen(port, () => console.log(`CivicFix API running on http://localhost:${port}`)))
  .catch(error => { console.error('MongoDB connection failed:', error.message); console.error('Start MongoDB Compass/local MongoDB and restart the server.'); process.exit(1) })
