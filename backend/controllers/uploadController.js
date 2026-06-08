import asyncHandler from '../utils/asyncHandler.js'
import { uploadPrivateFile, uploadPublicFile } from '../services/storageService.js'

const folderForType = (type) => {
  if (type === 'preview-image') return 'previews/images'
  if (type === 'preview-video') return 'previews/videos'
  if (type === 'delivery-image') return 'delivery/images'
  if (type === 'delivery-video') return 'delivery/videos'
  return 'misc'
}

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' })
    return
  }

  const type = req.body.type || ''
  const folder = folderForType(type)

  if (type === 'delivery-image' || type === 'delivery-video') {
    const result = await uploadPrivateFile(req.file, folder)
    res.json({
      key: result.key,
      filename: result.filename,
      size: req.file.size,
      type,
    })
    return
  }

  if (type === 'preview-image' || type === 'preview-video') {
    const result = await uploadPublicFile(req.file, folder)
    res.json({ url: result.url, key: result.key, type })
    return
  }

  res.status(400).json({ message: 'Invalid upload type' })
})
