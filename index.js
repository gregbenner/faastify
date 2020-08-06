// Copyright (c) Alex Ellis 2017. All rights reserved.
// Copyright (c) OpenFaaS Author(s) 2020. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

"use strict";

const fastify = require("fastify")({
  logger: true,
});

const handler = require("./function/handler");

class FunctionEvent {
  constructor(req) {
    Object.assign(this, req);
  }
}

class FunctionContext {
  constructor(cb) {
    this.value = 200;
    this.cb = cb;
    this.headerValues = {};
    this.cbCalled = 0;
  }

  status(value) {
    return value ? this : this.value;
  }

  headers(value) {
    if (!value) {
      return this.headerValues;
    }

    this.headerValues = value;
    return this;
  }

  succeed(value) {
    let err;
    this.cbCalled++;
    this.cb(err, value);
  }

  fail(value) {
    let message;
    this.cbCalled++;
    this.cb(value, message);
  }
}

var middleware = async (req, res) => {
  let cb = (err, functionResult) => {
    if (err) {
      console.error(err);

      return res.status(500).send(err.toString ? err.toString() : err);
    }

    // if (isArray(functionResult) || isObject(functionResult)) {
    //   res
    //     .header(fnContext.headers())
    //     .status(fnContext.status())
    //     .send(JSON.stringify(functionResult));
    // } else {
    res
      .code(200)
      .header(fnContext.headers())
      // .header(fnContext.headers())
      .send(functionResult);
    // }
  };

  let fnEvent = new FunctionEvent(req);
  let fnContext = new FunctionContext(cb);

  Promise.resolve(handler(fnEvent, fnContext, cb))
    .then((res) => {
      if (!fnContext.cbCalled) {
        fnContext.succeed(res);
      }
    })
    .catch((e) => cb(e));
};

fastify.all("/*", middleware);
// fastify.get("/*", middleware);
// fastify.patch("/*", middleware);
// fastify.put("/*", middleware);
// fastify.delete("/*", middleware);

const port = process.env.http_port || 3000;

fastify.listen(port, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`server listening on ${port}`);
});

let isArray = (a) => Array.isArray(a);
// {
//   return !!a && a.constructor === Array;
// };

let isObject = (a) => {
  return !!a && a.constructor === Object;
};
