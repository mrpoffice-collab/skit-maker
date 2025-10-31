# Bible Skit Maker

A web app that generates custom Bible-based skits using AI. Perfect for church groups, youth programs, and educational settings.

## Features

- **Custom Script Generation**: Enter any Bible verse, book, or theme
- **Tone Selection**: Choose from humorous, serious, sad, inspirational, or dramatic
- **Flexible Cast Size**: Generate scripts for 2-10 people
- **Color-Coded Characters**: Each character gets a unique color for easy reading
- **Individual Character Views**: Actors can view only their lines on their phones
- **Mobile-Friendly**: Responsive design works great on all devices

## How to Use

1. Visit the deployed app
2. Enter your desired Bible topic (e.g., "Adam and Eve", "The Good Samaritan")
3. Select the tone and number of actors
4. Click "Generate Skit" and wait for AI to create your script
5. Share the URL with your cast members
6. Each person can click their character name to see their lines highlighted

## Tech Stack

- HTML/CSS/JavaScript (Frontend)
- Vercel Serverless Functions (Backend API)
- Claude AI API (Anthropic)
- Deployed on Vercel

## Deployment to Vercel

### Initial Setup

1. Fork or clone this repository to your GitHub account
2. Go to [Vercel](https://vercel.com) and sign in with GitHub
3. Click "Add New Project" and import your repository
4. Add environment variable:
   - Key: `CLAUDE_API_KEY`
   - Value: Your Claude API key from [Anthropic Console](https://console.anthropic.com/)
5. Click "Deploy"

### Updating

Push changes to your main branch and Vercel will automatically redeploy.

## Local Development

1. Clone the repository
2. Create a `.env` file (copy from `.env.example`)
3. Add your Claude API key to `.env`
4. Install Vercel CLI: `npm i -g vercel`
5. Run `vercel dev` to start local development server
6. Open `http://localhost:3000` in your browser

## Environment Variables

Required environment variable for deployment:

- `CLAUDE_API_KEY`: Your Anthropic Claude API key

## License

MIT
