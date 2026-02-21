async function run() {
    try {
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password123' })
        });

        const loginData = await loginRes.json();

        if (!loginData.token) {
            console.error("Login failed:", loginData);

            // Try SuperAdmin
            const loginRes2 = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'SuperAdmin', password: 'password123' })
            });
            const loginData2 = await loginRes2.json();
            if (!loginData2.token) {
                console.error("SuperAdmin Login failed:", loginData2);
                return;
            }
            loginData.token = loginData2.token;
        }

        const lowStockRes = await fetch('http://localhost:3000/products/low-stock', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });

        const lowStockData = await lowStockRes.json();
        console.log("LOW STOCK:");
        console.table(lowStockData.map(p => ({
            name: p.name, stock: p.stock, alert_quantity: p.alert_quantity
        })));

        const salesRes = await fetch('http://localhost:3000/sales?limit=10', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });

        const salesData = await salesRes.json();
        console.log("RECENT SALES:");
        console.table(salesData.map(s => ({
            id: s.id, total: s.total, parentSaleId: s.parentSaleId
        })));

    } catch (e) {
        console.error(e);
    }
}
run();
