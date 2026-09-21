const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:newPW@127.0.0.1:5432/leadpulse_dev' });
client.connect()
  .then(() => client.query('SELECT status, count(*) FROM campaign_leads WHERE "campaign_id"=\'f6c1cf7a-08d4-4f43-af81-9316ada90e5b\' GROUP BY status'))
  .then(r => console.log(r.rows))
  .catch(e => console.log(e))
  .finally(() => client.end());
