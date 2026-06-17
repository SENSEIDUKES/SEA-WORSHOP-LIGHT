const url = 'https://openrouter.ai/api/v1/chat/completions';
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer sk-or-v1-fake`, // Using fake to see if we get 401 instead of 400
};
fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: 'test' }],
        temperature: 1.2,
    })
}).then(async r => {
    console.log("Status:", r.status);
    console.log("Body:", await r.text());
}).catch(console.error);
