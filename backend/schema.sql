-- Create Database
CREATE DATABASE IF NOT EXISTS job_platform
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE job_platform;


-- TABLE 1: users
-- Central user table for all roles

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    role ENUM('employer', 'job_seeker', 'admin') NULL,
    
    -- Location Details
    area VARCHAR(255) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    
    -- Job Seeker Specific Fields
    profile_image VARCHAR(500) NULL,
    availability ENUM('immediate', 'within_week', 'within_month', 'not_available') DEFAULT 'immediate',
    expected_salary DECIMAL(12, 2) NULL,
    bio TEXT NULL,
    
    -- Subscription & Verification
    subscription_status ENUM('free', 'premium') DEFAULT 'free',
    subscription_expiry DATETIME NULL,
    exam_verified BOOLEAN DEFAULT FALSE,
    badge_verified BOOLEAN DEFAULT FALSE,
    
    -- Employer Specific Fields
    company_name VARCHAR(200) NULL,
    company_description TEXT NULL,
    industry_type VARCHAR(100) NULL,
    company_size ENUM('1-10', '11-50', '51-200', '201-500', '500+') NULL,
    website VARCHAR(255) NULL,
    contact_person_name VARCHAR(100) NULL,
    
    -- Account Status
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason VARCHAR(500) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_mobile (mobile),
    INDEX idx_role (role),
    INDEX idx_location (latitude, longitude),
    INDEX idx_subscription (subscription_status),
    INDEX idx_availability (availability),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;


-- TABLE 2: skills
-- Master skills table

CREATE TABLE skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_skill_name (skill_name),
    INDEX idx_category (category),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;


-- TABLE 3: user_skills
-- Junction table for user-skill relationship

CREATE TABLE user_skills (
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    years_of_experience DECIMAL(4, 1) NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, skill_id),
    
    CONSTRAINT fk_user_skills_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_user_skills_skill 
        FOREIGN KEY (skill_id) REFERENCES skills(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_skill_id (skill_id),
    INDEX idx_verified (is_verified)
) ENGINE=InnoDB;


-- TABLE 4: jobs
-- Job postings by employers

CREATE TABLE jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employer_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Salary Details
    salary_min DECIMAL(12, 2) NULL,
    salary_max DECIMAL(12, 2) NULL,
    salary DECIMAL(12, 2) NULL,
    salary_type ENUM('hourly', 'daily', 'weekly', 'monthly', 'yearly') DEFAULT 'monthly',
    
    -- Job Details
    job_type ENUM('full_time', 'part_time', 'contract', 'freelance', 'internship') DEFAULT 'full_time',
    experience_required VARCHAR(50) NULL,
    education_required VARCHAR(100) NULL,
    vacancies INT DEFAULT 1,
    
    -- Location
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    is_remote BOOLEAN DEFAULT FALSE,
    
    -- Status
    status ENUM('draft', 'active', 'paused', 'closed', 'expired') DEFAULT 'active',
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    applications_count INT DEFAULT 0,
    
    -- Timestamps
    expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_jobs_employer 
        FOREIGN KEY (employer_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_employer_id (employer_id),
    INDEX idx_status (status),
    INDEX idx_job_type (job_type),
    INDEX idx_location (latitude, longitude),
    INDEX idx_salary (salary),
    INDEX idx_created_at (created_at),
    INDEX idx_featured (is_featured),
    FULLTEXT INDEX idx_search (title, description, location)
) ENGINE=InnoDB;


-- TABLE 5: job_skills
-- Skills required for jobs

