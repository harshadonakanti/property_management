const { User, Role, Organization } = require('./models');

async function test() {
  console.log('Test 1: User.findOne without include...');
  try {
    const u1 = await User.findOne({ where: { email: 'admin@housestays.com' } });
    console.log('Test 1 Success:', u1 ? u1.id : 'Null');
  } catch (e) {
    console.error('Test 1 Error:', e);
  }

  console.log('Test 2: User.findOne with Organization include...');
  try {
    const u2 = await User.findOne({
      where: { email: 'admin@housestays.com' },
      include: [{ model: Organization, as: 'organization' }]
    });
    console.log('Test 2 Success:', u2 ? u2.id : 'Null');
  } catch (e) {
    console.error('Test 2 Error:', e);
  }

  console.log('Test 3: User.findOne with Role (as roles) include...');
  try {
    const u3 = await User.findOne({
      where: { email: 'admin@housestays.com' },
      include: [{ model: Role, as: 'roles' }]
    });
    console.log('Test 3 Success:', u3 ? u3.id : 'Null');
  } catch (e) {
    console.error('Test 3 Error:', e);
  }

  console.log('Test 4: User.findOne with Role (as role) include...');
  try {
    const u4 = await User.findOne({
      where: { email: 'admin@housestays.com' },
      include: [{ model: Role, as: 'role' }]
    });
    console.log('Test 4 Success:', u4 ? u4.id : 'Null');
  } catch (e) {
    console.error('Test 4 Error:', e);
  }

  process.exit(0);
}

test();
