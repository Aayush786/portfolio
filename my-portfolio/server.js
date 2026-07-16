const express = require('express');
const path = require('path');
const helmet = require('helmet');

const app = express();

// helmet sets a variety of security headers. here we explicitly configure
// the most important ones as per project requirements. you can tweak the
// directives for CSP or other policies as needed.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    // X-Frame-Options (defaults to "SAMEORIGIN")
    frameguard: { action: 'deny' },
    // prevents MIME sniffing
    noSniff: true,
    // HSTS: informs browsers to only use HTTPS for a year
    hsts: { maxAge: 31536000, includeSubDomains: true },
    // other helmet defaults are still applied
  })
);

// serve the build output
app.use(express.static(path.join(__dirname, 'build')));

// all remaining requests return the React app, so it can handle routing
// express 5 path-to-regexp has trouble with plain wildcards, use a regex
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
