'use strict';

module.exports = (binding, inBench) => {
  const HTTP_BOTH = binding.TYPE.BOTH;
  const HTTP_REQUEST = binding.TYPE.REQUEST;
  const HTTP_RESPONSE = binding.TYPE.RESPONSE;

  const HPE_PAUSED = binding.ERROR.PAUSED;

  // Override
  binding.LLPARSE__ERROR_PAUSE = HPE_PAUSED;

  const spans = [
    [ 'on_url', 'url' ],
    [ 'on_url_schema', 'url.schema' ],
    [ 'on_url_host', 'url.host' ],
    [ 'on_url_path', 'url.path' ],
    [ 'on_url_query', 'url.query' ],
    [ 'on_url_fragment', 'url.fragment' ],
    [ 'on_status', 'status' ],
    [ 'on_header_field', 'header_field' ],
    [ 'on_header_value', 'header_value' ],
    [ 'on_body', 'body' ],
  ];

  for (const [ name, label ] of spans) {
    binding[`llhttp__${name}`] = (p, buf, off, offLen) => {
      if (inBench)
        return 0;

      return binding.llparse__print_span(label, buf, off, offLen);
    };
  }

  binding.llhttp__test_init_request = (p) => {
    p.type = HTTP_REQUEST;
  };

  binding.llhttp__test_init_response = (p) => {
    p.type = HTTP_RESPONSE;
  };

  binding.llhttp__on_message_begin = inBench ? () => 0 : (_, buf, off) => {
    binding.llparse__print(off, 'message begin');
    return 0;
  };

  binding.llhttp__on_message_complete = inBench ? () => 0 : (_, buf, off) => {
    binding.llparse__print(off, 'message complete');
    return 0;
  };

  binding.llhttp__on_headers_complete = inBench ? () => 0 : (p, buf, off) => {
    if (p.type === HTTP_REQUEST) {
      binding.llparse__print(off,
          'headers complete method=%d v=%d/%d flags=%s content_length=%d',
          p.method, p.http_major, p.http_minor, p.flags.toString(16),
          Number(p.content_length));
    } else if (p.type === HTTP_RESPONSE) {
      binding.llparse__print(off,
          'headers complete status=%d v=%d/%d flags=%s content_length=%d',
          p.status_code, p.http_major, p.http_minor, p.flags.toString(16),
          Number(p.content_length));
    } else {
      binding.llparse__print(off, 'invalid headers complete');
    }
    return 0;
  };

  binding.llhttp__on_chunk_header = inBench ? () => 0 : (p, buf, off) => {
    binding.llparse__print(off, 'chunk header len=%d',
      Number(p.content_length));
    return 0;
  };

  binding.llhttp__on_chunk_complete = inBench ? () => 0 : (_, buf, off) => {
    binding.llparse__print(off, 'chunk complete');
    return 0;
  };
};
