// Store the generated script and settings
let currentScript = null;
let currentCharacters = [];
let selectedCharacter = null;

// DOM elements
const inputSection = document.getElementById('input-section');
const scriptSection = document.getElementById('script-section');
const generateBtn = document.getElementById('generate-btn');
const backBtn = document.getElementById('back-btn');
const viewAllBtn = document.getElementById('view-all-btn');
const loading = document.getElementById('loading');
const characterSelector = document.getElementById('character-selector');
const scriptDisplay = document.getElementById('script-display');

// Load API key from localStorage
const apiKeyInput = document.getElementById('api-key');
const savedApiKey = localStorage.getItem('claudeApiKey');
if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
}

// Save API key to localStorage when changed
apiKeyInput.addEventListener('change', () => {
    localStorage.setItem('claudeApiKey', apiKeyInput.value);
});

// Generate button handler
generateBtn.addEventListener('click', async () => {
    const topic = document.getElementById('topic').value.trim();
    const tone = document.getElementById('tone').value;
    const numPeople = parseInt(document.getElementById('num-people').value);
    const apiKey = apiKeyInput.value.trim();

    // Validation
    if (!topic) {
        alert('Please enter a Bible verse, book, or theme');
        return;
    }

    if (!apiKey) {
        alert('Please enter your Claude API key');
        return;
    }

    if (numPeople < 2 || numPeople > 10) {
        alert('Number of people must be between 2 and 10');
        return;
    }

    // Show loading
    loading.classList.remove('hidden');
    generateBtn.disabled = true;

    try {
        const script = await generateScript(topic, tone, numPeople, apiKey);
        currentScript = script;
        displayScript();

        // Switch to script view
        inputSection.classList.remove('active');
        inputSection.classList.add('hidden');
        scriptSection.classList.remove('hidden');
        scriptSection.classList.add('active');
    } catch (error) {
        alert('Error generating script: ' + error.message);
        console.error(error);
    } finally {
        loading.classList.add('hidden');
        generateBtn.disabled = false;
    }
});

// Back button handler
backBtn.addEventListener('click', () => {
    scriptSection.classList.remove('active');
    scriptSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    inputSection.classList.add('active');
    selectedCharacter = null;
});

// View All button handler
viewAllBtn.addEventListener('click', () => {
    selectedCharacter = null;
    displayScript();

    // Update button states
    document.querySelectorAll('.character-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    viewAllBtn.classList.add('active');
});

// Generate script using Claude API
async function generateScript(topic, tone, numPeople, apiKey) {
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
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
    return parseScript(data.content[0].text);
}

// Parse the script from Claude's response
function parseScript(scriptText) {
    const lines = scriptText.split('\n');
    const script = {
        title: '',
        characters: [],
        lines: []
    };

    let inCharactersList = false;
    let characterCount = 1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Extract title
        if (line.startsWith('TITLE:')) {
            script.title = line.replace('TITLE:', '').trim();
            continue;
        }

        // Detect characters section
        if (line === 'CHARACTERS:' || line === 'Characters:') {
            inCharactersList = true;
            continue;
        }

        if (line === '---') {
            inCharactersList = false;
            continue;
        }

        // Parse characters
        if (inCharactersList && line) {
            const match = line.match(/^(Character \d+|Narrator|NARRATOR):?\s*(.+)/i);
            if (match) {
                const charName = match[1].toUpperCase();
                const description = match[2];
                script.characters.push({ name: charName, description, index: characterCount++ });
            }
            continue;
        }

        // Parse script lines
        if (!inCharactersList && line) {
            // Stage direction
            if (line.startsWith('[') && line.endsWith(']')) {
                script.lines.push({
                    type: 'stage-direction',
                    text: line
                });
            }
            // Character dialogue
            else {
                const match = line.match(/^([A-Z\s]+\d*):\s*(.+)/);
                if (match) {
                    const charName = match[1].trim();
                    const dialogue = match[2];

                    // Find or create character
                    let character = script.characters.find(c => c.name === charName);
                    if (!character) {
                        character = { name: charName, description: '', index: characterCount++ };
                        script.characters.push(character);
                    }

                    script.lines.push({
                        type: 'dialogue',
                        character: character,
                        text: dialogue
                    });
                }
            }
        }
    }

    return script;
}

// Display the script
function displayScript() {
    if (!currentScript) return;

    currentCharacters = currentScript.characters;

    // Create character selector buttons
    characterSelector.innerHTML = '';

    currentCharacters.forEach((character, index) => {
        const btn = document.createElement('button');
        btn.className = `character-btn character-${(index % 10) + 1}`;
        btn.textContent = character.name;
        btn.addEventListener('click', () => {
            selectedCharacter = character;
            displayScript();

            // Update button states
            document.querySelectorAll('.character-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            viewAllBtn.classList.remove('active');
        });
        characterSelector.appendChild(btn);
    });

    // Display script content
    let html = '';

    if (currentScript.title) {
        html += `<div class="script-title">${currentScript.title}</div>`;
    }

    currentScript.lines.forEach(line => {
        if (line.type === 'stage-direction') {
            const shouldShow = !selectedCharacter;
            if (shouldShow) {
                html += `<div class="stage-direction">${line.text}</div>`;
            }
        } else if (line.type === 'dialogue') {
            const isSelectedCharacter = selectedCharacter && line.character.name === selectedCharacter.name;
            const shouldHighlight = isSelectedCharacter;
            const shouldDim = selectedCharacter && !isSelectedCharacter;

            const colorClass = `character-${(line.character.index % 10) + 1}`;
            const highlightClass = shouldHighlight ? 'highlight' : '';
            const dimClass = shouldDim ? 'dimmed' : '';

            html += `
                <div class="script-line ${colorClass} ${highlightClass} ${dimClass}" style="border-color: var(--${colorClass})">
                    <div class="character-name" style="color: var(--${colorClass})">${line.character.name}</div>
                    <div class="dialogue">${line.text}</div>
                </div>
            `;
        }
    });

    scriptDisplay.innerHTML = html;
}
