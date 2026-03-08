import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import userModel from '../models/userModel.js'

// Remove background from image
const removeBgImage = async (req, res) => {
    try {
        const { clerkId } = req.body

        // Find the user and check credits
        const user = await userModel.findOne({ clerkId })

        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        if (user.creditBalance <= 0) {
            return res.json({
                success: false,
                message: 'No credit balance. Please purchase credits.',
                creditBalance: 0
            })
        }

        // Check if image was uploaded
        if (!req.file) {
            return res.json({ success: false, message: 'No image provided' })
        }

        // Prepare form data for Clipdrop API
        const imagePath = req.file.path
        const formData = new FormData()
        formData.append('image_file', fs.createReadStream(imagePath))

        // Call Clipdrop Remove Background API
        const { data } = await axios.post(
            'https://clipdrop-api.co/remove-background/v1',
            formData,
            {
                headers: {
                    'x-api-key': process.env.CLIPDROP_API_KEY,
                    ...formData.getHeaders()
                },
                responseType: 'arraybuffer'
            }
        )

        // Convert the result to a base64 data URL
        const base64Image = Buffer.from(data, 'binary').toString('base64')
        const resultImage = `data:image/png;base64,${base64Image}`

        // Deduct 1 credit
        const updatedUser = await userModel.findByIdAndUpdate(
            user._id,
            { creditBalance: user.creditBalance - 1 },
            { new: true }
        )

        // Clean up uploaded file
        fs.unlink(imagePath, () => { })

        res.json({
            success: true,
            resultImage,
            creditBalance: updatedUser.creditBalance,
            message: 'Background removed successfully'
        })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

export { removeBgImage }
