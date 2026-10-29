const config = require('./config');
const app = require('./app');
if (process.env.SEED_DEMO !== 'false') require('./models/seed').seedDemo();

app.listen(config.port, () => console.log(`Helpdesk running at http://localhost:${config.port}`));
