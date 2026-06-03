# CodeLens

**AI-Powered Code Review for Multi-File Projects**

CodeLens is a full-stack developer tool that takes an uploaded project, builds a dependency graph across its files, and runs each group through Gemini to surface real bugs and security issues with exact file locations, severity labels, and suggested fixes.

A Monaco-based editor lets you click any finding and jump straight to the offending line.

---

## The Problem

Running an AI over a single file misses cross-file issues: a function called with the wrong signature in one module, an unsafe value flowing from an API handler into a database query in another, a missing import that only fails at runtime. Static linters catch syntax; they don't understand your project's dependency structure.

**Our approach:** Before calling the model, CodeLens parses every uploaded file's imports and builds a directed dependency graph. Files are then grouped by connectivity so that related code is always reviewed together. The AI receives the full dependency context alongside the source which dramatically reduces false positives and enabling cross-file bug detection that single-file review cannot do.

---

## Pipeline

| Stage | What happens |
|---|---|
| 1. Upload | User uploads a project folder; the browser reads every file as text |
| 2. Graph Construction | `graph.py` parses import statements with `ast` and builds a directed graph with `networkx` |
| 3. Grouping | Files are sorted by degree centrality and grouped so related files are reviewed together, capped at 12 000 characters per group to stay within model limits |
| 4. AI Review | Each group is sent to `gemini-2.5-flash` with a structured prompt that enforces JSON output: filename, line number, severity, category, message, and suggested fix |
| 5. Persistence | Results and graph summaries are stored in SQLite so past reviews are accessible from the sidebar |
| 6. Navigation | Clicking any finding in the right panel opens the correct file and scrolls the Monaco editor to the exact line |

---

## Project Structure

```
codelens/
|
|-- backend/
|   |-- app.py              Flask API: /review and /history endpoints
|   |-- graph.py            AST-based import parser, dependency graph builder, file grouper
|   |-- database.py         SQLite init, save_review, get_reviews
|   |-- .env                GEMINI_API_KEY (not committed)
|
|-- frontend/
|   |-- src/
|   |   |-- App.jsx         Main component: editor, file tree, issue panel, history
|   |-- index.html
|   |-- vite.config.js
|   |-- package.json
```

---

## Module Descriptions

### `backend/graph.py`

`extract_imports` walks a Python AST to collect every module name referenced by `import` and `from ... import` statements. `build_dependency_graph` creates a `networkx.DiGraph` where each uploaded file is a node and each detected local dependency is a directed edge. `group_files` sorts nodes by degree (most-connected first) and greedily builds groups that stay under the character budget, keeping dependent files together. `get_graph_summary` serialises the graph into human-readable lines that are passed as context to the model.

### `backend/app.py`

Two Flask endpoints. `/review` accepts a JSON payload with a `files` dict (filename → source) and a `language` string. It runs the graph pipeline, reviews each group, merges all comments, saves to the database, and returns findings plus the graph summary. `/history` returns all past reviews from the database.

`review_group` builds a prompt that includes the dependency context and the file sources, calls Gemini, strips any markdown fencing, and parses the response. It handles the edge case where Gemini returns a bare list instead of the expected `{"comments": [...]}` envelope.

### `backend/database.py`

Thin SQLite wrapper. `init_db` creates the `reviews` table on startup. `save_review` stores the project name, issue count, findings as JSON, and the graph summary. `get_reviews` returns all rows ordered by most recent, deserialising the JSON columns on the way out.

### `frontend/src/App.jsx`

Single-page React application. The left sidebar contains a file tree (with folder grouping, file-extension colour coding, and a history section that loads any past review). The centre panel is a Monaco editor with a tab bar and breadcrumb; clicking a finding opens the right file and calls `revealLineInCenter`. The right panel shows the review findings grouped by severity with collapsible sections, a summary bar showing bug and security counts, and a suggested fix block on each card. The top bar has language selection, project upload, export to `.txt`, and the review trigger button.

---

## Requirements

- Python 3.10+
- Node.js 18+
- A Gemini API key (free tier works fine for small projects)

---

## Setup

**1. Clone the repository**

```
git clone <your-repo-url>
cd codelens
```

**2. Backend**

```
cd backend
python -m venv venv
source venv/bin/activate        # Linux / Mac
venv\Scripts\activate           # Windows

pip install flask flask-cors python-dotenv google-genai networkx
```

Create a `.env` file in `backend/`:

```
GEMINI_API_KEY=your_key_here
```

Start the server:

```
python app.py
```

The API will be available at `http://localhost:5000`.

**3. Frontend**

```
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## How to Use

**Review a project**

Click `Upload Project` in the top bar and select a folder. The file tree on the left will populate. Select a language from the dropdown (Python, JavaScript, or C++), then click `Review Project`. The dependency graph appears at the bottom of the editor; findings appear in the right panel grouped by severity.

**Navigate to an issue**

Click any finding card. The editor opens the relevant file and scrolls to the exact line number.

**Export a report**

Once a review is complete, `Export Report` downloads a plain-text file with the dependency graph, all findings, and their suggested fixes.

**Review history**

Past reviews are listed in the left sidebar under HISTORY. Clicking any entry reloads its findings and graph summary without re-running the model.

---

## Supported Languages

The dependency graph currently parses Python imports using the `ast` module, which gives precise cross-file awareness for Python projects. JavaScript and C++ files can be uploaded and reviewed for single-file bugs and security issues; cross-file dependency tracking for those languages is a planned extension.

---

## Findings Format

Every issue returned by the model contains:

| Field | Description |
|---|---|
| `filename` | The file where the issue occurs |
| `line` | Line number |
| `severity` | `bug` or `security` |
| `category` | Short label (e.g. `Global State Management`, `SQL Injection`) |
| `message` | What is wrong |
| `fix` | A specific code-level recommendation |

CodeLens does not report style issues or minor quality suggestions. The prompt explicitly instructs the model to focus on correctness and security only.

---

## References

1. NetworkX — Hagberg, A., Swart, P., & Chult, D. (2008). Exploring network structure, dynamics, and function using NetworkX. SciPy Conference Proceedings.
2. Monaco Editor — the same editor that powers VS Code, embedded via `@monaco-editor/react`.
3. Gemini API — Google DeepMind. `gemini-2.5-flash` model via `google-genai` Python client.
