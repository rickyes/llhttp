'use strict';

module.exports = (binding, inBench) => {
  const HTTP_BOTH = binding.TYPE.BOTH;
  const HTTP_REQUEST = binding.TYPE.REQUEST;
  const HTTP_RESPONSE = binding.TYPE.RESPONSE;

  const HTTP_CONNECT = binding.METHODS.CONNECT;

  const F_CONNECTION_KEEP_ALIVE = binding.FLAGS.CONNECTION_KEEP_ALIVE;
  const F_CONNECTION_CLOSE = binding.FLAGS.CONNECTION_CLOSE;
  const F_CONNECTION_UPGRADE = binding.FLAGS.CONNECTION_UPGRADE;
  const F_CHUNKED = binding.FLAGS.CHUNKED;
  const F_UPGRADE = binding.FLAGS.UPGRADE;
  const F_CONTENT_LENGTH = binding.FLAGS.CONTENT_LENGTH;
  const F_SKIPBODY = binding.FLAGS.SKIPBODY;

  const HTTP_FINISH_SAFE = binding.FINISH.SAFE;

  binding.llhttp__before_headers_complete = (parser, buf, off) => {
    /* Set this here so that on_headers_complete() callbacks can see it */
    if ((parser.flags & F_UPGRADE) &&
        (parser.flags & F_CONNECTION_UPGRADE)) {
      /* For responses, "Upgrade: foo" and "Connection: upgrade" are
       * mandatory only when it is a 101 Switching Protocols response,
       * otherwise it is purely informational, to announce support.
       */
      parser.upgrade =
          (parser.type == HTTP_REQUEST || parser.status_code == 101) ? 1 : 0;
    } else {
      parser.upgrade = (parser.method === HTTP_CONNECT) ? 1 : 0;
    }
    return 0;
  };

  /* Return values:
   * 0 - No body, `restart`, message_complete
   * 1 - CONNECT request, `restart`, message_complete, and pause
   * 2 - chunk_size_start
   * 3 - body_identity
   * 4 - body_identity_eof
   */
  binding.llhttp__after_headers_complete = (parser, buf, off) => {
    const hasBody = (parser.flags & F_CHUNKED) || parser.content_length > 0n;
    if (parser.upgrade && (parser.method === HTTP_CONNECT ||
                            (parser.flags & F_SKIPBODY) || !hasBody)) {
      /* Exit, the rest of the message is in a different protocol. */
      return 1;
    }

    if (parser.flags & F_SKIPBODY) {
      return 0;
    } else if (parser.flags & F_CHUNKED) {
      /* chunked encoding - ignore Content-Length header */
      return 2;
    } else {
      if (!(parser.flags & F_CONTENT_LENGTH)) {
        if (!llhttp_message_needs_eof(parser)) {
          /* Assume content-length 0 - read the next */
          return 0;
        } else {
          /* Read body until EOF */
          return 4;
        }
      } else if (parser.content_length === 0n) {
        /* Content-Length header given but zero: Content-Length: 0\r\n */
        return 0;
      } else {
        /* Content-Length header given and non-zero */
        return 3;
      }
    }
  }

  binding.llhttp__after_message_complete = (parser, buf, off) => {
    const should_keep_alive = llhttp_should_keep_alive(parser);
    parser.flags = 0;
    parser.finish = HTTP_FINISH_SAFE;

    /* NOTE: this is ignored in loose parsing mode */
    return should_keep_alive;
  };


  function llhttp_message_needs_eof(parser) {
    if (parser.type === HTTP_REQUEST) {
      return 0;
    }

    /* See RFC 2616 section 4.4 */
    if (parser.status_code / 100 == 1 || /* 1xx e.g. Continue */
        parser.status_code == 204 ||     /* No Content */
        parser.status_code == 304 ||     /* Not Modified */
        (parser.flags & F_SKIPBODY)) {     /* response to a HEAD request */
      return 0;
    }

    if (parser.flags & (F_CHUNKED | F_CONTENT_LENGTH)) {
      return 0;
    }

    return 1;
  }
  binding.llhttp_message_needs_eof = llhttp_message_needs_eof;


  function llhttp_should_keep_alive(parser) {
    if (parser.http_major > 0 && parser.http_minor > 0) {
      /* HTTP/1.1 */
      if (parser.flags & F_CONNECTION_CLOSE) {
        return 0;
      }
    } else {
      /* HTTP/1.0 or earlier */
      if (!(parser.flags & F_CONNECTION_KEEP_ALIVE)) {
        return 0;
      }
    }

    return !llhttp_message_needs_eof(parser);
  }
  binding.llhttp_should_keep_alive = llhttp_should_keep_alive;
};
