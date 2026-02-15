// services/locationService.js
const { query } = require('../config/database');
const { calculateHaversineDistance } = require('../utils/helpers');

class LocationService {
    // Search within radius using Haversine formula
    async searchWithinRadius(table, latitude, longitude, radiusKm, additionalConditions = '', params = []) {
        const sql = `
            SELECT *, 
                   (6371 * acos(
                       cos(radians(?)) * cos(radians(latitude)) * 
                       cos(radians(longitude) - radians(?)) + 
                       sin(radians(?)) * sin(radians(latitude))
                   )) AS distance
            FROM ${table}
            WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL
            ${additionalConditions}
            HAVING distance <= ?
            ORDER BY distance ASC
        `;

        const results = await query(sql, [latitude, longitude, latitude, ...params, radiusKm]);
        return results;
    }

    // Search job seekers within radius
    async searchJobSeekersNearby(latitude, longitude, radiusKm, filters = {}) {
        let conditions = `AND role = 'job_seeker' AND is_active = TRUE AND is_banned = FALSE`;
        const params = [];

        // Add skill filter
        if (filters.skills && filters.skills.length > 0) {
            conditions += ` AND id IN (
                SELECT user_id FROM user_skills WHERE skill_id IN (?)
            )`;
            params.push(filters.skills);
        }

        // Add availability filter
        if (filters.availability) {
            conditions += ` AND availability = ?`;
            params.push(filters.availability);
        }

        // Add verified filter
        if (filters.verifiedOnly) {
            conditions += ` AND exam_verified = TRUE`;
        }

        // Add salary range filter
        if (filters.maxSalary) {
            conditions += ` AND (expected_salary IS NULL OR expected_salary <= ?)`;
            params.push(filters.maxSalary);
        }

        const results = await this.searchWithinRadius(
            'users',
            latitude,
            longitude,
            radiusKm,
            conditions,
            params
        );

        return results;
    }

    // Search jobs within radius
    async searchJobsNearby(latitude, longitude, radiusKm, filters = {}) {
        let conditions = `AND status = 'active'`;
        const params = [];

        // Add job type filter
        if (filters.jobType) {
            conditions += ` AND job_type = ?`;
            params.push(filters.jobType);
        }

        // Add salary filter
        if (filters.minSalary) {
            conditions += ` AND (salary >= ? OR salary_max >= ?)`;
            params.push(filters.minSalary, filters.minSalary);
        }

        // Add keyword search
        if (filters.keyword) {
            conditions += ` AND (title LIKE ? OR description LIKE ? OR location LIKE ?)`;
            const keyword = `%${filters.keyword}%`;
            params.push(keyword, keyword, keyword);
        }

        const results = await this.searchWithinRadius(
            'jobs',
            latitude,
            longitude,
            radiusKm,
            conditions,
            params
        );

        return results;
    }

    // Calculate distance between two points
    calculateDistance(lat1, lon1, lat2, lon2) {
        return calculateHaversineDistance(lat1, lon1, lat2, lon2);
    }

    // Get nearby areas/locations
    async getNearbyLocations(latitude, longitude, radiusKm = 50) {
        const sql = `
            SELECT DISTINCT area,
                   (6371 * acos(
                       cos(radians(?)) * cos(radians(latitude)) * 
                       cos(radians(longitude) - radians(?)) + 
                       sin(radians(?)) * sin(radians(latitude))
                   )) AS distance
            FROM users
            WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL
            AND area IS NOT NULL
            AND area != ''
            HAVING distance <= ?
            ORDER BY distance ASC
            LIMIT 50
        `;

        const results = await query(sql, [latitude, longitude, latitude, radiusKm]);
        return results;
    }

    // Validate coordinates
    validateCoordinates(latitude, longitude) {
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            return { valid: false, error: 'Invalid latitude' };
        }

        if (isNaN(lon) || lon < -180 || lon > 180) {
            return { valid: false, error: 'Invalid longitude' };
        }

        return { valid: true, latitude: lat, longitude: lon };
    }
}

module.exports = new LocationService();