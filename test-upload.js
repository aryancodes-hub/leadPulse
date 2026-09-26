const { sequelize } = require('./leadpulse-data-model');
async function test() {
  const cm = await sequelize.query(`SELECT user_id, client_id FROM client_managers LIMIT 1;`);
  const userId = cm[0][0].user_id;
  const clientId = cm[0][0].client_id;
  
  const LeadListService = require('./leadpulse-core-api/app/components/lead-list/lead-list.service.js');
  const ls = new LeadListService();
  try {
    const res = await ls.uploadList(userId, clientId, 'Test List', { originalname: 'test.csv', path: './leadpulse-core-api/package.json' });
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
test();
