'use strict';

require('dotenv').config();
const fs = require('fs');
const util = require('util');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const appendFile = util.promisify(fs.appendFile);
const environments = ['production', 'demo', 'staging'];
const filePath = `evercheck-hosts-inventory-${Date.now()}.csv`;
const header = [
  'Number',
  'Hostame',
  'IP Address',
  'On Premise',
  'Hostgroup',
  'Environment',
  'Location',
]
  .join(',')
  .concat('\n');

async function start() {
  await appendFile(filePath, header, 'utf-8');

  for (const environment of environments) {
    console.log(`reading ${environment} inventory...`);
    const inventory = await readInventoryFromGithub(environment);
    const data = transformJsonToRow(inventory, environment);
    await writeDataOnFile(filePath, data);
  }

  return `That's it 🎉 Take a look at this file ${filePath}`;
}

function readInventoryFromGithub(environment = 'production') {
  return octokit.repos
    .getContent({
      owner: 'cebroker',
      repo: 'ec-deployments',
      path: `vars/${environment}/hosts.json`,
    })
    .then((result) => {
      const content = Buffer.from(result.data.content, 'base64').toString();
      return JSON.parse(content);
    });
}

function transformJsonToRow(inventory, environment) {
  const rows = [];
  let index = 0;

  for (const hostgroup in inventory[`${environment}_hosts`]) {
    const currentHosts = inventory[`${environment}_hosts`][hostgroup];

    for (const { ip, name } of currentHosts) {
      if (!ip) continue;

      ++index;
      const onPremise = ip.startsWith('ec2') ? 'Yes' : 'No';
      const location = getLocation(name);
      const line = [
        index,
        name,
        ip,
        onPremise,
        hostgroup,
        environment,
        location,
      ];
      rows.push(line.join(','));
    }
  }

  return rows;
}

function getLocation(hostname = '') {
  const locations = {
    jax: 'FLorida',
    bdu: 'Colorado',
    demo: 'Colorado',
    test: 'Cartagena',
    virginia: 'AWS Virginia',
    ohio: 'AWS Ohio',
    california: 'AWS California',
    oregon: 'AWS Oregon',
  };

  const name = hostname.toLowerCase();
  const splittedName = name.split('-');
  const location = splittedName[splittedName.length - 2];
  return locations[location] || 'Unknown';
}

function writeDataOnFile(filePath = 'export.csv', rows = []) {
  const data = rows.join('\n').concat('\n');
  return appendFile(filePath, data, 'utf8');
}

start()
  .then(console.log)
  .catch((error) => {
    console.error(error.message);
    console.trace(error.stack);
  });
