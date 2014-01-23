/*! httperr 0.3.0 Original author Alan Plum <me@pluma.io>. Released into the Public Domain under the UNLICENSE. @preserve */
exports.createHttpError = createHttpError;
exports.HttpError = function HttpError(config) {
  if (!config) {
    config = {};
  } else if (typeof config === 'string') {
    config = {message: config};
  } else if (config instanceof Error) {
    config = {cause: config};
  }
  this.message = config.message;
  this.cause = config.cause;
  this.details = config.details;
};
exports.HttpError.prototype = Object.create(Error.prototype);

function createHttpError(status, title, init) {
  function HttpError(config) {
    var stack;
    if (!this || Object.getPrototypeOf(this) !== HttpError.prototype) {
      var self = new HttpError(config);
      stack = (new Error()).stack.split('\n');
      stack.splice(0, 2, self.toString());
      self.stack = stack.join('\n');
      return self;
    }
    exports.HttpError.call(this, config);
    if (typeof init === 'function') {
      init.call(this, config);
    }
    stack = (new Error()).stack.split('\n');
    stack.splice(0, 2, this.toString());
    if (this.cause) {
      if (this.cause.stack) {
        stack = stack.concat(
          ('from ' + this.cause.stack).split('\n').map(function(line) {
          return '    ' + line;
          })
        );
      } else {
        stack.push('    cause: ' + this.cause);
      }
    }
    this.stack = stack.join('\n');
  }
  var simpleTitle = simplify(title);
  HttpError.prototype = Object.create(exports.HttpError.prototype);
  HttpError.prototype.name = camelCase(simpleTitle);
  HttpError.prototype.code = ucUnderscore(simpleTitle);
  HttpError.prototype.title = title;
  HttpError.prototype.statusCode = status;
  return HttpError;
}

function simplify(str) {
  return str.replace(/^An?\s+|'/gi, '').replace(/-/g, ' ');
}

function ucUnderscore(str) {
  return str.replace(/\s+/g, '_').toUpperCase();
}

function camelCase(str) {
  return str.split(' ').map(titleCase).join('');
}

function lcFirst(str) {
  return str.slice(0, 1).toLowerCase() + str.slice(1);
}

function titleCase(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

function spread(fn) {
  return function(args) {
    return fn.apply(this, args);
  };
}

[
  [400, 'Bad Request'],
  [401, 'Unauthorized', function(config) {
    this.authenticate = config.authenticate;
  }],
  [402, 'Payment Required'],
  [403, 'Forbidden'],
  [404, 'Not Found'],
  [405, 'Method Not Allowed', function(config) {
    this.allowed = config.allowed;
  }],
  [406, 'Not Acceptable'],
  [407, 'Proxy Authentication Required', function(config) {
    this.proxyAuthenticate = config.proxyAuthenticate;
  }],
  [408, 'Request Timeout'],
  [409, 'Conflict'],
  [410, 'Gone'],
  [411, 'Length Required'],
  [412, 'Precondition Failed'],
  [413, 'Request Entity Too Large'],
  [414, 'Request URI Too Long'],
  [415, 'Unsupported Media Type'],
  [416, 'Requested Range Not Satisfiable', function(config) {
    this.contentRange = config.contentRange;
  }],
  [417, 'Expectation Failed'],
  [418, "I'm a Teapot"],
  [419, 'Authentication Timeout'],
  [420, 'Enhance Your Calm', function(config) {
    this.retryAfter = config.retryAfter;
  }],
  [422, 'Unprocessable Entity'],
  [423, 'Locked'],
  [424, 'Failed Dependency'],
  [424, 'Method Failure'],
  [425, 'Unordered Collection'],
  [426, 'Upgrade Required'],
  [428, 'Precondition Required'],
  [429, 'Too Many Requests', function(config) {
    this.retryAfter = config.retryAfter;
  }],
  [431, 'Request Header Fields Too Large'],
  [440, 'Login Timeout'],
  [444, 'No Response'],
  [449, 'Retry With', function(config) {
    this.parameters = config.parameters;
  }],
  [450, 'Blocked By Windows Parental Controls'],
  [451, 'Unavailable For Legal Reasons'],
  [451, 'Redirect', function(config) {
    this.location = config.location;
  }],
  [494, 'Request Header Too Large'],
  [495, 'Cert Error'],
  [496, 'No Cert'],
  [497, 'HTTP To HTTPS'],
  [499, 'Client Closed Request'],
  [500, 'Internal Server Error'],
  [501, 'Not Implemented'],
  [502, 'Bad Gateway'],
  [503, 'Service Unavailable', function(config) {
    this.retryAfter = config.retryAfter;
  }],
  [504, 'Gateway Timeout'],
  [505, 'HTTP Version Not Supported'],
  [506, 'Variant Also Negotiates'],
  [507, 'Insufficient Storage'],
  [508, 'Loop Detected'],
  [509, 'Bandwidth Limit Exceeded'],
  [510, 'Not Extended'],
  [511, 'Network Authentication Required'],
  [520, 'Origin Error'],
  [522, 'Connection Timed Out'],
  [523, 'Proxy Declined Request'],
  [524, 'A Timeout Occured'],
  [598, 'Network Read Timeout Error'],
  [599, 'Network Connect Timeout Error']
].forEach(spread(function(status, title, fn) {
  var HttpError = createHttpError(status, title, fn);
  var name = HttpError.prototype.name;
  var lcName = lcFirst(name);
  if (!exports[lcName]) {
    exports[lcName] = HttpError;
  }
  if (!exports[name]) {
    exports[name] = HttpError;
  }
  if (!exports[status]) {
    exports[status] = HttpError;
  }
}));
