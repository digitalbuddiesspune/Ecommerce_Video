import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import { reseedCatalog } from './seedCatalog.js'

dotenv.config()

const run = async () => {
  await connectDB()
  await reseedCatalog()
  console.log('Demo categories and products seeded successfully')
  process.exit(0)
}

run().catch((error) => {
  console.error('Seed failed:', error.message)
  process.exit(1)
})
