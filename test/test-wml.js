const { doesNotThrow, equal, notEqual, ok, throws } = require('node:assert/strict');
const { hostname } = require('node:os');
const { describe, it } = require('node:test');
const { createLogger } = require('winston');
const Mail = require('../lib');

describe('MailTransport', () => {
  it('throws Error if messageOptions.to is not set', function () {
    throws(() => new Mail(), /winston-mail-lite requires 'to' property/);
  });

  it('basic functionality', () => {
    const message = '<Message Goes Here>';
    const recipient = 'test@example.com';
    const severity = 'error';

    const transport = new Mail({ messageOptions: { to: recipient } });
    const logger = createLogger({ transports: [transport] });

    return /** @type {Promise<void>} */(new Promise((resolve) => {
      transport.on('logged', (info) => {
        ok(info.envelope, 'envelope exists');
        ok(info.envelope.from, 'envelope has from');
        ok(info.envelope.to, 'envelope has to');
        ok(Array.isArray(info.envelope.to), 'envelope.to is array');
        equal(info.envelope.to.length, 1, 'there is only one recipient');
        equal(info.envelope.to[0], recipient, 'the recipient is ' + recipient);
        equal(info.envelope.from, 'winston@' + hostname(), 'sender address is as expected');
        ok(info.message, 'message exists');
        doesNotThrow(() => JSON.parse(info.message), 'message is valid JSON');
        const j = JSON.parse(info.message);
        equal(j.subject, 'Winston Message', 'subject is as expected');
        notEqual(j.text.indexOf(message), -1, 'email message contains logged message');
        resolve();
      });

      logger.log(severity, message);
    }));
  });

  it('check that log levels are handled correctly', (ctx, done) => {
    const transport = new Mail({ messageOptions: { to: 'test@example.com', from: 'winston@host' } });

    transport.on('logged', (info) => {
      equal(info.envelope.from, 'winston@host', 'sender address is as expected');
      doesNotThrow(() => JSON.parse(info.message), 'message is valid JSON');
      const j = JSON.parse(info.message);
      notEqual(j.text.indexOf('ZZZ'), -1, 'email message contains logged message');

      done();
    });

    let logger = createLogger({ transports: [transport], silent: true });
    logger.log({ level: 'info', message: 'XXX', meta: 1 });

    logger = createLogger({ transports: [transport] });
    transport.level = 'error';
    logger.log({ level: 'info', message: 'YYY', meta: 1 });

    logger = createLogger({ transports: [transport], level: 'info' });
    transport.level = 'info';
    logger.log({ level: 'info', message: 'ZZZ', meta: 1 });
  });

  it('check that email subject is formatted correctly', async function (ctx) {
    const transport = new Mail({ messageOptions: { to: 'test@example.com', subject: '{{ level }} {{ message }}' } });

    /**
     * @param {Mail} transport
     * @param {import('winston').Logger} logger
     * @param {string} level
     * @param {string} message
     * @param {string} expectedSubject
     */
    const logAndCheck = (transport, logger, level, message, expectedSubject) => {
      return new Promise((resolve) => {
        transport.once('logged', (info) => {
            doesNotThrow(() => JSON.parse(info.message), 'message is valid JSON');
            const j = JSON.parse(info.message);
            equal(j.subject, expectedSubject, 'subject is as expected');
            resolve(true);
        });

        logger.log({ level, message });
      });
    };

    const logger = createLogger({ transports: [transport] });
    await logAndCheck(transport, logger, 'info', 'Line 1\nLine 2', 'info Line 1');
    await logAndCheck(transport, logger, 'info', 'Line 1', 'info Line 1');
  });

  it('error event is emitted on log failure', () => {
    const transport = new Mail({ messageOptions: { to: 'test@example.com' }, transportOptions: { host: '127.0.0.255', port: 65535 } });
    const logger = createLogger({ transports: [transport] });

    return /** @type {Promise<void>} */(new Promise((resolve) => {
      logger.on('error', (e) => {
        ok(e);
        resolve();
      });

      logger.log({ level: 'info', message: 'Line 1\nLine 2' });
    }));
  });
});
