const { exec } = require('child_process');

const { yaar_VERSION } = require('../common-src/Version');

exec(`yarn version ${yaar_VERSION}`, (error, stdout, stderr) => {
  if (error) {
    console.log(error);
    console.log('exit.');
  } else {
    if (stdout) {
      console.log(`stdout - \n${stdout}`);
    }
    if (stderr) {
      console.log(`stderr - \n${stderr}`);
    }
    console.log(`Updated package.json version to ${yaar_VERSION}.`);
  }
});