CREATE TABLE job_skills (
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (job_id, skill_id),
    
    CONSTRAINT fk_job_skills_job 
        FOREIGN KEY (job_id) REFERENCES jobs(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_job_skills_skill 
        FOREIGN KEY (skill_id) REFERENCES skills(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_job_id (job_id),
    INDEX idx_skill_id (skill_id)
) ENGINE=InnoDB;


-- TABLE 6: otp_logs
-- OTP verification logs

CREATE TABLE otp_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mobile VARCHAR(15) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    purpose ENUM('login', 'registration', 'password_reset', 'verification') DEFAULT 'login',
    expires_at DATETIME NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at DATETIME NULL,
    attempts INT DEFAULT 0,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_mobile (mobile),
    INDEX idx_otp (otp),
    INDEX idx_expires_at (expires_at),
    INDEX idx_verified (verified),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;


-- TABLE 7: subscriptions
-- User subscription records

CREATE TABLE subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_name ENUM('free', 'premium_monthly', 'premium_quarterly', 'premium_yearly') NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Duration
    start_date DATETIME NOT NULL,
    expiry_date DATETIME NOT NULL,
    
    -- Status
    status ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'pending',
    auto_renew BOOLEAN DEFAULT FALSE,
    cancelled_at DATETIME NULL,
    cancellation_reason VARCHAR(500) NULL,
    
    -- Metadata
    features JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_subscriptions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_plan_name (plan_name)
) ENGINE=InnoDB;


-- TABLE 8: payments
-- Payment transaction records

CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_id INT NULL,
    
    -- Razorpay Details
    razorpay_order_id VARCHAR(100) NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    razorpay_signature VARCHAR(255) NULL,
    
    -- Payment Details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(50) NULL,
    
    -- Status
    status ENUM('created', 'pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'created',
    failure_reason VARCHAR(500) NULL,
    
    -- Metadata
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    
    -- Timestamps
    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_payments_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_payments_subscription 
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_razorpay_order_id (razorpay_order_id),
    INDEX idx_razorpay_payment_id (razorpay_payment_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;


-- TABLE 9: skill_exams
-- Skill verification exam questions

CREATE TABLE skill_exams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    skill_id INT NOT NULL,
    question TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    explanation TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_skill_exams_skill 
        FOREIGN KEY (skill_id) REFERENCES skills(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_skill_id (skill_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;


-- TABLE 10: exam_attempts
-- User exam attempt records

CREATE TABLE exam_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    
    -- Exam Details
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    passed BOOLEAN NOT NULL,
    passing_score DECIMAL(5, 2) DEFAULT 60.00,
    
    -- Timing
    time_taken_seconds INT NULL,
    started_at DATETIME NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Answers
    answers JSON NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_skill_id (skill_id),
    INDEX idx_passed (passed),
    INDEX idx_attempted_at (attempted_at),
    
    CONSTRAINT fk_exam_attempts_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_exam_attempts_skill 
        FOREIGN KEY (skill_id) REFERENCES skills(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- TABLE 11: ai_matches
-- AI-based job matching results

CREATE TABLE ai_matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_id INT NOT NULL,
    job_seeker_id INT NOT NULL,
    
    -- Match Scores
    match_score DECIMAL(5, 2) NOT NULL,
    skill_match_score DECIMAL(5, 2) NULL,
    location_match_score DECIMAL(5, 2) NULL,
    salary_match_score DECIMAL(5, 2) NULL,
    availability_match_score DECIMAL(5, 2) NULL,
    experience_match_score DECIMAL(5, 2) NULL,
    
    -- Match Details
    matched_skills JSON NULL,
    distance_km DECIMAL(10, 2) NULL,
    
    -- Status
    status ENUM('pending', 'viewed', 'contacted', 'applied', 'rejected', 'hired') DEFAULT 'pending',
    employer_viewed BOOLEAN DEFAULT FALSE,
    job_seeker_viewed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ai_matches_job 
        FOREIGN KEY (job_id) REFERENCES jobs(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_ai_matches_job_seeker 
        FOREIGN KEY (job_seeker_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    UNIQUE KEY unique_job_seeker (job_id, job_seeker_id),
    
    INDEX idx_job_id (job_id),
    INDEX idx_job_seeker_id (job_seeker_id),
    INDEX idx_match_score (match_score),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;


-- TABLE 12: job_applications
-- Job application tracking
CREATE TABLE job_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Application Details
    cover_letter TEXT NULL,
    resume_url VARCHAR(500) NULL,
    expected_salary DECIMAL(12, 2) NULL,
    
    -- Status
    status ENUM('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn') DEFAULT 'pending',
    employer_notes TEXT NULL,
    
    -- Timestamps
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_applications_job 
        FOREIGN KEY (job_id) REFERENCES jobs(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_applications_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    UNIQUE KEY unique_application (job_id, user_id),
    
    INDEX idx_job_id (job_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_applied_at (applied_at)
) ENGINE=InnoDB;


-- TABLE 13: notifications
-- User notifications

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('job_match', 'application', 'subscription', 'exam', 'system', 'promotion') DEFAULT 'system',
    data JSON NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notifications_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;


-- TABLE 14: activity_logs
-- User activity tracking for analytics

CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    description TEXT NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_activity_logs_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;


-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert Admin User
INSERT INTO users (name, mobile, role, subscription_status, badge_verified) 
VALUES ('Admin', '9999999999', 'admin', 'premium', TRUE);

-- Insert Default Skills
INSERT INTO skills (skill_name, category) VALUES
('JavaScript', 'Programming'),
('Python', 'Programming'),
('Java', 'Programming'),
('React', 'Frontend'),
('Node.js', 'Backend'),
('MySQL', 'Database'),
('MongoDB', 'Database'),
('HTML/CSS', 'Frontend'),
('Angular', 'Frontend'),
('Vue.js', 'Frontend'),
('PHP', 'Backend'),
('Ruby', 'Programming'),
('Go', 'Programming'),
('Swift', 'Mobile'),
('Kotlin', 'Mobile'),
('React Native', 'Mobile'),
('Flutter', 'Mobile'),
('AWS', 'Cloud'),
('Azure', 'Cloud'),
('Docker', 'DevOps'),
('Kubernetes', 'DevOps'),
('Git', 'Tools'),
('Data Analysis', 'Data Science'),
('Machine Learning', 'Data Science'),
('UI/UX Design', 'Design'),
('Photoshop', 'Design'),
('Figma', 'Design'),
('Sales', 'Business'),
('Marketing', 'Business'),
('Customer Service', 'Support'),
('Accounting', 'Finance'),
('Excel', 'Tools'),
('Communication', 'Soft Skills'),
('Leadership', 'Soft Skills'),
('Problem Solving', 'Soft Skills'),
('Driving', 'Others'),
('Cooking', 'Others'),
('Electrician', 'Trade'),
('Plumbing', 'Trade'),
('Carpentry', 'Trade');

-- Insert Sample Exam Questions
INSERT INTO skill_exams (skill_id, question, option_a, option_b, option_c, option_d, correct_answer, difficulty) VALUES
(1, 'What is the output of typeof null in JavaScript?', 'null', 'undefined', 'object', 'number', 'C', 'easy'),
(1, 'Which method is used to add elements to the end of an array?', 'push()', 'pop()', 'shift()', 'unshift()', 'A', 'easy'),
(1, 'What does === operator check in JavaScript?', 'Only value', 'Only type', 'Value and type', 'None', 'C', 'easy'),
(1, 'What is closure in JavaScript?', 'A function inside a loop', 'A function with access to outer scope variables', 'A closed function', 'None of these', 'B', 'medium'),
(1, 'What is the output of console.log(1 + "2" + 3)?', '6', '123', '15', '33', 'B', 'medium'),
(2, 'What is the correct way to create a list in Python?', 'list = ()', 'list = []', 'list = {}', 'list = <>', 'B', 'easy'),
(2, 'What does len() function do in Python?', 'Returns length', 'Creates length', 'Deletes length', 'None', 'A', 'easy'),
(2, 'What is a decorator in Python?', 'A design pattern', 'A function that modifies another function', 'A class method', 'A variable', 'B', 'medium'),
(5, 'What is Node.js built on?', 'V8 Engine', 'SpiderMonkey', 'Chakra', 'Rhino', 'A', 'easy'),
(5, 'Which module is used to create HTTP server in Node.js?', 'url', 'http', 'fs', 'path', 'B', 'easy');

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure to clean expired OTPs
DELIMITER //
CREATE PROCEDURE CleanExpiredOTPs()
BEGIN
    DELETE FROM otp_logs 
    WHERE expires_at < NOW() 
    AND verified = FALSE;
END //
DELIMITER ;

-- Procedure to update expired subscriptions
DELIMITER //
CREATE PROCEDURE UpdateExpiredSubscriptions()
BEGIN
    -- Update subscription status
    UPDATE subscriptions 
    SET status = 'expired' 
    WHERE expiry_date < NOW() 
    AND status = 'active';
    
    -- Update user subscription status
    UPDATE users u
    INNER JOIN subscriptions s ON u.id = s.user_id
    SET u.subscription_status = 'free',
        u.subscription_expiry = NULL
    WHERE s.expiry_date < NOW() 
    AND u.subscription_status = 'premium';
END //
DELIMITER ;

-- Procedure to calculate match score
DELIMITER //
CREATE PROCEDURE CalculateMatchScore(
    IN p_job_id INT,
    IN p_job_seeker_id INT,
    OUT p_match_score DECIMAL(5,2)
)
BEGIN
    DECLARE v_skill_score DECIMAL(5,2) DEFAULT 0;
    DECLARE v_location_score DECIMAL(5,2) DEFAULT 0;
    DECLARE v_salary_score DECIMAL(5,2) DEFAULT 0;
    DECLARE v_total_job_skills INT DEFAULT 0;
    DECLARE v_matched_skills INT DEFAULT 0;
    DECLARE v_distance DECIMAL(10,2);
    DECLARE v_job_salary DECIMAL(12,2);
    DECLARE v_expected_salary DECIMAL(12,2);
    
    -- Calculate skill match score (40% weight)
    SELECT COUNT(*) INTO v_total_job_skills FROM job_skills WHERE job_id = p_job_id;
    
    SELECT COUNT(*) INTO v_matched_skills
    FROM job_skills js
    INNER JOIN user_skills us ON js.skill_id = us.skill_id
    WHERE js.job_id = p_job_id AND us.user_id = p_job_seeker_id;
    
    IF v_total_job_skills > 0 THEN
        SET v_skill_score = (v_matched_skills / v_total_job_skills) * 100;
    END IF;
    
    -- Calculate location score (30% weight) using Haversine
    SELECT 
        (6371 * acos(cos(radians(j.latitude)) * cos(radians(u.latitude)) * 
        cos(radians(u.longitude) - radians(j.longitude)) + 
        sin(radians(j.latitude)) * sin(radians(u.latitude)))) INTO v_distance
    FROM jobs j, users u 
    WHERE j.id = p_job_id AND u.id = p_job_seeker_id;
    
    IF v_distance IS NOT NULL THEN
        IF v_distance <= 5 THEN SET v_location_score = 100;
        ELSEIF v_distance <= 10 THEN SET v_location_score = 80;
        ELSEIF v_distance <= 25 THEN SET v_location_score = 60;
        ELSEIF v_distance <= 50 THEN SET v_location_score = 40;
        ELSEIF v_distance <= 100 THEN SET v_location_score = 20;
        ELSE SET v_location_score = 0;
        END IF;
    END IF;
    
    -- Calculate salary match score (30% weight)
    SELECT salary INTO v_job_salary FROM jobs WHERE id = p_job_id;
    SELECT expected_salary INTO v_expected_salary FROM users WHERE id = p_job_seeker_id;
    
    IF v_job_salary IS NOT NULL AND v_expected_salary IS NOT NULL THEN
        IF v_job_salary >= v_expected_salary THEN 
            SET v_salary_score = 100;
        ELSE 
            SET v_salary_score = (v_job_salary / v_expected_salary) * 100;
        END IF;
    ELSE
        SET v_salary_score = 50;
    END IF;
    
    -- Calculate final match score
    SET p_match_score = (v_skill_score * 0.4) + (v_location_score * 0.3) + (v_salary_score * 0.3);
    
END //
DELIMITER ;

-- ============================================
-- EVENTS (Scheduled Tasks)
-- ============================================

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Event to clean expired OTPs (runs every hour)
CREATE EVENT IF NOT EXISTS event_clean_otps
ON SCHEDULE EVERY 1 HOUR
DO CALL CleanExpiredOTPs();

-- Event to update expired subscriptions (runs daily)
CREATE EVENT IF NOT EXISTS event_update_subscriptions
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO CALL UpdateExpiredSubscriptions();

-- ============================================
-- VIEWS
-- ============================================

-- View for active jobs with employer details
CREATE OR REPLACE VIEW vw_active_jobs AS
SELECT 
    j.*,
    u.name as employer_name,
    u.company_name,
    u.company_description,
    u.profile_image as company_logo,
    u.badge_verified as employer_verified,
    GROUP_CONCAT(s.skill_name) as required_skills
FROM jobs j
INNER JOIN users u ON j.employer_id = u.id
LEFT JOIN job_skills js ON j.id = js.job_id
LEFT JOIN skills s ON js.skill_id = s.id
WHERE j.status = 'active'
AND u.is_active = TRUE
AND u.is_banned = FALSE
GROUP BY j.id;

-- View for verified job seekers
CREATE OR REPLACE VIEW vw_verified_job_seekers AS
SELECT 
    u.*,
    GROUP_CONCAT(s.skill_name) as skills
FROM users u
LEFT JOIN user_skills us ON u.id = us.user_id
LEFT JOIN skills s ON us.skill_id = s.id
WHERE u.role = 'job_seeker'
AND u.is_active = TRUE
AND u.is_banned = FALSE
AND u.exam_verified = TRUE
GROUP BY u.id;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to increment job application count
DELIMITER //
CREATE TRIGGER trg_after_application_insert
AFTER INSERT ON job_applications
FOR EACH ROW
BEGIN
    UPDATE jobs 
    SET applications_count = applications_count + 1 
    WHERE id = NEW.job_id;
END //
DELIMITER ;

-- Trigger to update user verification status after passing exam
DELIMITER //
CREATE TRIGGER trg_after_exam_pass
AFTER INSERT ON exam_attempts
FOR EACH ROW
BEGIN
    IF NEW.passed = TRUE THEN
        UPDATE users 
        SET exam_verified = TRUE 
        WHERE id = NEW.user_id;
        
        UPDATE user_skills 
        SET is_verified = TRUE 
        WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;
    END IF;
END //
DELIMITER ;

-- ============================================
-- GRANTS (For production security)
-- ============================================
-- CREATE USER 'job_platform_app'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON job_platform.* TO 'job_platform_app'@'localhost';
-- FLUSH PRIVILEGES;