const http = require('http');

http.get('http://localhost:3000/products/low-stock', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        try {
            console.log("Status:", res.statusCode);
            if (res.statusCode === 200) {
                const parsed = JSON.parse(data);
                console.log(JSON.stringify(parsed.map(p => ({ name: p.name, stock: p.stock, alertLevel: p.alert_quantity })), null, 2));
            } else {
                console.log(data);
            }
        } catch (e) { console.error('Parse error'); }
    });
});
