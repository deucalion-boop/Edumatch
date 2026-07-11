require('dotenv').config();

const { connectDatabase } = require('../config/database');
const User = require('../models/User');
const Subject = require('../models/Subject');

async function removeLegacySectionFields() {
  await connectDatabase();

  const [userResult, subjectResult] = await Promise.all([
    User.updateMany(
      { section: { $exists: true } },
      { $unset: { section: '' } }
    ),
    Subject.updateMany(
      { section: { $exists: true } },
      { $unset: { section: '' } }
    ),
  ]);

  console.log('Legacy section cleanup completed.');
  console.log(`Users matched: ${userResult.matchedCount}, updated: ${userResult.modifiedCount}`);
  console.log(`Subjects matched: ${subjectResult.matchedCount}, updated: ${subjectResult.modifiedCount}`);
}

removeLegacySectionFields()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to remove legacy section fields:', error);
    process.exit(1);
  });
