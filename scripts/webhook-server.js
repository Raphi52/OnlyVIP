const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET;
const DEPLOY_SCRIPT = '/app/deploy.sh';

function verifySignature(payload, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function deploy() {
  console.log(`[${new Date().toISOString()}] Starting deployment...`);

  exec(`bash ${DEPLOY_SCRIPT}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] Deploy error:`, error.message);
      return;
    }
    if (stderr) {
      console.error(`[${new Date().toISOString()}] Deploy stderr:`, stderr);
    }
    console.log(`[${new Date().toISOString()}] Deploy output:`, stdout);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];

      // Verify GitHub signature
      if (!verifySignature(body, signature)) {
        console.log(`[${new Date().toISOString()}] Invalid signature`);
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      try {
        const payload = JSON.parse(body);

        // Only deploy on push to main
        if (payload.ref === 'refs/heads/main') {
          console.log(`[${new Date().toISOString()}] Push to main detected, deploying...`);
          res.writeHead(200);
          res.end('Deploying...');
          deploy();
        } else {
          console.log(`[${new Date().toISOString()}] Push to ${payload.ref}, ignoring`);
          res.writeHead(200);
          res.end('Ignored (not main branch)');
        }
      } catch (e) {
        console.error(`[${new Date().toISOString()}] Parse error:`, e.message);
        res.writeHead(400);
        res.end('Bad request');
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Webhook server listening on port ${PORT}`);
});
