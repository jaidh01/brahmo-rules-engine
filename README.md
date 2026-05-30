# BRAHMO Rules Engine — BFS + 5-Check Filter Pipeline

A deterministic knowledge graph filtering system that traverses a DAG of clinical knowledge nodes and applies 5 sequential checks to produce a permission-aware candidate set for any user — with **zero LLM involvement**.

## Stack
- **Backend:** Python 3.11 + FastAPI
- **Database:** Supabase (PostgreSQL)
- **Frontend:** Next.js + React + Tailwind CSS + Recharts

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/jaidh01/brahmo-rules-engine.git
cd brahmo-rules-engine
```

### 2. Backend
```bash
python -m venv brahmo-rules-engine
# Windows:
.\brahmo-rules-engine\Scripts\activate
# Mac/Linux:
source brahmo-rules-engine/bin/activate

pip install fastapi uvicorn supabase python-dotenv

cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_KEY from your Supabase project → Settings → API
```

### 3. Supabase
1. Create a free project at supabase.com
2. Open SQL Editor → run `supabase/schema.sql`
3. Run `supabase/seed.sql`
4. Verify: `SELECT COUNT(*) FROM knowledge_nodes` → 50

### 4. Start backend
```bash
cd backend
uvicorn main:app --reload --port 7000
```

### 5. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Demo
- Select any user from the dropdown and click **Run Pipeline**
- Switch between users to see different candidate sets from the same graph
- Click **Compare Users** for side-by-side comparison with access matrix
- Use **+ Add User** to add a new user and run the pipeline on them live

## Tests
```bash
cd backend
python tests/test_bfs.py
python tests/test_five_checks.py
python tests/test_pipeline.py   # requires uvicorn running
```

## Project Structure
```
brahmo-rules-engine/
├── backend/
│   ├── main.py                        # FastAPI app + pipeline orchestration
│   ├── pipeline/
│   │   ├── permission_compiler.py     # O(1) permission lookup
│   │   ├── entry_point_resolver.py    # Maps user dept → DAG leaf node
│   │   ├── bfs_traversal.py           # Upward DAG traversal
│   │   ├── zone2_injector.py          # Global node injection
│   │   ├── five_check_filter.py       # Sequential 5-check filter
│   │   └── candidate_assembler.py     # Annotates final candidate set
│   ├── models/                        # Pydantic type definitions
│   └── tests/                         # Unit + integration tests
├── frontend/                          # Next.js React UI
├── supabase/                          # Schema + seed SQL
├── docs/architecture.md               # Design decisions
└── data_sources.md                    # Clinical data sources
```