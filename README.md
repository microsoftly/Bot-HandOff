# bot-handoff [![CircleCI](https://circleci.com/gh/microsoftly/bot-handoff.svg?style=shield)](https://circleci.com/gh/microsoftly/bot-handoff) [![npm version](https://badge.fury.io/js/bot-handoff.svg)](https://badge.fury.io/js/bot-handoff) [![Coverage Status](https://coveralls.io/repos/github/microsoftly/bot-handoff/badge.svg?branch=master)](https://coveralls.io/github/microsoftly/bot-handoff?branch=master)


This project provides a framework called **bot-handoff**, which enables bot authors to implement several scenrios including, but not limited to a full fledged call center service, with minimal changes to the bot code

A demo is not included yet. Expect it down the line.

While the docs are being written, most questions can be answered by inpsecting the failry comprehensive tests.

Just an initial note: if you wish to have a data provider that is not in memory, you must implement the ```IProvider``` interface and pass the provider tests. Just add your implementation to ```provider.spec.ts```'s runner and run the suite or use the exported test runner from ```test/providerTests.ts```. If your provider passes all tests it will work as expected with the routing layer. If you wish to make your implementation public, please provide submit a PR and it will be reviewed.

# Usage
``` javascript
const builder = require('botbuilder');
const * as handoff= require('bot-handoff');


// this is how bot-handoff can tell who is and is not agents. This should be replaced with whatever business logic for determining agents is for your end. It can accept a promise for a return and wait for resolution before continuing execution
const isAgent = (session) => session.message.address.user.name === 'agent';
