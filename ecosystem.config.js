module.exports = {
    apps: [
        {
            name: 'buch-backend',
            script: 'server.js',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                NEXTAUTH_URL: 'https://backend.buchhospital.com',
                NEXTAUTH_SECRET: 'supersecretkey123',
                DATABASE_URL: 'mysql://u335052771_buchwebsite:n%40sDA4%3F5S@srv1612.hstgr.io:3306/u335052771_buchwebsite',
                DB_HOST: 'srv1612.hstgr.io',
                DB_USER: 'u335052771_buchwebsite',
                DB_PASSWORD: 'n@sDA4?5S',
                DB_NAME: 'u335052771_buchwebsite',
                DB_PORT: 3306
            },
        },
    ],
};
