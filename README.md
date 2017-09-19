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

// bot is a UniversalBot from botbuilder
// in memory provider is the data layer with an in-memory only store.
// when more prebuilt providers are available and the module updated, they will be available from the prebuiltProviders directory
handoff.applyHandoffMiddleware(bot, isAgent, new handoff.prebuiltProviders.InMemoryProvider(), { shouldTranscribeMessages: false })

// due to the difficult way of expressing what this would look like in an emulator, it is recommended that you look at the tests (either handoffMessageEvents.spec.ts or AgentHandoff.spec.ts) a clear way on how to trigger events such as, but not limited to connecting to an agent
```
# Conceptual overview
bot-handoff is separated into 2 distinct layers:
## 1. **Data Provider**
The data provider gives a standard API through which conversation state can be stored and optionally transcribe messages. All data providers must pass every test run in providerTest.js.
### 1. **Agent/customer message router**
The agent/customer router layer handles routing messages from an agent to a customer. Additionally, it handles routing messages from a customer to either the bot or agent, depending on the conversation state stored in the data provider.
### 2. **Event message router**
The event message router acts as an interoperability protocol specifically built for/ontop of bots (think HTTP or SOAP being analagous to the event on top of TCP or UDP analagous to the routing of the event). 
#### ```EventMessage```s
```EventMessages``` represent an action that a customer or agent requests be performed. Consider it analagous to particular endpoint on a controller.

* There are six different event message types

    1. ```ConnectEventMessage``` initiates a connection between a customer and agent. It encodes the customer and agent addresses.
    2. ```DisconnectEventMessage``` initiates a disconnection between a customer and agent. It encodes the customer and agent addresses.
    3. ```QueueEventMessage``` puts the customer on a queue for an agent. Encodes only the customer address.
    4. ```DequeueEventMessage``` removes the customer from a queue for an agent. Encodes only the customer address.
    5. ```WatchEventMessage``` tells the message router to send messages to an agent for observance. This is distinctly different from an active connection. It encodes the customer and agent addresses.
    6. ```UnatchEventMessage``` tells the message router to no longer send messages to an agent for observance.  It encodes the customer and agent addresses.
* ```EventMessage```s can only originate from the customer or agent, never the bot. 
* If the resulting acction is successful ```EventSuccessHandler``` is called. Default success event handlers differ depending on the type of event occurred.
* If the resulting action fails, the the associated. ```EventFailureHandler``` will be called with the thrown error and source ```EventMessage```. By default, failure events are sent back to either the customer or agent that sent the message. 

# Options
the last parameter that applyHandoffMiddleware accepts are the options for the framework. They are all optional.
## ```shouldTranscribeMessages```
Defaults to true. If set to false, bot-handoff will not record messsages in a transcript
## ```eventHandlers``` event handler link goes hereish
There are six event handlers, one for each of the six event types. Each event handler conforms to the following schema
```javascript
{
    success: (bot, successeEventMessage) => {},
    failure: (bot, errorEventMessage) => {}
}
```
so together, the event handlers option follows the following structure
```javascript
{
    connect: { success, failure },
    disconnect: { success, failure },
    queue: { success, failure },
    dequeue: { success, failure },
    watch: { success, failure },
    unwatch: { success, failure }
}
```
When an event is triggered and its associated action occurs, it triggers the associated success or failure handler for the action event type. This allows for customizable actions in response to an event e.g. sending a ```you're now connected to an agent``` message to a customer after a successful connection has been established.

Each event handler has a default action:
* all failure actions default to sending an ErrorEventMessage with the source error (and stack) and event source that caused the error back to the originating source (customer or agent)
* **connect** default success: respond to customer ```you're now connected to an agent```
* **disconnect** default success: respond to customer ```you've disconnected from the agent```
* **queue**  default success: respond to customer ```you're all set to talk to an agent. One will be with you as soon as they become available```
* **dequeue** default success: respond to customer ```you're no longer in line for an agent```
* **watch** default success: no action
* **unwatch** default success: no action
## ```messageReceivedWhileWaitingHandler``` (bot, session, next) => {}
when a conversation is in a wait (queued) state, messages from a user go to the messageReceivedWhileWaitingHandler. This is where actions like responding __you are third in line to connect to an agent__ should occur.

MIT License
