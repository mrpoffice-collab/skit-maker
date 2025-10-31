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

    const { topic, audience, tone, comedyLevel, numPeople } = req.body;

    // Validate input
    if (!topic || !audience || !tone || !numPeople) {
        return res.status(400).json({ error: 'Missing required fields: topic, audience, tone, numPeople' });
    }

    if (numPeople < 2 || numPeople > 10) {
        return res.status(400).json({ error: 'Number of people must be between 2 and 10' });
    }

    // Get API key from environment variable
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API key not set' });
    }

    // Map audience to appropriate language and complexity
    const audienceGuidance = {
        'kids': 'young children (5-10 years old) - use simple vocabulary, short sentences, playful language, and fun concepts they can easily understand',
        'preteens': 'preteens (11-13 years old) - use age-appropriate vocabulary, relatable situations, and themes relevant to middle school experiences',
        'teens': 'teenagers (14-18 years old) - use contemporary language, address real-world challenges, and explore deeper themes relevant to high school experiences',
        'adults': 'adults - use sophisticated vocabulary, mature themes, and deeper theological concepts',
        'all-ages': 'a mixed audience of all ages - use clear language that children can understand but adults will also appreciate, with universal themes'
    };

    // Map comedy level to specific instructions
    const comedyGuidance = {
        'normal': '',
        'funny': 'Include clever wordplay, light humor, and a few good jokes.',
        'very-funny': 'Pack it with jokes, puns, funny observations, and comedic misunderstandings. Make the audience laugh frequently!',
        'hilarious': 'Go ALL OUT with comedy! Include rapid-fire jokes, slapstick moments, exaggerated reactions, running gags, perfect comedic timing, unexpected punchlines, and physical comedy opportunities. Make it absolutely hilarious!',
        'super-hilarious': 'MAXIMUM COMEDY MODE! This should be SIDE-SPLITTINGLY FUNNY! Include: outrageous puns, absurd situations, breaking the fourth wall, self-aware humor, meta jokes, ridiculous sound effects in stage directions, over-the-top character reactions, comedic callbacks, mistimed entrances, props being used wrong, characters finishing each other\'s sentences incorrectly, deadpan delivery moments, dramatic pauses for comedic effect, and unexpected plot twists that are funny. Every line should aim for a laugh. Make the audience cry from laughing so hard! Think SNL meets Monty Python meets improv comedy!'
    };

    let comedyInstruction = '';
    if (tone === 'humorous' && comedyLevel && comedyGuidance[comedyLevel]) {
        comedyInstruction = comedyGuidance[comedyLevel];
    }

    const prompt = `Create a ${tone} skit or short play based on the Bible topic: "${topic}".

${comedyInstruction ? `COMEDY INSTRUCTIONS: ${comedyInstruction}\n` : ''}

The skit should:
- Be designed for ${audienceGuidance[audience]}
- Be for ${numPeople} people (create ${numPeople} distinct characters)
- Have a ${tone} tone throughout
- Be approximately 2-3 minutes when performed
- Be appropriate for church or educational settings
- Include stage directions in [brackets]
- Be engaging and memorable
- Match the vocabulary, humor, and complexity to the ${audience} audience level

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
                model: 'claude-sonnet-4-20250514',
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
