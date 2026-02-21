
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/products/6/toggle-status',
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log(`Testing PATCH http://localhost:3000/products/6/toggle-status...`);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode} ${res.statusMessage}`);
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        // Print first 200 chars to avoid flooding if HTML
        console.log('BODY:', data.substring(0, 200));
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
