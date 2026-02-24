const Datastore = require('nedb-promises')
const path = require('path')

const dataDir = path.join(__dirname, '../data')

module.exports = {
    users: Datastore.create({ filename: path.join(dataDir, 'users.db'), autoload: true }),
    habits: Datastore.create({ filename: path.join(dataDir, 'habits.db'), autoload: true }),
    goals: Datastore.create({ filename: path.join(dataDir, 'goals.db'), autoload: true }),
    study: Datastore.create({ filename: path.join(dataDir, 'study.db'), autoload: true }),
    journal: Datastore.create({ filename: path.join(dataDir, 'journal.db'), autoload: true }),
    finance: Datastore.create({ filename: path.join(dataDir, 'finance.db'), autoload: true }),
}
