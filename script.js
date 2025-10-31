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

// Generate button handler
generateBtn.addEventListener('click', async () => {
    const topic = document.getElementById('topic').value.trim();
    const tone = document.getElementById('tone').value;
    const numPeople = parseInt(document.getElementById('num-people').value);

    // Validation
    if (!topic) {
        alert('Please enter a Bible verse, book, or theme');
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
        const script = await generateScript(topic, tone, numPeople);
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

// Generate script using our serverless API
async function generateScript(topic, tone, numPeople) {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            topic,
            tone,
            numPeople
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate script');
    }

    const data = await response.json();
    return parseScript(data.script);
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
