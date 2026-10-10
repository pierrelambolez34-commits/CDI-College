import "dotenv/config";
// Les tests utilisent une base à part, vidée avant chaque test.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
