// config/msg91.js
const axios = require('axios');

const MSG91_CONFIG = {
    authKey: process.env.MSG91_AUTH_KEY,
    templateId: process.env.MSG91_TEMPLATE_ID,
    senderId: process.env.MSG91_SENDER_ID || 'JOBMKT',
    route: process.env.MSG91_ROUTE || '4',
    otpExpiry: parseInt(process.env.MSG91_OTP_EXPIRY) || 5, // minutes
    otpLength: 6,
    baseUrl: 'https://control.msg91.com/api/v5'
};

// Generate OTP
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};

// Send OTP via MSG91
const sendOTP = async (mobile, otp) => {
    try {
        // For development, skip actual SMS sending
        if (process.env.NODE_ENV === 'development') {
            console.log(`📱 [DEV] OTP for ${mobile}: ${otp}`);
            return { success: true, message: 'OTP sent (development mode)' };
        }

        const url = `${MSG91_CONFIG.baseUrl}/otp`;
        
        const response = await axios.post(url, {
            template_id: MSG91_CONFIG.templateId,
            mobile: `91${mobile}`,
            authkey: MSG91_CONFIG.authKey,
            otp: otp,
            otp_length: MSG91_CONFIG.otpLength,
            otp_expiry: MSG91_CONFIG.otpExpiry
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.type === 'success') {
            return { success: true, message: 'OTP sent successfully' };
        } else {
            throw new Error(response.data.message || 'Failed to send OTP');
        }

    } catch (error) {
        console.error('MSG91 Error:', error.response?.data || error.message);
        throw new Error('Failed to send OTP. Please try again.');
    }
};

// Verify OTP via MSG91 (optional - we can verify locally)
const verifyOTPViaMSG91 = async (mobile, otp) => {
    try {
        if (process.env.NODE_ENV === 'development') {
            return { success: true, message: 'OTP verified (development mode)' };
        }

        const url = `${MSG91_CONFIG.baseUrl}/otp/verify`;
        
        const response = await axios.post(url, {
            mobile: `91${mobile}`,
            otp: otp,
            authkey: MSG91_CONFIG.authKey
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.type === 'success') {
            return { success: true, message: 'OTP verified successfully' };
        } else {
            return { success: false, message: 'Invalid OTP' };
        }

    } catch (error) {
        console.error('MSG91 Verify Error:', error.response?.data || error.message);
        return { success: false, message: 'OTP verification failed' };
    }
};

// Resend OTP via MSG91
const resendOTP = async (mobile, retryType = 'text') => {
    try {
        if (process.env.NODE_ENV === 'development') {
            const newOtp = generateOTP();
            console.log(`📱 [DEV] Resent OTP for ${mobile}: ${newOtp}`);
            return { success: true, otp: newOtp, message: 'OTP resent (development mode)' };
        }

        const url = `${MSG91_CONFIG.baseUrl}/otp/retry`;
        
        const response = await axios.post(url, {
            mobile: `91${mobile}`,
            authkey: MSG91_CONFIG.authKey,
            retrytype: retryType // 'text' or 'voice'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.type === 'success') {
            return { success: true, message: 'OTP resent successfully' };
        } else {
            throw new Error(response.data.message || 'Failed to resend OTP');
        }

    } catch (error) {
        console.error('MSG91 Resend Error:', error.response?.data || error.message);
        throw new Error('Failed to resend OTP. Please try again.');
    }
};

module.exports = {
    MSG91_CONFIG,
    generateOTP,
    sendOTP,
    verifyOTPViaMSG91,
    resendOTP
};