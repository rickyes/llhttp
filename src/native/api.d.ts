export type ParserType = 'request' | 'response' | 'both';
export type Input = Uint8Array;

export type DataCallback =
  (this: HTTPParser, data: Input, start: number, end: number) => number;
export type NotificationCallback = (this: HTTPParser) => number;

export default class HTTPParser {
  constructor(type?: ParserType);

  /** Parse full or partial request/response, invoking user callbacks along the
   * way.
   *
   * If any of `DataCallback` returns errno not equal to `HPE_OK` - the parsing
   * interrupts, and such errno is returned from `llhttp_execute()`. If
   * `ERROR.PAUSED` was used as a errno, the execution can be resumed with
   * `resume()` call.
   *
   * In a special case of CONNECT/Upgrade request/response
   * `ERROR.PAUSED_UPGRADE` is returned after fully parsing the
   * request/response. If the user wishes to continue parsing, they need to
   * invoke `resumeAfterUpgrade()`.
   *
   * NOTE: if this function ever returns a non-pause type error, it will
   * continue to return the same error upon each successive call.
   */
  public execute(data: Input): number;

  /** This method should be called when the other side has no further bytes to
   * send (e.g. shutdown of readable side of the TCP connection.)
   *
   * Requests without `Content-Length` and other messages might require treating
   * all incoming bytes as the part of the body, up to the last byte of the
   * connection. This method will invoke `onMessageComplete()` callback if the
   * request was terminated safely. Otherwise a error code would be returned.
   */
  public finish(): number;

  /** Returns `1` if the incoming message is parsed until the last byte, and has
   * to be completed by calling `finish()` on EOF
   */
  public messageNeedsEOF(): boolean;

  /** Returns `1` if there might be any other messages following the last that
   * was successfuly parsed.
   */
  public shouldKeepAlive(): boolean;

  /** Make further calls of `execute()` return `ERROR.PAUSED` and set
   * appropriate error reason.
   *
   * Important: do not call this from user callbacks! User callbacks must return
   * `ERROR.PAUSED` if pausing is required.
   */
  public pause();

  /** Might be called to resume the execution after the pause in user's
   * callback.
   *
   * See `execute()` above for details.
   *
   * Call this only if `execute()` returns `ERROR.PAUSED`.
   */
  public resume();

  /** Might be called to resume the execution after the pause in user'
   * callback.
   *
   * See `execute()` above for details.
   *
   * Call this only if `execute()` returns `ERROR.PAUSED_UPGRADE`
   */
  public resumeAfterUpgrade();

  /** Returns the last returned error */
  public get error(): number;

  /** Returns the verbal explanation of the last returned error.
   *
   * Note: User callback should set error reason when returning the error. See
   * `set errorReason()` for details.
   */
  public get errorReason(): string | undefined;

  /** Assign verbal description to the returned error. Must be called in user
   * callbacks right before returning the errno.
   *
   * Note: `ERROR.USER` error code might be useful in user callbacks.
   */
  public set errorReason(value: string);

  /** Returns the offset to the last parsed byte before the returned error. The
   * offset is relative to the `data` argument of `execute()`.
   *
   * Note: this method might be useful for counting the number of parsed bytes.
   */
  public get errorOff(): number;

  /** Returns textual name of error code */
  public static errorName(code: number): string | undefined;

  /** Returns textual name of HTTP method */
  public static methodName(code: number): string | undefined;

  // User callbacks
  public onURL: DataCallback;
  public onStatus: DataCallback;
  public onHeaderField: DataCallback;
  public onHeaderValue: DataCallback;
  public onBody: DataCallback;

  /** Possible return values 0, -1, `HPE_PAUSED` */
  public onMessageBegin: NotificationCallback;

  /** Possible return values:
   * 0  - Proceed normally
   * 1  - Assume that request/response has no body, and proceed to parsing the
   *      next message
   * 2  - Assume absence of body (as above) and make `llhttp_execute()` return
   *      `HPE_PAUSED_UPGRADE`
   * -1 - Error
   * `HPE_PAUSED`
   */
  public onHeadersComplete: NotificationCallback;

  /** Possible return values 0, -1, `HPE_PAUSED` */
  public onMessageComplete: NotificationCallback;

  /** When on_chunk_header is called, the current chunk length is stored
   * in parser->content_length.
   * Possible return values 0, -1, `HPE_PAUSED`
   */
  public onChunkHeader: NotificationCallback;
  public onChunkComplete: NotificationCallback;
}

export const METHODS: { [key: string]: number };
export const ERROR: { [key: string]: number };
