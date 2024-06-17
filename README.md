# winston-mail-lite

[![Build and Test](https://github.com/sjinks/winston-mail-lite/actions/workflows/build.yml/badge.svg)](https://github.com/sjinks/winston-mail-lite/actions/workflows/build.yml)
![NPM](https://img.shields.io/npm/v/winston-mail-lite.svg)

Yet another email transport for [winston](https://github.com/flatiron/winston).

## Installation

```sh
$ npm install winston winston-mail-lite
```

## Usage

```js
const winston = require('winston');
const Mail = require('winston-mail-lite');

const transport = new Mail(options);
const logger = winston.createLogger({ transports: [transport] });
```

The Mail transport uses [nodemailer](https://nodemailer.com/) behind the scenes.

Options specific to `winston-mail-lite` are the following:
  * `transportOptions`: options passed to `createTransport()` ([for SMTP transport](https://nodemailer.com/smtp/), [for other transports](https://nodemailer.com/transports/)). By default, [JSON transport](https://nodemailer.com/transports/stream/#json-transport) is used.
  * `messageOptions`: options passed to [`transport.sendMail()`](https://nodemailer.com/message/). The most common options are:
    * `from`: email address of the sender; if nothing is provided, defaults to `winston@[server-host-name]`, where `server-host-name` is what `os.hostname()` returns;
    * `to`: email address of the recipient; this option is **required**;
    * `subject`: the subject of the email; defaults to `Winston Message`. Supports `{{ level }}` and `{{ message }}` placeholders (logs severity and the first line of the message respectively).

## Differences to winston-mail

`winston-mail-lite` was inspired by [winston-mail](https://github.com/wavded/winston-mail).

The key differences are:
  * `winston-mail-lite` has less dependencies;
  * uses `nodemailer` instead of [emailjs](https://github.com/eleith/emailjs);
  * has all of its dependencies up-to-date (winston-mail [depends on a package with a vulnerability](https://github.com/wavded/winston-mail/issues/51));
  * supports only winston >= 3;
  * has much more simplier codebase.
