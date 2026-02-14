// services/otpService.js
const { query, getOne, insert } = require('../config/database');
const { generateOTP, sendOTP } = require('../config/msg91');
const { formatMobile, formatDateForMySQL } = require('../utils/helpers');
const { OTP_SETTINGS } = require('../utils/constants');
const { ApiError } = require('../utils/ApiError');

class OTPService {
    // Generate and send OTP
    async sendOTP(mobile, purpose = 'login') {
        const formattedMobile = formatMobile(mobile);
        
        // Check for recent OTP requests (rate limiting)
        const recentOTP = await getOne(
            `SELECT * FROM otp_logs 
             WHERE mobile = ? AND purpose = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
             ORDER BY created_at DESC LIMIT 1`,
            [formattedMobile, purpose, OTP_SETTINGS.RESEND_COOLDOWN_SECONDS]
        );

        if (recentOTP) {
            const waitTime = OTP_SETTINGS.RESEND_COOLDOWN_SECONDS;
            throw new ApiError(
                `Please wait ${waitTime} seconds before requesting another OTP`,
                429
            );
        }

        // Generate OTP
        const otp = generateOTP(OTP_SETTINGS.LENGTH);
        
        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + OTP_SETTINGS.EXPIRY_MINUTES);

        // Store OTP in database
        await insert('otp_logs', {
            mobile: formattedMobile,
            otp,
            purpose,
            expires_at: formatDateForMySQL(expiresAt),
            verified: false,
            attempts: 0
        });

        // Send OTP via MSG91
        await sendOTP(formattedMobile, otp);

        return {
            success: true,
            message: 'OTP sent successfully',
            expiresIn: OTP_SETTINGS.EXPIRY_MINUTES * 60 // in seconds
        };
    }

    // Verify OTP
    async verifyOTP(mobile, otp, purpose = 'login') {
        const formattedMobile = formatMobile(mobile);

        // Get the latest OTP for this mobile
        const otpRecord = await getOne(
            `SELECT * FROM otp_logs 
             WHERE mobile = ? AND purpose = ? AND verified = FALSE
             ORDER BY created_at DESC LIMIT 1`,
            [formattedMobile, purpose]
        );

        // Check if OTP exists
        if (!otpRecord) {
            throw new ApiError('No OTP found. Please request a new one.', 400);
        }

        // Check if OTP is expired
        if (new Date(otpRecord.expires_at) < new Date()) {
            throw new ApiError('OTP has expired. Please request a new one.', 400);
        }

        // Check max attempts
        if (otpRecord.attempts >= OTP_SETTINGS.MAX_ATTEMPTS) {
            throw new ApiError(
                'Maximum OTP attempts exceeded. Please request a new one.',
                400
            );
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            // Increment attempts
            await query(
                'UPDATE otp_logs SET attempts = attempts + 1 WHERE id = ?',
                [otpRecord.id]
            );
            
            const remainingAttempts = OTP_SETTINGS.MAX_ATTEMPTS - otpRecord.attempts - 1;
            throw new ApiError(
                `Invalid OTP. ${remainingAttempts} attempts remaining.`,
                400
            );
        }

        // Mark OTP as verified
        await query(
            'UPDATE otp_logs SET verified = TRUE, verified_at = NOW() WHERE id = ?',
            [otpRecord.id]
        );

        return {
            success: true,
            message: 'OTP verified successfully'
        };
    }

    // Resend OTP
    async resendOTP(mobile, purpose = 'login') {
        return this.sendOTP(mobile, purpose);
    }

    // Clean expired OTPs
    async cleanExpiredOTPs() {
        const result = await query(
            'DELETE FROM otp_logs WHERE expires_at < NOW() AND verified = FALSE'
        );
        return result.affectedRows;
    }
}

module.exports = new OTPService();