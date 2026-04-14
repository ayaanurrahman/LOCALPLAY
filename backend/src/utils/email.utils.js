const nodemailer = require("nodemailer")

// creates a transporter based on environment
// in dev: uses Mailtrap (or any SMTP sandbox)
// in prod: swap SMTP creds for Resend / SendGrid / SES
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })
}

// sends a verification email with a tokenised link
const sendVerificationEmail = async (toEmail, username, verifyToken) => {
    const transporter = createTransporter()

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`

    await transporter.sendMail({
        from: `"LOCALPLAY" <${process.env.SMTP_FROM || "no-reply@localplay.app"}>`,
        to: toEmail,
        subject: "Verify your LOCALPLAY account",
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
                <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Hey ${username} 👋</h2>
                <p style="font-size: 15px; color: #555; margin-bottom: 24px;">
                    Welcome to LOCALPLAY. One quick step — verify your email to start finding players near you.
                </p>
                <a href="${verifyUrl}"
                   style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none;
                          padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 500;">
                    Verify my email
                </a>
                <p style="font-size: 13px; color: #999; margin-top: 24px;">
                    This link expires in 24 hours. If you didn't create an account, you can ignore this email.
                </p>
                <p style="font-size: 12px; color: #ccc; margin-top: 8px;">
                    Or copy this link: ${verifyUrl}
                </p>
            </div>
        `
    })
}

module.exports = { sendVerificationEmail }
