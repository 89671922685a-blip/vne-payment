const express = require('express');
const app = express();

// ===== CORS =====
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());

// ===== ПРАВИЛЬНЫЙ ТОКЕН =====
const CRYPTOBOT_TOKEN = '632503:AA2f4N05VlExwtvXsvfWjMWSuEzw6FhqHaW';

const SUPABASE_URL = 'https://vynquymsxkbalctookdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bnF1eW1zeGtiYWxjdG9va2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODA5OTIsImV4cCI6MjEwNDQ1Njk5Mn0.pYzzqJvaFoMDBFJ08CnkVzzsHHtaAEN3be4zBEHBicE';

// ===== СОЗДАНИЕ ИНВОЙСА =====
app.post('/api/create-invoice', async (req, res) => {
    const { amount, user_id } = req.body;
    console.log(`📝 Создаём счёт: ${user_id} на ${amount} USDT`);
    
    try {
        const response = await fetch('https://pay.crypt.bot/api/createInvoice', {
            method: 'POST',
            headers: {
                'Crypto-Pay-API-Token': CRYPTOBOT_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                asset: 'USDT',
                amount: String(amount),
                payload: String(user_id),
                description: `Пополнение на ${amount} USDT`
            })
        });
        
        const data = await response.json();
        console.log('✅ Ответ CryptoBot:', JSON.stringify(data));
        
        if (data.ok) {
            res.json({ pay_url: data.result.pay_url });
        } else {
            res.status(400).json({ error: data.error || 'Ошибка CryptoBot' });
        }
    } catch(e) {
        console.error('❌ Ошибка:', e);
        res.status(500).json({ error: e.message });
    }
});

// ===== ВЕБХУК =====
app.post('/webhook', async (req, res) => {
    const data = req.body;
    console.log('📨 Вебхук:', JSON.stringify(data));
    
    if (data.update_type === 'invoice_paid') {
        const user_id = data.payload.payload;
        const amount = parseFloat(data.payload.amount);
        
        console.log(`💵 ${user_id} пополнил ${amount} USDT`);
        
        try {
            const getRes = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${user_id}&select=balance`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            const users = await getRes.json();
            
            if (users.length > 0) {
                const currentBalance = users[0].balance || 0;
                const newBalance = currentBalance + amount;
                
                await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${user_id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ balance: newBalance })
                });
                
                console.log(`✅ Баланс ${user_id}: ${currentBalance} → ${newBalance}`);
            }
        } catch(e) {
            console.error('❌ Ошибка начисления:', e);
        }
    }
    
    res.json({ ok: true });
});

app.get('/', (req, res) => res.send('VNE Payment Server 🚀'));
app.listen(process.env.PORT || 3000, () => console.log('Сервер запущен'));
