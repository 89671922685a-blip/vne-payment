const express = require('express');
const app = express();
app.use(express.json());

const CRYPTOBOT_TOKEN = '632503:AAMnJQ0TXNS36XhcpPaFH7dE7r8jmr10pYs';

app.post('/api/create-invoice', async (req, res) => {
    const { amount, user_id } = req.body;
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
        res.json({ pay_url: data.result.pay_url });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/webhook', async (req, res) => {
    const data = req.body;
    if (data.update_type === 'invoice_paid') {
        const user_id = data.payload.payload;
        const amount = data.payload.amount;
        console.log(`💵 ${user_id} пополнил ${amount} USDT`);
    }
    res.json({ ok: true });
});

app.get('/', (req, res) => res.send('VNE Payment Server 🚀'));
app.listen(process.env.PORT || 3000, () => console.log('Сервер запущен'));
