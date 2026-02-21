// Quick test to verify subcategory API endpoints
const http = require('http');

const API_URL = 'http://localhost:3000/api';
let token = '';

async function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: async () => JSON.parse(data),
                    text: async () => data
                });
            });
        });

        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function login() {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'SuperAdmin', password: 'admin123' })
    });
    const data = await response.json();
    token = data.token;
    console.log('✓ Logged in successfully');
}

async function testCategories() {
    const response = await fetch(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('\n✓ Categories loaded:', data.length);
    console.log('Categories with subcategories:', data.map(c => ({
        name: c.name,
        subCount: c.subCategories?.length || 0
    })));
    return data;
}

async function testCreateSubcategory(categoryId) {
    console.log('\n▶ Creating test subcategory...');
    const response = await fetch(`${API_URL}/categories/subcategories`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
            name: 'Test Subcategory ' + Date.now(),
            categoryId: categoryId
        })
    });
    
    if (!response.ok) {
        const error = await response.text();
        console.error('✗ Failed to create subcategory:', error);
        return null;
    }
    
    const data = await response.json();
    console.log('✓ Subcategory created:', data);
    return data;
}

async function testGetSubcategories() {
    const response = await fetch(`${API_URL}/categories/subcategories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('\n✓ All subcategories:', data.length);
    data.forEach(sub => console.log(`  - ${sub.name} (Category: ${sub.categoryId})`));
}

async function runTests() {
    try {
        await login();
        const categories = await testCategories();
        
        if (categories.length > 0) {
            const firstCategory = categories[0];
            console.log(`\n▶ Testing with category: ${firstCategory.name} (${firstCategory.id})`);
            await testCreateSubcategory(firstCategory.id);
            await testGetSubcategories();
            await testCategories(); // Check if it now includes the subcategory
        } else {
            console.log('\n⚠ No categories found. Please create a category first.');
        }
        
        console.log('\n✓ All tests completed!');
    } catch (error) {
        console.error('\n✗ Test failed:', error.message);
    }
}

runTests();
