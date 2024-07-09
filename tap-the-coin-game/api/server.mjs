import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import axios from 'axios';
import fs from 'fs';

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7279450171:AAHmLi6OE522zN08MXLW82vTKwBbK13_WpA';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

let users = {};

// Basic authentication middleware
function basicAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Unauthorized');
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
        return next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Unauthorized');
    }
}

// Serve static files from the dist directory
app.use(express.static(path.join(path.resolve(), 'dist')));

app.get('/admin', basicAuth, (req, res) => {
    res.sendFile(path.join(path.resolve(), 'dist', 'index.html'));
});

app.get('/admin/rewards', basicAuth, (req, res) => {
    fs.readFile(path.join(path.resolve(), 'api/rewards.json'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send({ error: 'Failed to read rewards file' });
        } else {
            res.send(JSON.parse(data));
        }
    });
});

app.post('/admin/rewards', basicAuth, (req, res) => {
    const newReward = req.body;
    fs.readFile(path.join(path.resolve(), 'api/rewards.json'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send({ error: 'Failed to read rewards file' });
        } else {
            const rewards = JSON.parse(data);
            rewards[newReward.type].push(newReward.item);
            fs.writeFile(path.join(path.resolve(), 'api/rewards.json'), JSON.stringify(rewards, null, 2), (err) => {
                if (err) {
                    res.status(500).send({ error: 'Failed to write rewards file' });
                } else {
                    res.send({ success: true });
                }
            });
        }
    });
});

app.post('/admin/rewards/delete', basicAuth, (req, res) => {
    const deleteReward = req.body;
    fs.readFile(path.join(path.resolve(), 'api/rewards.json'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send({ error: 'Failed to read rewards file' });
        } else {
            const rewards = JSON.parse(data);
            rewards[deleteReward.type] = rewards[deleteReward.type].filter(item => JSON.stringify(item) !== JSON.stringify(deleteReward.item));
            fs.writeFile(path.join(path.resolve(), 'api/rewards.json'), JSON.stringify(rewards, null, 2), (err) => {
                if (err) {
                    res.status(500).send({ error: 'Failed to write rewards file' });
                } else {
                    res.send({ success: true });
                }
            });
        }
    });
});

// Existing game routes...

app.post('/register', (req, res) => {
    const { userId, firstName, referrerId, isPremium } = req.body;
    if (!users[userId]) {
        users[userId] = { userId, firstName, coinBalance: 0, totalTaps: 0, league: 'Wood League', referredBy: referrerId, isPremium, friends: [], lastDailyChest: null, dailyChestDay: 1 };
        if (referrerId && users[referrerId]) {
            let referralBonus = isPremium ? 25000 : 2500;
            users[referrerId].coinBalance += referralBonus;
            users[referrerId].friends.push(userId);
            notifyUser(referrerId, `${firstName} has joined using your referral link! You have earned ${referralBonus} coins.`);
        }
    }
    res.send(users[userId]);
});

app.post('/update-score', (req, res) => {
    const { userId, coinBalance, totalTaps } = req.body;
    if (users[userId]) {
        users[userId].coinBalance = coinBalance;
        users[userId].totalTaps = totalTaps;
    }
    res.send(users[userId]);
});

app.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    if (users[userId]) {
        res.send(users[userId]);
    } else {
        res.status(404).send({ error: 'User not found' });
    }
});

app.get('/friends/:userId', (req, res) => {
    const { userId } = req.params;
    if (users[userId]) {
        const friends = users[userId].friends.map(friendId => users[friendId]);
        res.send(friends);
    } else {
        res.status(404).send({ error: 'User not found' });
    }
});

app.get('/rewards', (req, res) => {
    fs.readFile(path.join(path.resolve(), 'api/rewards.json'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send({ error: 'Failed to read rewards file' });
        } else {
            res.send(JSON.parse(data));
        }
    });
});

app.post('/api/telegram-webhook', (req, res) => {
    const message = req.body.message;
    if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text;

        if (text === '/start') {
            sendMessage(chatId, 'Welcome to the Tap the Coin Game! Click the button below to start playing.', [
                {
                    text: 'Play Game',
                    web_app: { url: 'https://cautious-octo-telegram.vercel.app/telegram-web-app' }
                }
            ]);
        } else {
            sendMessage(chatId, 'Unknown command. Please use /start to get the game link.');
        }
    }
    res.sendStatus(200);
});

function notifyUser(userId, message) {
    const user = users[userId];
    if (user) {
        const chatId = userId;
        sendMessage(chatId, message);
    }
}

function sendMessage(chatId, text, buttons = []) {
    const payload = {
        chat_id: chatId,
        text: text
    };

    if (buttons.length > 0) {
        payload.reply_markup = {
            inline_keyboard: [buttons]
        };
    }

    axios.post(`${TELEGRAM_API_URL}/sendMessage`, payload)
        .catch(error => {
            console.error('Error sending message:', error);
        });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Set Telegram webhook
    axios.get(`${TELEGRAM_API_URL}/setWebhook?url=https://cautious-octo-telegram.vercel.app/api/telegram-webhook`)
        .then(response => {
            console.log('Webhook set successfully:', response.data);
        })
        .catch(error => {
            console.error('Error setting webhook:', error.response.data);
        });
});

export default app;
