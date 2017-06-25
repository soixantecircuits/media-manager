/*global test*/
'use strict'

var request = require('superagent')
var app = require('../')

test.beforeEach(async (t) => {
  t.context.agent = request.agent(app.start())
})

test.serial('client signup: without companyId', async (t) => {
  const data = t.context.user
  let res

  res = await t.context.agent
    .post('/api/v2/auth/signup/client')
    .send(data)
  t.falsy(res.error)
  t.is(res.status, 200, 'Signup ok')

  res = await t.context.agent
    .post('/api/v2/auth/login')
    .send({email: data.email, password: data.password})
  t.truthy(res.error)
  t.is(res.status, 400)
  t.is(res.error.text, 'user not activated')
})
