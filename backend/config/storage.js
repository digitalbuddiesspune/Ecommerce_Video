import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const isAwsEnabled = () =>
  Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET,
  )

export const AWS_REGION = process.env.AWS_REGION || 'ap-south-1'
export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || ''
export const AWS_S3_PUBLIC_PREFIX = process.env.AWS_S3_PUBLIC_PREFIX || 'public'
export const AWS_S3_PRIVATE_PREFIX = process.env.AWS_S3_PRIVATE_PREFIX || 'private'

export const LOCAL_UPLOAD_ROOT = path.join(__dirname, '..', 'uploads')
export const LOCAL_PUBLIC_DIR = path.join(LOCAL_UPLOAD_ROOT, 'public')
export const LOCAL_PRIVATE_DIR = path.join(LOCAL_UPLOAD_ROOT, 'private')

export const SIGNED_URL_EXPIRY_SECONDS = Number(
  process.env.AWS_SIGNED_URL_EXPIRY || 3600,
)
