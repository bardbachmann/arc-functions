var session = require('../session').client(process.env.SESSION_TABLE_NAME || 'arc-sessions')

module.exports = function response(request, callback, cmds) {

  // ensure only valid command keys
  var allowed = ['location', 'session', 'json']
  Object.keys(cmds).forEach(k=> {
    if (!allowed.includes(k)) {
      throw Error(k + ' unknown key. Only location, session and json allowed')
    }
  })

  // ensure not both location and html
  var hasLocationAndJson = cmds.hasOwnProperty('location') && cmds.hasOwnProperty('json')
  if (hasLocationAndJson) {
    throw Error('Found location and json keys; only one is allowed')
  }
  // ensure one of location or json
  var hasOneOfLocationOrJson = cmds.hasOwnProperty('location') || cmds.hasOwnProperty('json')
  if (!hasOneOfLocationOrJson) {
    throw Error('response must have location or json')
  }

  var sesh = Object.assign(cmds.session || request.session, {_idx:request._idx})
  session.update(sesh, function _update(err) {
    if (err) {
      throw err
    }
    else {
      // write the session cookie
      cmds.cookie = `_idx=${request._idx}; httpOnly`

      // we need to hijack api gateway error to create a statusCode 302
      // not a real error mind you; but a string
      if (cmds.location) {
        callback(cmds.location)
      }
      else {
        callback(null, cmds)
      }
    }
  })
}
