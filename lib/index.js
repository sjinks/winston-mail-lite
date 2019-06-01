'use strict';

const nodemailer = require('nodemailer');
const os = require('os');
const Transport = require('winston-transport');

module.exports =
/**
 * @class
 * @extends Transport
 */
class Mail extends Transport {
  /**
   * @param {!Object} [options={}] Options for this instance
   * @param {?Object} [options.transportOptions]
   * @param {!Object} options.messageOptions
   * @param {string}  options.messageOptions.to
   * @throws {Error} if options.messageOptions.to is empty or not set
   */
  constructor (options) {
    options = options || {};
    super(options);

    /**
     * @member {Object}
     * @private
     */
    this._transportOptions = options.transportOptions || { jsonTransport: true };

    /**
     * @member {Object} _messageOptions
     * @member {string} _messageOptions.to
     * @member {string} _messageOptions.from
     * @member {string} _messageOptions.subject
     * @private
     */
    this._messageOptions = options.messageOptions || {};

    if (!this._messageOptions.to) {
      throw new Error("winston-mail-lite requires 'to' property");
    }

    if (!this._messageOptions.from) {
      this._messageOptions.from = 'winston@' + os.hostname();
    }

    if (!this._messageOptions.subject) {
      this._messageOptions.subject = 'Winston Message';
    }
  }

  /**
   * Core logging method exposed to Winston
   *
   * @param {Object} info
   * @param {string} info.level
   * @param {string} info.message
   * @param {Function} callback
   */
  log (info, callback) {
    let { level, message, ...meta } = info;

    let subject = this._messageOptions.subject;
    if (subject.indexOf('{{') !== -1) {
      this._messageOptions.subject = subject.replace(/{{\s*level\s*}}/g, level).replace(/{{\s*message\s*}}/g, message.split('\n')[0]);
    }

    this._messageOptions.text = meta[Symbol.for('message')];

    const transporter = nodemailer.createTransport(this._transportOptions);
    transporter.sendMail(
      this._messageOptions,
      /**
       * @fires Mail#error
       * @fires Mail#logged
       * @param {?Error} err
       * @param {Object} info
       */
      (err, info, response) => {
        setImmediate(callback);
        if (err) {
          this.emit('error', err);
        } else {
          this.emit('logged', info);
        }
      }
    );
  }
};
