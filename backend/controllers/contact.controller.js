import Contact from "../models/contact.models.js";
import { sendContactMail } from "../utils/sendEmail.js";

export const submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Name, email and message are required." });
        }

        const contact = await Contact.create({
            name,
            email,
            // an empty subject must become undefined, otherwise the model's default "General" won't apply
            subject: typeof subject === "string" && subject.trim() ? subject : undefined,
            message,
            user: req.userId || null,
        });

        // The message is already saved, so an email failure shouldn't make the user think it failed
        try {
            await sendContactMail(contact);
        } catch (mailError) {
            console.error("Contact mail error:", mailError.message);
        }

        return res.status(201).json({ message: "Thank you! Your message has been sent." });
    } catch (error) {
        // Turn the schema's validation errors (e.g. "Message is required") into a clean 400
        if (error.name === "ValidationError") {
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({ message: firstError });
        }
        return res.status(500).json({ message: `Contact error: ${error.message}` });
    }
};