# Morph3D-Prototype-KylianAlgoet

A web-based tool that generates 3D models from text prompts using AI. Morph3D leverages Tripo AI for model generation and OpenAI GPT-3.5 for prompt enhancement, wrapped in a modern neon-inspired user interface.


Up & running 🏃‍➡️
Follow these steps to run the project locally:

1. Clone the repository
git clone https://github.com/KylianAlgoet/Morph3D-Prototype-KylianAlgoet.git

2. Install dependencies
npm install

3. Configure environment variables
Create a .env file in the root directory with the following content:
TRIPO_API_KEY=your_tripo_api_key
OPENAI_API_KEY=your_openai_api_key
You can obtain free API keys at Tripo AI(https://www.tripo3d.ai/api) and OpenAI(https://platform.openai.com/docs/overview).

4. Start the backend server
npm run backend
(or node server.js if using a custom script)

5. Start the frontend
npm run dev
The application will be available at http://localhost:5173


Features
AI-powered prompt enhancement (English only, via GPT-3.5)

Dynamic style selection (cartoon, clay, steampunk, gold, and more)

Neon-themed loading animation and progress bar

Interactive 3D model viewer (Three.js)

Download generated models as .glb files

Responsive and accessible design


Sources
https://www.tripo3d.ai/api – text-to-3D model generation
https://platform.openai.com/docs/overview -  prompt enhancement
https://threejs.org/docs/#examples/en/loaders/GLTFLoader - loading and rendering 3D models
https://threejs.org/docs/#examples/en/controls/OrbitControls - Used for rendering and displaying 3D .glb models in the browser
https://css-tricks.com/how-to-create-neon-text-with-css/ -  inspiration for neon UI elements
https://www.w3schools.com/howto/howto_custom_select.asp - base logic for the custom style dropdown
https://vite.dev/guide/ - Used for fast, modern web development and hot reloading
https://expressjs.com/en/starter/installing.html - Used for creating the backend API proxy server
https://www.npmjs.com/package/node-fetch - Used for making server-side HTTP requests to Tripo and OpenAI APIs
https://chatgpt.com/share/6827a2be-51b8-800d-b0c8-0565e045ad96 - (env) in een Node.js applicatie
https://chatgpt.com/share/6827a331-0b1c-800d-ac5a-6bc5e386465b -  express API endpoint
https://chatgpt.com/share/6827a3c1-2c40-800d-a42a-32ce09153990 - Three.js 3D canvas op met antialiasing en lighting
https://chatgpt.com/share/6827a44c-4dc8-800d-923d-65cbdb1afe95 - auto-grow textarea javascript

