import { Webhook } from 'svix'
import userModel from '../models/userModel.js'

// API controller function to manage clerk user with databast
// http://localhost:4000/api/user/webhooks
const clerkWebhooks = async (req, res) => {
    try {
        // Craete a Svix instance with clerk webhook secret.
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)
        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        })
        const { data, type } = req.body
        switch (type) {
            case "user.created": {
                const userData = {
                    clerkId: data.id,
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
                }
                await userModel.create(userData)
                res.json({})
                break;
            }
            case "user.updated": {
                const userData = {
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url

                }
                await userModel.findOneAndUpdate({ clerkId: data.id }, userData)
                res.json({})
                break;
            }
            case "user.deleted": {
                await userModel.findOneAndDelete({ clerkId: data.id })
                res.json({})
                break;
            }
            default:
                break;
        }
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })

    }
}


// API Controller function to get user available credits data
const userCredits = async (req, res) => {
    try {
        const { clerkId } = req.body
        let userData = await userModel.findOne({ clerkId })

        // Auto-create user if not found (webhook may not have fired)
        if (!userData) {
            userData = await userModel.create({
                clerkId,
                email: `${clerkId}@placeholder.com`,
                photo: 'https://via.placeholder.com/150',
                creditBalance: 5
            })
        }

        res.json({ success: true, credits: userData.creditBalance })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// Plans data (must match frontend plans in assets.js)
const plans = [
    { id: 'Basic', price: 10, credits: 100 },
    { id: 'Advanced', price: 50, credits: 500 },
    { id: 'Business', price: 250, credits: 5000 },
]

// API Controller function to purchase credits (demo - no real payment)
const purchaseCredits = async (req, res) => {
    try {
        const { clerkId, planId } = req.body

        const plan = plans.find(p => p.id === planId)
        if (!plan) {
            return res.json({ success: false, message: 'Invalid plan selected' })
        }

        const userData = await userModel.findOne({ clerkId })
        if (!userData) {
            return res.json({ success: false, message: 'User not found' })
        }

        userData.creditBalance += plan.credits
        await userData.save()

        res.json({ success: true, credits: userData.creditBalance, message: `Successfully purchased ${plan.credits} credits!` })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

export { clerkWebhooks, userCredits, purchaseCredits }
