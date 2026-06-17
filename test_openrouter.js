const apiKey = "sk-or-v1-fakeAPIKEY";
const url = 'https://openrouter.ai/api/v1/chat/completions';
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'SEA Workshop Light'
};
fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: 'test' }],
        temperature: 1.0,
    })
}).then(async r => {
    console.log(r.status);
    console.log(await r.text());
}).catch(console.error);
