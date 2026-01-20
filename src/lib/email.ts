
import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.zoho.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "do-not-reply@buchhospital.com",
                pass: "@#Buch@NR1@#",
            },
        });

        const info = await transporter.sendMail({
            from: 'do-not-reply@buchhospital.com',
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

export const getShortlistEmailTemplate = (candidateName: string, jobTitle: string) => {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #238740;">Application Update</h2>
        <p>Dear ${candidateName},</p>
        <p>We are pleased to inform you that you have been <strong>shortlisted</strong> for the <strong>${jobTitle}</strong> position at Buch International Hospital.</p>
        <p>Our recruitment team was impressed with your profile and qualifications. We will be reviewing your application further and will contact you shortly regarding the next steps in the hiring process.</p>
        <p>Thank you for your interest in joining our team.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>HR Department</strong><br/>Buch International Hospital</p>
    </div>
    `;
};

export const getInterviewEmailTemplate = (candidateName: string, jobTitle: string, interviewDate: string) => {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #238740;">Interview Invitation</h2>
        <p>Dear ${candidateName},</p>
        <p>We have reviewed your application for the <strong>${jobTitle}</strong> position and would like to invite you for an interview.</p>
        <p><strong>Scheduled Date & Time:</strong> ${new Date(interviewDate).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</p>
        <p>Please make yourself available at the requested time.</p>
        <p>We look forward to meeting you.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>HR Department</strong><br/>Buch International Hospital</p>
    </div>
    `;
};

export const getPanelMemberAddedEmailTemplate = (
    memberName: string,
    addedByName: string,
    candidateName: string,
    jobTitle: string,
    interviewDate: string | null
) => {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #238740;">Added to Interview Panel</h2>
        <p>Dear ${memberName},</p>
        <p>You have been added to the interview panel for the <strong>${jobTitle}</strong> position by <strong>${addedByName}</strong>.</p>
        
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Interview Details</h3>
        <p><strong>Candidate:</strong> ${candidateName}</p>
        <p><strong>Scheduled Date & Time:</strong> ${interviewDate ? new Date(interviewDate).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : 'Not yet scheduled'}</p>
        
        <p>Please log in to the recruitment portal to view detailed application information.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>HR Department</strong><br/>Buch International Hospital</p>
    </div>
    `;
};

export const getOTPEmailTemplate = (otp: string) => {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #238740;">Verify Your Email</h2>
        <p>Thank you for registering with Buch International Hospital.</p>
        <p>Please use the following One-Time Password (OTP) to complete your registration:</p>
        <h1 style="color: #238740; letter-spacing: 5px; background: #f0fdf4; padding: 10px; display: inline-block;">${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>IT Team</strong><br/>Buch International Hospital</p>
    </div>
    `;
};
