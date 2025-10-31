export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { topic, tone, numPeople } = req.body;

    // Validate input
    if (!topic || !tone || !numPeople) {
        return res.status(400).json({ error: 'Missing required fields: topic, tone, numPeople' });
    }

    if (numPeople < 2 || numPeople > 10) {
        return res.status(400).json({ error: 'Number of people must be between 2 and 10' });
    }

    // Get API key from environment variable
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API key not set' });
    }

    const prompt = `Create a ${tone} skit or short play based on the Bible topic: "${topic}".

The skit should:
- Be for ${numPeople} people (create ${numPeople} distinct characters)
- Have a ${tone} tone throughout
- Be approximately 2-3 minutes when performed
- Be appropriate for church or educational settings
- Include stage directions in [brackets]
- Be engaging and memorable

Format the script as follows:
- Start with a title
- List each character (e.g., "Character 1: [role description]")
- Write the script with character names in CAPS followed by their lines
- Include stage directions in [brackets]
- You may include a NARRATOR if needed

Example format:
TITLE: [Your Title Here]

CHARACTERS:
Character 1: [Role]
Character 2: [Role]

---

[Stage direction]

CHARACTER 1: Dialogue here.

CHARACTER 2: Response here.

[Stage direction]

Please write the complete skit now.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate script');
        }

        const data = await response.json();
        return res.status(200).json({ script: data.content[0].text });

    } catch (error) {
        console.error('Error generating script:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate script' });
    }
}
