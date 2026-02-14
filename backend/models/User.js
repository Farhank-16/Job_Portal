// models/User.js
const { query, getOne, insert, update, exists } = require('../config/database');
const { formatMobile, sanitizeUser } = require('../utils/helpers');

class UserModel {
    // Find user by ID
    async findById(id) {
        const user = await getOne(
            `SELECT u.*, GROUP_CONCAT(s.skill_name) as skills
             FROM users u
             LEFT JOIN user_skills us ON u.id = us.user_id
             LEFT JOIN skills s ON us.skill_id = s.id
             WHERE u.id = ?
             GROUP BY u.id`,
            [id]
        );
        return sanitizeUser(user);
    }

    // Find user by mobile
    async findByMobile(mobile) {
        const formattedMobile = formatMobile(mobile);
        const user = await getOne(
            'SELECT * FROM users WHERE mobile = ?',
            [formattedMobile]
        );
        return sanitizeUser(user);
    }

    // Check if user exists
    async exists(mobile) {
        const formattedMobile = formatMobile(mobile);
        return await exists('users', { mobile: formattedMobile });
    }

    // Create user
    async create(data) {
        const formattedMobile = formatMobile(data.mobile);
        const userId = await insert('users', {
            mobile: formattedMobile,
            name: data.name || null,
            role: data.role || null,
            subscription_status: 'free'
        });
        return this.findById(userId);
    }

    // Update user
    async update(id, data) {
        // Remove undefined values
        const cleanData = {};
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
                cleanData[key] = data[key];
            }
        });

        if (Object.keys(cleanData).length === 0) {
            return this.findById(id);
        }

        await update('users', cleanData, { id });
        return this.findById(id);
    }

    // Update role
    async updateRole(id, role) {
        return this.update(id, { role });
    }

    // Update subscription
    async updateSubscription(id, status, expiry) {
        return this.update(id, {
            subscription_status: status,
            subscription_expiry: expiry
        });
    }

    // Update verification status
    async updateVerification(id, examVerified, badgeVerified) {
        const data = {};
        if (examVerified !== undefined) data.exam_verified = examVerified;
        if (badgeVerified !== undefined) data.badge_verified = badgeVerified;
        return this.update(id, data);
    }

    // Update last login
    async updateLastLogin(id) {
        await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
    }

    // Get user with skills
    async getUserWithSkills(id) {
        const user = await this.findById(id);
        if (!user) return null;

        const skills = await query(
            `SELECT s.id, s.skill_name, us.proficiency_level, us.years_of_experience, us.is_verified
             FROM user_skills us
             INNER JOIN skills s ON us.skill_id = s.id
             WHERE us.user_id = ?`,
            [id]
        );

        return { ...user, skillsList: skills };
    }

    // Get users by role with pagination
    async findByRole(role, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        
        const users = await query(
            `SELECT id, name, mobile, area, profile_image, availability, 
                    expected_salary, exam_verified, badge_verified, 
                    subscription_status, created_at
             FROM users 
             WHERE role = ? AND is_active = TRUE AND is_banned = FALSE
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [role, limit, offset]
        );

        const [countResult] = await query(
            'SELECT COUNT(*) as total FROM users WHERE role = ? AND is_active = TRUE AND is_banned = FALSE',
            [role]
        );

        return {
            users,
            total: countResult.total,
            page,
            totalPages: Math.ceil(countResult.total / limit)
        };
    }

    // Ban user
    async banUser(id, reason = null) {
        return this.update(id, {
            is_banned: true,
            ban_reason: reason
        });
    }

    // Unban user
    async unbanUser(id) {
        return this.update(id, {
            is_banned: false,
            ban_reason: null
        });
    }

    // Search users
    async search(filters, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        let sql = `
            SELECT DISTINCT u.id, u.name, u.mobile, u.area, u.profile_image,
                   u.availability, u.expected_salary, u.exam_verified, 
                   u.badge_verified, u.subscription_status, u.latitude, u.longitude
            FROM users u
            LEFT JOIN user_skills us ON u.id = us.user_id
            WHERE u.role = 'job_seeker' AND u.is_active = TRUE AND u.is_banned = FALSE
        `;
        const params = [];

        if (filters.skills && filters.skills.length > 0) {
            sql += ` AND us.skill_id IN (?)`;
            params.push(filters.skills);
        }

        if (filters.availability) {
            sql += ` AND u.availability = ?`;
            params.push(filters.availability);
        }

        if (filters.verified) {
            sql += ` AND u.exam_verified = TRUE`;
        }

        if (filters.keyword) {
            sql += ` AND (u.name LIKE ? OR u.area LIKE ?)`;
            params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
        }

        sql += ` ORDER BY u.badge_verified DESC, u.exam_verified DESC, u.created_at DESC`;
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const users = await query(sql, params);
        return users;
    }
}

module.exports = new UserModel();