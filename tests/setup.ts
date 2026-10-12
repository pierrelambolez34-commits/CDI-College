import "dotenv/config";
// Les tests utilisent une base à part, vidée avant chaque test.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
delete process.env.SMTP_URL; delete process.env.SMTP_HOST; // les e-mails restent en mémoire pendant les tests
process.env.SUPERADMIN_EMAIL = "patron@exemple.fr";
process.env.APP_URL = "https://cdi.exemple.fr";
