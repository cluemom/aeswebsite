// AES OAuth proxy — handles GitHub OAuth for Decap CMS
// Deploy this as a Render Web Service with GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET env vars

const http = require('http');
const https = require('https');
const url = require('url');

const CLIENT_ID     = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const PORT          = process.env.PORT || 3000;

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'text/html' }, headers || {}));
  res.end(body);
}

function postMessageHtml(status, content) {
  var payload = typeof content === 'string' ? content : JSON.stringify(content);
  var message = 'authorization:github:' + status + ':' + payload;
  return '<!DOCTYPE html><html><body><script>' +
    'window.opener.postMessage(' + JSON.stringify(message) + ', "*");' +
    'window.close();' +
    '</script></body></html>';
}

function githubPost(path, body, callback) {
  var data = JSON.stringify(body);
  var options = {
    hostname: 'github.com',
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };
  var req = https.request(options, function(res) {
    var raw = '';
    res.on('data', function(chunk) { raw += chunk; });
    res.on('end', function() {
      try { callback(null, JSON.parse(raw)); }
      catch(e) { callback(e); }
    });
  });
  req.on('error', callback);
  req.write(data);
  req.end();
}

var server = http.createServer(function(req, res) {
  var parsed = url.parse(req.url, true);
  var path   = parsed.pathname;

  // Health check
  if (path === '/') {
    return send(res, 200, 'AES OAuth proxy running');
  }

  // Step 1: Redirect to GitHub
  if (path === '/auth') {
    if (!CLIENT_ID) return send(res, 500, 'GITHUB_CLIENT_ID not set');
    var authUrl = 'https://github.com/login/oauth/authorize?client_id=' + CLIENT_ID + '&scope=repo&allow_signup=false';
    return send(res, 302, '', { Location: authUrl });
  }

  // Step 2: GitHub sends code here — exchange it for a token
  if (path === '/callback') {
    var code = parsed.query.code;
    if (!code) return send(res, 400, postMessageHtml('error', 'Missing code from GitHub'));
    if (!CLIENT_SECRET) return send(res, 500, postMessageHtml('error', 'GITHUB_CLIENT_SECRET not set'));

    githubPost('/login/oauth/access_token', {
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code:          code,
    }, function(err, data) {
      if (err || data.error) {
        return send(res, 200, postMessageHtml('error', (data && data.error_description) || 'OAuth exchange failed'));
      }
      send(res, 200, postMessageHtml('success', { token: data.access_token, provider: 'github' }));
    });
    return;
  }

  send(res, 404, 'Not found');
});

server.listen(PORT, function() {
  console.log('AES OAuth proxy listening on port ' + PORT);
});
