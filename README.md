# Open-Weavy

**Open-Weavy** is an open-source alternative to [Weavy.ai](https://weavy.ai) (acquired by Figma), designed to empower creators with "Artistic Intelligence". It features a node-based workflow editor for designing, editing, and composing AI-generated content with professional precision.

## Features

- **Node-Based Workflows**: Modular, reusable pipelines for generative AI (similar to Blender or ComfyUI).
- **Artistic Intelligence**: Bridge the gap between human creativity and AI automation.
- **Generative Media**: Integrated support for image and video generation powered by **MuAPI** (Vadoo AI).

## Project Structure

This project follows a hybrid monorepo structure:

```text
Open-Weavy/
├── client/              # Next.js frontend application
├── packages/
│   └── workflow-builder/ # Shared UI library (The core node editor)
└── server/              # FastAPI backend
```

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.8+)
- **npm** (v7+ for workspaces support)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/open-weavy.git
    cd open-weavy
    ```

2.  **Install dependencies** (from the root directory):
    ```bash
    npm install
    ```
    This command installs dependencies for the client, the library, and links them together via npm workspaces.

### Configuration (Important!)

This project uses **MuAPI** (Vadoo AI) for its generative AI capabilities. You need an API key to run workflows.

1.  **Get your API Key**:
    - Go to the [Vadoo AI / MuAPI Dashboard](https://muapi.ai).
    - Sign up or Log in.
    - Navigate to **API Keys** and generate a new key.

2.  **Configure the Backend**:
    - Navigate to the `server` directory.
    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```
    - Open `.env` and paste your API key:
      ```bash
      MU_API_KEY=your_actual_api_key_here
      ```

### Running the Project

We have provided convenient scripts in the root `package.json` to manage the project.

**1. Start the Frontend (Next.js)**
```bash
npm run dev:app
```
*The app will be available at [http://localhost:3000](http://localhost:3000)*

**2. Start the Backend (FastAPI)**
```bash
cd server
# Create virtual env if you haven't yet
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*The API will be available at [http://localhost:8000](http://localhost:8000)*

## Development

- **Library Development**: If you are working on the core node editor (`packages/workflow-builder`), you can rebuild it specifically:
  ```bash
  npm run build:lib
  ```
- **App Development**: The `client` app is set up to use the local version of the library. Changes in the library may require a rebuild `npm run build:lib` to be reflected if you are not using a watcher.

## Contributing

We welcome contributions to Open-Weavy! Please see `CONTRIBUTING.md` for details.

## License

MIT
