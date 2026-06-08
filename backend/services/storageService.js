import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  AWS_REGION,
  AWS_S3_BUCKET,
  AWS_S3_PRIVATE_PREFIX,
  AWS_S3_PUBLIC_PREFIX,
  isAwsEnabled,
  LOCAL_PRIVATE_DIR,
  LOCAL_PUBLIC_DIR,
  SIGNED_URL_EXPIRY_SECONDS,
} from '../config/storage.js'

let s3Client = null

const getS3 = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return s3Client
}

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true })
}

const sanitizeFilename = (filename) =>
  path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')

const buildKey = (prefix, folder, filename) => {
  const safeName = sanitizeFilename(filename)
  return `${prefix}/${folder}/${randomUUID()}-${safeName}`
}

/** Preserves original filename in storage path for delivery downloads */
const buildDeliveryKey = (prefix, folder, filename) => {
  const safeName = sanitizeFilename(filename)
  return `${prefix}/${folder}/${randomUUID()}/${safeName}`
}

export const getFilenameFromKey = (key = '') => {
  if (!key || /^https?:\/\//i.test(key)) return ''
  const parts = key.split('/')
  return parts[parts.length - 1] || ''
}

const getPublicBaseUrl = () => {
  if (process.env.AWS_S3_PUBLIC_URL) {
    return process.env.AWS_S3_PUBLIC_URL.replace(/\/$/, '')
  }
  return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`
}

const getApiBase = () =>
  (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`).replace(
    /\/$/,
    '',
  )

const getLocalPublicUrl = (key) =>
  `${getApiBase()}/uploads/public/${key.replace(/^public\//, '')}`

export const uploadPublicFile = async (file, folder) => {
  const key = buildKey(AWS_S3_PUBLIC_PREFIX, folder, file.originalname)

  if (isAwsEnabled()) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    )
    return { url: `${getPublicBaseUrl()}/${key}`, key }
  }

  const relativeKey = key.replace(`${AWS_S3_PUBLIC_PREFIX}/`, '')
  const filePath = path.join(LOCAL_PUBLIC_DIR, relativeKey)
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, file.buffer)
  return { url: getLocalPublicUrl(relativeKey), key: relativeKey }
}

export const uploadPrivateFile = async (file, folder) => {
  const originalFilename = sanitizeFilename(file.originalname)
  const key = buildDeliveryKey(AWS_S3_PRIVATE_PREFIX, folder, file.originalname)

  if (isAwsEnabled()) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
        ContentDisposition: `inline; filename="${originalFilename}"`,
        Metadata: {
          originalfilename: originalFilename,
        },
      }),
    )
    return { key: `private/${key.replace(`${AWS_S3_PRIVATE_PREFIX}/`, '')}`, filename: originalFilename }
  }

  const relativeKey = key.replace(`${AWS_S3_PRIVATE_PREFIX}/`, '')
  const filePath = path.join(LOCAL_PRIVATE_DIR, relativeKey)
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, file.buffer)
  return { key: `private/${relativeKey}`, filename: originalFilename }
}

export const getPrivateDownloadUrl = async (key, filename = '') => {
  if (!key) return null

  if (/^https?:\/\//i.test(key)) return key

  const downloadName = filename || getFilenameFromKey(key) || 'download'

  if (isAwsEnabled()) {
    const s3Key = key.startsWith(`${AWS_S3_PRIVATE_PREFIX}/`)
      ? key
      : `${AWS_S3_PRIVATE_PREFIX}/${key.replace(/^private\//, '')}`
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${downloadName}"`,
    })
    return getSignedUrl(getS3(), command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS })
  }

  const relativeKey = key.replace(/^private\//, '')
  return `/api/files/download/${relativeKey}?name=${encodeURIComponent(downloadName)}`
}

export const readPrivateFile = async (key) => {
  const relativeKey = key.replace(/^private\//, '').replace(`${AWS_S3_PRIVATE_PREFIX}/`, '')

  if (isAwsEnabled()) {
    const s3Key = key.startsWith(AWS_S3_PRIVATE_PREFIX)
      ? key
      : `${AWS_S3_PRIVATE_PREFIX}/${relativeKey}`
    const response = await getS3().send(
      new GetObjectCommand({ Bucket: AWS_S3_BUCKET, Key: s3Key }),
    )
    return {
      body: response.Body,
      contentType: response.ContentType || 'application/octet-stream',
    }
  }

  const filePath = path.join(LOCAL_PRIVATE_DIR, relativeKey)
  const body = await fs.readFile(filePath)
  return { body, contentType: 'application/octet-stream' }
}
