const test = require('tape');
const winston = require('winston');
const os = require('os');
const Mail = require('../lib/index');

test('throws Error if messageOptions.to is not set', function (t) {
  t.throws(function () {
    return new Mail();
  }, /winston-mail-lite requires 'to' property/);
  t.end();
});

test('basic functionality', function (t) {
  const message = '<Message Goes Here>';
  const recipient = 'test@example.com';
  const severity = 'error';

  const transport = new Mail({ messageOptions: { to: recipient } });
  const logger = winston.createLogger({ transports: [transport] });

  t.plan(1);

  transport.on('logged', function (info) {
    t.test('check that the message is as expected', function (t) {
      t.ok(info.envelope, 'envelope exists');
      t.ok(info.envelope.from, 'envelope has from');
      t.ok(info.envelope.to, 'envelope has to');
      t.ok(Array.isArray(info.envelope.to), 'envelope.to is array');
      t.equal(info.envelope.to.length, 1, 'there is only one recipient');
      t.equal(info.envelope.to[0], recipient, 'the recipient is ' + recipient);
      t.equal(info.envelope.from, 'winston@' + os.hostname(), 'sender address is as expected');
      t.ok(info.message, 'message exists');
      let j;
      t.doesNotThrow(() => { j = JSON.parse(info.message); }, 'message is valid JSON');
      t.equals(j.subject, 'Winston Message', 'subject is as expected');
      t.notEquals(j.text.indexOf(message), -1, 'email message contains logged message');
      t.end();
    });
  });

  logger.log(severity, message);
});

test('check that log levels are handled correctly', function (t) {
  t.plan(1);
  const transport = new Mail({ messageOptions: { to: 'test@example.com', from: 'winston@host' } });

  transport.on('logged', function (info) {
    t.test('check that the message is as expected', function (t) {
      t.equal(info.envelope.from, 'winston@host', 'sender address is as expected'); let j;
      t.doesNotThrow(() => { j = JSON.parse(info.message); }, 'message is valid JSON');
      t.notEquals(j.text.indexOf('ZZZ'), -1, 'email message contains logged message');
      t.end();
    });
  });

  let logger = winston.createLogger({ transports: [transport], silent: true });
  logger.log({ level: 'info', message: 'XXX', meta: 1 });

  logger = winston.createLogger({ transports: [transport] });
  transport.level = 'error';
  logger.log({ level: 'info', message: 'YYY', meta: 1 });

  logger = winston.createLogger({ transports: [transport], level: 'info' });
  transport.level = 'info';
  logger.log({ level: 'info', message: 'ZZZ', meta: 1 });
});

test('check that email subject is formatted correctly', function (t) {
  t.plan(2);
  const transport = new Mail({ messageOptions: { to: 'test@example.com', subject: '{{ level }} {{ message }}' } });

  transport.on('logged', function (info) {
    t.test('check that the message is as expected', function (t) {
      let j;
      t.doesNotThrow(() => { j = JSON.parse(info.message); }, 'message is valid JSON');
      t.equals(j.subject, 'info Line 1', 'subject is as expected');
      t.end();
    });
  });

  const logger = winston.createLogger({ transports: [transport] });
  logger.log({ level: 'info', message: 'Line 1\nLine 2' });
  logger.log({ level: 'info', message: 'Line 1' });
});

test('error event is emitted on log failure', function (t) {
  t.plan(1);
  const transport = new Mail({ messageOptions: { to: 'test@example.com' }, transportOptions: { host: '127.0.0.255', port: 65535 } });
  const logger = winston.createLogger({ transports: [transport] });

  logger.on('error', function (e) {
    t.ok(e);
  });

  logger.log({ level: 'info', message: 'Line 1\nLine 2' });
});
