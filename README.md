# inventory-report

Export a CSV report with all hosts managed by Ansible.

## Installation

1. Add a `.env` file at the root of the project with the following information

```ini
# env

GITHUB_TOKEN= # Use the github token that the ec-deployments project use. Check the shared.yml file
```

2. Install dependencies

```
$ npm i
```

## Usage

```
$ node index.js
```
