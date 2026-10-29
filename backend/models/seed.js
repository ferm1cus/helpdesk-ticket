const bcrypt = require('bcryptjs');
const Users = require('./userModel');

function ensure(name, email, password, role) {
  if (!Users.findByEmail(email)) Users.create({ name, email, passwordHash: bcrypt.hashSync(password, 10), role });
}
// Admin is always present (needed to create agents). Demo users are optional.
const seedAdmin = () => ensure('Admin', 'admin@helpdesk.com', 'Admin@123', 'admin');
const seedDemo = () => {
  ensure('Alex Agent', 'agent@helpdesk.com', 'Agent@123', 'agent');
  ensure('Erin Employee', 'employee@helpdesk.com', 'Employee@123', 'employee');
};
module.exports = { seedAdmin, seedDemo };
