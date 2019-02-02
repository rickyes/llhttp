export default (binding) => {
  binding.llhttp__on_message_begin = (p, buf, off) => {
    const s = p.source;
    return s.onMessageBegin ? s.onMessageBegin() : 0;
  };

  binding.llhttp__on_url = (p, buf, off, offEnd) => {
    const s = p.source;
    return s.onURL ? s.onURL(buf, off, offEnd) : 0;
  };

  binding.llhttp__on_status = (p, buf, off, offEnd) => {
    const s = p.source;
    return s.onStatus ? s.onStatus(buf, off, offEnd) : 0;
  };

  binding.llhttp__on_header_field = (p, buf, off, offEnd) => {
    const s = p.source;
    return s.onHeaderField ? s.onHeaderField(buf, off, offEnd) : 0;
  };

  binding.llhttp__on_header_value = (p, buf, off, offEnd) => {
    const s = p.source;
    return s.onHeaderValue ? s.onHeaderValue(buf, off, offEnd) : 0;
  };

  binding.llhttp__on_headers_complete = (p, buf, off) => {
    const s = p.source;
    return s.onHeadersComplete ? s.onHeadersComplete() : 0;
  };

  binding.llhttp__on_message_complete = (p, buf, off) => {
    const s = p.source;
    return s.onMessageComplete ? s.onMessageComplete() : 0;
  };

  binding.llhttp__on_body = (p, buf, off, offEnd) => {
    const s = p.source;
    return s.onBody ? s.onBody(buf, off, offEnd) : 0;
  };

  binding.llhttp__on_chunk_header = (p, buf, off) => {
    const s = p.source;
    return s.onChunkHeader ? s.onChunkHeader() : 0;
  };

  binding.llhttp__on_chunk_complete = (p, buf, off) => {
    const s = p.source;
    return s.onChunkComplete ? s.onChunkComplete() : 0;
  };
};
