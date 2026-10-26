import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ message: 'Authentication required' })
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'civicfix-dev-secret')
    req.user = await User.findById(payload.id).select('-password')
    if (!req.user) return res.status(401).json({ message: 'User no longer exists' })
    next()
  } catch { res.status(401).json({ message: 'Invalid or expired session' }) }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' })
  next()
}
