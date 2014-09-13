/*! httperr 1.0.0 Original author Alan Plum <me@pluma.io>. Released into the Public Domain under the UNLICENSE. @preserve */
"use strict";
var inherits = require('util').inherits;

exports.HttpError = HttpError;
exports.createHttpError = createHttpError;
exports.errorToObject = toObject;

function toObject(err, skip) {
  var self = err;
  var obj = {};
  var chain = [];
  while (self instanceof Error) {
    chain.push(self);
    self = Object.getPrototypeOf(self);
  }
  while (chain.length) {
    self = chain.pop();
    Object.keys(self).forEach(copyKey(self, obj, skip));
  }
  if (!obj.message && err.message) obj.message = err.message;
  if (!obj.name) obj.name = err.name || err.constructor.name;
  return obj;
}

function copyKey(src, dest, skip) {
  return function (key) {
    var value = src[key];
    if (skip) {
      if (!Array.isArray(skip)) skip = [skip];
      if (skip.some(function (skip) {
        if (typeof skip === 'string' && key === skip) return true;
        if (skip instanceof RegExp && skip.test(key)) return true;
        return false;
      })) return;
    }
    if (skip && key === 'stack') return;
    if (value === undefined) return;
    if (value instanceof Error) {
      dest[key] = toObject(value, skip);
    } else if (typeof value !== 'function') {
      dest[key] = value;
    }
  };
}

function HttpError(config, extra) {
  if (extra && typeof extra === 'object') {
    Object.keys(extra).forEach(function (key) {
      this[key] = extra[key];
    }.bind(this));
  }
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
}
inherits(HttpError, Error);
HttpError.prototype.toObject = function () {
  return toObject(this, Array.prototype.slice.call(arguments));
};

function createHttpError(status, title, init) {
  /*jshint unused: false */
  function _init(self, config, extra, err) {
    HttpError.call(self, config, extra);
    if (typeof init === 'function') {
      init.call(self, config);
    }
    err.name = self.name;
    err.message = self.message;
    self.stack = err.stack || '';
    if (self.stack) {
      var stack = self.stack.split('\n');
      if (self.cause) {
        if (self.cause.stack) {
          stack = stack.concat(
            ('from ' + self.cause.stack).split('\n').map(indent)
          );
        } else {
          stack.push(indent('cause: ' + self.cause));
        }
      }
      self.stack = stack.join('\n');
    }
  }
  var simpleTitle = simplify(title);
  var name = camelCase(simpleTitle);
  /*jshint evil: true */
  var Ctor = eval(
    '(function () {\n'
    + '  "use strict";\n'
    + '  function ' + name + '(config, extra) {\n'
    + '    var self = this;'
    + '    if (!self || !(self instanceof ' + name + ')) {\n'
    + '      self = new ' + name + '(config, extra);\n'
    + '    }\n'
    + '    _init(self, config, extra, new Error());\n'
    + '    return self;\n'
    + '  }\n'
    + '  return ' + name + ';\n'
    + '}());'
  );
  inherits(Ctor, HttpError);
  Ctor.prototype.name = name;
  Ctor.prototype.code = ucUnderscore(simpleTitle);
  Ctor.prototype.title = title;
  Ctor.prototype.statusCode = status;
  Ctor.statusCode = status;
  return Ctor;
}

function indent(str) {
  return '    ' + str;
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
  return function (args) {
    return fn.apply(this, args);
  };
}

[
  [400, 'Bad Request'],
  [401, 'Unauthorized', function (config) {
    this.authenticate = config.authenticate;
  }],
  [402, 'Payment Required'],
  [403, 'Forbidden'],
  [404, 'Not Found'],
  [405, 'Method Not Allowed', function (config) {
    this.allowed = config.allowed;
  }],
  [406, 'Not Acceptable'],
  [407, 'Proxy Authentication Required', function (config) {
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
  [416, 'Requested Range Not Satisfiable', function (config) {
    this.contentRange = config.contentRange;
  }],
  [417, 'Expectation Failed'],
  [418, 'I\'m a Teapot'],
  [419, 'Authentication Timeout'],
  [420, 'Enhance Your Calm', function (config) {
    this.retryAfter = config.retryAfter;
  }],
  [422, 'Unprocessable Entity'],
  [423, 'Locked'],
  [424, 'Method Failure'],
  [424, 'Failed Dependency'],
  [425, 'Unordered Collection'],
  [426, 'Upgrade Required'],
  [428, 'Precondition Required'],
  [429, 'Too Many Requests', function (config) {
    this.retryAfter = config.retryAfter;
  }],
  [431, 'Request Header Fields Too Large'],
  [440, 'Login Timeout'],
  [444, 'No Response'],
  [449, 'Retry With', function (config) {
    this.parameters = config.parameters;
  }],
  [450, 'Blocked By Windows Parental Controls'],
  [451, 'Redirect', function (config) {
    this.location = config.location;
  }],
  [451, 'Unavailable For Legal Reasons'],
  [494, 'Request Header Too Large'],
  [495, 'Cert Error'],
  [496, 'No Cert'],
  [497, 'HTTP To HTTPS'],
  [499, 'Client Closed Request'],
  [500, 'Internal Server Error'],
  [501, 'Not Implemented'],
  [502, 'Bad Gateway'],
  [503, 'Service Unavailable', function (config) {
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
].forEach(spread(function (status, title, fn) {
  var HttpError = createHttpError(status, title, fn);
  var name = HttpError.prototype.name;
  var lcName = lcFirst(name);
  exports[lcName] = HttpError;
  exports[name] = HttpError;
  exports[status] = HttpError;
}));
