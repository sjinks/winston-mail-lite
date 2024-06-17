'use strict';

const { hostname } = require('node:os');
const { createTransport } = require('nodemailer');
const Transport = require('winston-transport');

module.exports =
/**
 * @class
 * @extends Transport
 */
class Mail extends Transport {
  /**
   * @callback FilterFunction
   * @param {Object} info
   * @param {string} info.level
   * @param {string} info.message
   * @returns {boolean}
   *
   * @param {Object} [options={}] Options for this instance
   * @param {Object} [options.transportOptions]
   * @param {Object} [options.messageOptions]
   * @param {string} [options.messageOptions.to]
   * @param {string} [options.messageOptions.from]
   * @param {string} [options.messageOptions.subject]
   * @param {FilterFunction} [options.messageOptions.filter]
   * @throws {Error} if options.messageOptions.to is empty or not set
   */
  constructor (options = {}) {
    const { messageOptions = {}, transportOptions = { jsonTransport: true }, ...winstonOptions } = options;
    super(winstonOptions);

    if (!messageOptions.to) {
      throw new Error("winston-mail-lite requires 'to' property");
    }

    /**
     * @member {object}
     * @private
     */
    this._transportOptions = transportOptions;

    /**
     * @member {Object} _messageOptions
     * @member {string} _messageOptions.to
     * @member {string} _messageOptions.from
     * @member {string} _messageOptions.subject
     * @member {FilterFunction} _messageOptions.filter
     * @private
     */
    this._messageOptions = {
      ...messageOptions,
      from: messageOptions.from ?? `winston@${hostname()}`,
      subject: messageOptions.subject ?? 'Winston Message',
      filter: messageOptions.filter ?? (() => true),
    };
  }

  /**
   * Core logging method exposed to Winston
   * 
   * @callback NextFunction
   * @returns {void}
   *
   * @param {Object} info
   * @param {string} info.level
   * @param {string} info.message
   * @param {NextFunction} next
   */
  log (info, next) {
    if (!this._messageOptions.filter(info)) {
      setImmediate(next);
      return;
    }

    const { level, message, ...meta } = info;

    /** @type {Object.<string,*>} messageOptions */
    const { filter, ...messageOptions } = { ...this._messageOptions }
    messageOptions.subject = messageOptions.subject.replace(/{{\s*level\s*}}/g, level).replace(/{{\s*message\s*}}/g, `${message}`.split('\n')[0]);
    messageOptions.text = meta[Symbol.for('message')];

    const transporter = createTransport(this._transportOptions);
    transporter.sendMail(
      messageOptions,
      /**
       * @fires Mail#error
       * @fires Mail#logged
       * @param {?Error} err
       * @param {Object} info
       */
      (err, info) => {
        setImmediate(next);
        if (err) {
          this.emit('error', err);
        } else {
          this.emit('logged', info);
        }
      }
    );
  }
};
