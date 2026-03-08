import express from 'express'
import { removeBgImage } from '../controllers/imageController.js'
import authUser from '../middlewares/auth.js'
import upload from '../middlewares/multer.js'

const imageRouter = express.Router()

imageRouter.post('/remove-bg', upload.single('image'), authUser, removeBgImage)

export default imageRouter
