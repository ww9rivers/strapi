const path = require('path');
const { cleanTestApp, generateTestApp, startTestApp } = require('./helpers/testAppGenerator');
const execa = require('execa');
const waitOn = require('wait-on');

const appName = 'testApp';

const databases = {
  mongo: `--dbclient=mongo --dbhost=127.0.0.1 --dbport=27017 --dbname=strapi_test --dbusername=root --dbpassword=strapi`,
  postgres:
    '--dbclient=postgres --dbhost=127.0.0.1 --dbport=5432 --dbname=strapi_test --dbusername=strapi --dbpassword=strapi',
  mysql:
    '--dbclient=mysql --dbhost=127.0.0.1 --dbport=3306 --dbname=strapi_test --dbusername=strapi --dbpassword=strapi',
  sqlite: '--dbclient=sqlite --dbfile=./tmp/data.db',
};

const test = async () => {
  return execa.shell('npm run -s test:e2e', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: {
      CI: true,
      FORCE_COLOR: 1,
    },
  });
};

const main = async () => {
  const database = process.argv.length > 2 ? process.argv.slice(2).join(' ') : databases.mongo;

  try {
    await cleanTestApp(appName);
    await generateTestApp({ appName, database });
    const testAppProcess = startTestApp({ appName });

    await waitOn({ resources: ['http://localhost:1337'] });

    await test().catch(() => {
      testAppProcess.kill();
      process.stdout.write('Tests failed\n', () => {
        process.exit(1);
      });
    });

    testAppProcess.kill();
    process.exit(0);
  } catch (error) {
    process.stdout.write('Tests failed\n', () => {
      process.exit(1);
    });
  }
};

main();
