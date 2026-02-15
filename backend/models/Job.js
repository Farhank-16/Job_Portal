// models/Job.js
const { query, getOne, insert, update, remove, transaction } = require('../config/database');

class JobModel {
    // Create job
    async create(employerId, data) {
        return await transaction(async (connection) => {
            // Insert job
            const [result] = await connection.execute(
                `INSERT INTO jobs 
                 (employer_id, title, description, salary, salary_min, salary_max,
                  job_type, location, latitude, longitude, experience_required,
                  education_required, vacancies, is_remote)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    employerId,
                    data.title,
                    data.description,
                    data.salary || null,
                    data.salary_min || null,
                    data.salary_max || null,
                    data.job_type || 'full_time',
                    data.location,
                    data.latitude || null,
                    data.longitude || null,
                    data.experience_required || null,
                    data.education_required || null,
                    data.vacancies || 1,
                    data.is_remote || false
                ]
            );

            const jobId = result.insertId;

            // Insert job skills if provided
            if (data.skills && data.skills.length > 0) {
                for (const skillId of data.skills) {
                    await connection.execute(
                        'INSERT INTO job_skills (job_id, skill_id) VALUES (?, ?)',
                        [jobId, skillId]
                    );
                }
            }

            return this.findById(jobId);
        });
    }

    // Find job by ID
    async findById(id) {
        const job = await getOne(
            `SELECT j.*, u.name as employer_name, u.company_name, 
                    u.company_description, u.profile_image as company_logo,
                    u.badge_verified as employer_verified
             FROM jobs j
             INNER JOIN users u ON j.employer_id = u.id
             WHERE j.id = ?`,
            [id]
        );

        if (!job) return null;

        // Get job skills
        const skills = await query(
            `SELECT s.id, s.skill_name
             FROM job_skills js
             INNER JOIN skills s ON js.skill_id = s.id
             WHERE js.job_id = ?`,
            [id]
        );

        return { ...job, skills };
    }

    // Update job
    async update(id, data) {
        return await transaction(async (connection) => {
            // Build update data
            const updateData = {};
            const allowedFields = [
                'title', 'description', 'salary', 'salary_min', 'salary_max',
                'job_type', 'location', 'latitude', 'longitude', 'status',
                'experience_required', 'education_required', 'vacancies', 'is_remote'
            ];

            allowedFields.forEach(field => {
                if (data[field] !== undefined) {
                    updateData[field] = data[field];
                }
            });

            if (Object.keys(updateData).length > 0) {
                const setClause = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
                await connection.execute(
                    `UPDATE jobs SET ${setClause} WHERE id = ?`,
                    [...Object.values(updateData), id]
                );
            }

            // Update skills if provided
            if (data.skills !== undefined) {
                await connection.execute('DELETE FROM job_skills WHERE job_id = ?', [id]);
                
                if (data.skills.length > 0) {
                    for (const skillId of data.skills) {
                        await connection.execute(
                            'INSERT INTO job_skills (job_id, skill_id) VALUES (?, ?)',
                            [id, skillId]
                        );
                    }
                }
            }

            return this.findById(id);
        });
    }

    // Delete job
    async delete(id) {
        return await remove('jobs', { id });
    }

    // Get jobs by employer
    async findByEmployer(employerId, status = null, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        let sql = `
            SELECT j.*, 
                   (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as applications_count
            FROM jobs j
            WHERE j.employer_id = ?
        `;
        const params = [employerId];

        if (status) {
            sql += ` AND j.status = ?`;
            params.push(status);
        }

        sql += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const jobs = await query(sql, params);

        const [countResult] = await query(
            'SELECT COUNT(*) as total FROM jobs WHERE employer_id = ?' + 
            (status ? ' AND status = ?' : ''),
            status ? [employerId, status] : [employerId]
        );

        return {
            jobs,
            total: countResult.total,
            page,
            totalPages: Math.ceil(countResult.total / limit)
        };
    }

    // Search jobs
    async search(filters, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        let sql = `
            SELECT j.*, u.company_name, u.badge_verified as employer_verified,
                   GROUP_CONCAT(DISTINCT s.skill_name) as required_skills
            FROM jobs j
            INNER JOIN users u ON j.employer_id = u.id
            LEFT JOIN job_skills js ON j.id = js.job_id
            LEFT JOIN skills s ON js.skill_id = s.id
            WHERE j.status = 'active'
            AND u.is_active = TRUE
            AND u.is_banned = FALSE
        `;
        const params = [];

        // Keyword search
        if (filters.keyword) {
            sql += ` AND (j.title LIKE ? OR j.description LIKE ? OR j.location LIKE ?)`;
            const keyword = `%${filters.keyword}%`;
            params.push(keyword, keyword, keyword);
        }

        // Job type filter
        if (filters.job_type) {
            sql += ` AND j.job_type = ?`;
            params.push(filters.job_type);
        }

        // Salary range
        if (filters.salary_min) {
            sql += ` AND (j.salary >= ? OR j.salary_max >= ?)`;
            params.push(filters.salary_min, filters.salary_min);
        }

        if (filters.salary_max) {
            sql += ` AND (j.salary <= ? OR j.salary_min <= ?)`;
            params.push(filters.salary_max, filters.salary_max);
        }

        // Skills filter
        if (filters.skills && filters.skills.length > 0) {
            sql += ` AND j.id IN (SELECT job_id FROM job_skills WHERE skill_id IN (?))`;
            params.push(filters.skills);
        }

        sql += ` GROUP BY j.id ORDER BY j.is_featured DESC, j.created_at DESC`;
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const jobs = await query(sql, params);
        return jobs;
    }

    // Increment view count
    async incrementViews(id) {
        await query('UPDATE jobs SET views_count = views_count + 1 WHERE id = ?', [id]);
    }

    // Get featured jobs
    async getFeatured(limit = 10) {
        return await query(
            `SELECT j.*, u.company_name, u.badge_verified as employer_verified
             FROM jobs j
             INNER JOIN users u ON j.employer_id = u.id
             WHERE j.status = 'active' AND j.is_featured = TRUE
             AND u.is_active = TRUE AND u.is_banned = FALSE
             ORDER BY j.created_at DESC
             LIMIT ?`,
            [limit]
        );
    }

    // Get recent jobs
    async getRecent(limit = 20) {
        return await query(
            `SELECT j.*, u.company_name, u.badge_verified as employer_verified
             FROM jobs j
             INNER JOIN users u ON j.employer_id = u.id
             WHERE j.status = 'active'
             AND u.is_active = TRUE AND u.is_banned = FALSE
             ORDER BY j.created_at DESC
             LIMIT ?`,
            [limit]
        );
    }
}

module.exports = new JobModel();