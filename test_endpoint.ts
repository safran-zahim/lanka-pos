
import fetch from 'node-fetch';

async function testEndpoint() {
    const url = 'http://localhost:3000/products/6/toggle-status';
    console.log(`Testing PATCH ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // Note: This request will likely fail with 401 Unauthorized because we don't have a token.
                // But getting 401 is BETTER than 404. 
                // 401 means "I found the route, but who are you?"
                // 404 means "I don't know this route" (or "Product not found" if reached controller)
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.status === 404) {
            const text = await response.text();
            console.log('Body:', text.substring(0, 200)); // Print first 200 chars to see if it's HTML
        } else if (response.status === 401) {
            console.log('SUCCESS: Route exists (received 401 Unauthorized as expected without token)');
        } else {
            const text = await response.text();
            console.log('Response:', text);
        }

    } catch (error) {
        console.error('Connection Failed:', error.message);
    }
}

testEndpoint();
