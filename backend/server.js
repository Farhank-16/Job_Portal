// server.js
const app = require('./app');
const { pool, testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await testConnection();
        console.log('✅ Database connected successfully');

        const server = app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 Job Marketplace API Server                        ║
║                                                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║   Port: ${PORT}                                           ║
║   API Version: ${process.env.API_VERSION || 'v1'}                                ║
║                                                        ║
║   API Base URL: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
            `);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            console.error('UNHANDLED REJECTION! Shutting down...');
            console.error(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
            server.close(() => {
                console.log('💥 Process terminated!');
                pool.end();
            });
        });

        process.on('SIGINT', () => {
            console.log('👋 SIGINT RECEIVED. Shutting down gracefully');
            server.close(() => {
                console.log('💥 Process terminated!');
                pool.end();
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();