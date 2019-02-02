'use strict';

function unreachable() {
  throw new Error('Unreachable');
}

const binding = {};

require('./constants.js')(binding, false);
require('./http.js')(binding, false);
require('./callbacks.js')(binding, false);
const Parser = require('./llhttp.js')(binding);

const TYPE = binding.TYPE;
const FINISH = binding.FINISH;
const ERROR = binding.ERROR;
const METHODS = binding.METHODS;

const REV_ERROR = new Map();
for (const key of Object.keys(ERROR)) {
  REV_ERROR.set(ERROR[key], key);
}

const REV_METHODS = new Map();
for (const key of Object.keys(METHODS)) {
  REV_METHODS.set(METHODS[key], key);
}

class HTTPParser {
  constructor(type = 'both') {
    this._parser = new Parser();
    this._parser.source = this;

    if (type === 'request') {
      this._parser.type = TYPE.REQUEST;
    } else if (type === 'response') {
      this._parser.type = TYPE.RESPONSE;
    } else {
      this._parser.type = TYPE.BOTH;
    }

    // User callbacks:
    this.onMessageBegin = null;
    this.onURL = null;
    this.onStatus = null;
    this.onHeaderField = null;
    this.onHeaderValue = null;
    this.onHeadersComplete = null;
    this.onBody = null;
    this.onMessageComplete = null;
    this.onChunkHeader = null;
    this.onChunkComplete = null;
  }

  execute(data) {
    this._parser.execute(data);
  }

  finish() {
    // We're in an error state. Don't bother doing anything.
    if (this._parser.error !== 0) {
      return 0;
    }

    switch (this._parser.finish) {
      case FINISH.SAFE_WITH_CB:
        if (this.onMessageComplete !== null) {
          return this.onMessageComplete();
        }

      // FALLTHROUGH
      case FINISH.SAFE:
        return ERROR.OK;
      case FINISH.UNSAFE:
        this._parser.reason = 'Invalid EOF state';
        return ERROR.INVALID_EOF_STATE;
      default:
        unreachable();
    }
  }

  messageNeedsEOF() {
    return binding.llhttp_message_needs_eof(this._parser);
  }

  shouldKeepAlive() {
    return binding.llhttp_should_keep_alive(this._parser);
  };

  pause() {
    if (this._parser.error !== ERROR.OK) {
      return;
    }

    this._parser.error = ERROR.PAUSED;
    this._parser.reason = 'Paused';
  }

  resume() {
    if (this._parser.error !== ERROR.PAUSED) {
      return;
    }

    this._parser.error = 0;
  }

  resumeAfterUpgrade() {
    if (this._parser.error !== ERROR.PAUSED_UPGRADE) {
      return;
    }

    this._parser.error = 0;
  }

  get error() {
    return this._parser.error;
  }

  get errorReason() {
    return this._parser.reason;
  }

  set errorReason(value) {
    this._parser.reason = value;
  }

  get errorOff() {
    return this._parser.errorOff;
  }

  static errorName(code) {
    return REV_ERROR.get(code);
  }

  static methodName(code) {
    return REV_METHODS.get(code);
  }
}

HTTPParser.METHODS = Object.assign({}, METHODS);
HTTPParser.ERROR = Object.assign({}, ERROR);

module.exports = HTTPParser;
