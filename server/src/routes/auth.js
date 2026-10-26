import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()
const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET || 'civicfix-dev-secret', { expiresIn: '7d' })

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email, and a password of 6+ characters are required' })
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists' })
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) })
    res.status(201).json({ token: signToken(user.id), user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) { next(error) }
})

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() })
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Incorrect email or password' })
    res.json({ token: signToken(user.id), user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) { next(error) }
})

export default router
