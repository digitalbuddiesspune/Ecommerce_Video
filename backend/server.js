import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import { LOCAL_PUBLIC_DIR } from './config/storage.js'
import apiRoutes from './routes/index.js'
import errorHandler from './middleware/errorHandler.js'
import seedCatalogIfEmpty from './seed/seedCatalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      const isLocalDev =
        process.env.NODE_ENV !== 'production' &&
        /^http:\/\/localhost:\d+$/.test(origin)

      callback(null, isLocalDev)
    },
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads/public', express.static(LOCAL_PUBLIC_DIR))

app.use('/api', apiRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use(errorHandler)

const startServer = async () => {
  await connectDB()
  await seedCatalogIfEmpty()

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer()
