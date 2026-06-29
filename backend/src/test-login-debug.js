const { login } = require('./controllers/auth.controller');

async function debugLogin() {
  console.log('--- START DEBUG LOGIN ---');
  const req = {
    body: {
      email: 'admin@housestays.com',
      password: 'Admin@123'
    }
  };

  const res = {
    status: (code) => {
      console.log('RES STATUS:', code);
      return res;
    },
    json: (data) => {
      console.log('RES JSON:', JSON.stringify(data, null, 2));
      return res;
    }
  };

  const next = (err) => {
    console.error('NEXT ERROR:', err);
  };

  try {
    await login(req, res, next);
    console.log('--- END DEBUG LOGIN ---');
  } catch (err) {
    console.error('DEBUG LOGIN CATCH:', err);
  }
}

debugLogin();
