from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from graph import build_dependency_graph, group_files, get_graph_summary
from database import (
    init_db,
    save_review,
    get_reviews
)
import os
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
init_db()

def review_group(files_dict, language, graph_summary):
    code_block = ""
    for filename, source in files_dict.items():
        code_block += f"\n### File: {filename}\n{source}\n"

    graph_context = "\n".join(graph_summary) if graph_summary else "Single file."

    prompt = f"""You are reviewing a {language} project. Dependency structure:
{graph_context}
Review these files together.

Focus only on:
- Bugs
- Security issues

Consider both single-file and cross-file issues such as:
- Incorrect function calls
- Missing functions
- Type mismatches
- Unsafe data flow
- Dependency-related bugs
- Unhandled exceptions

For every issue, provide:
1. A concise explanation.
2. A specific fix recommendation.

Do not report style issues or minor code-quality suggestions.

Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{{"comments": [{{"filename": "<filename>", "line": <integer>, "severity": "<bug|security>", "category": "<short category>", "message": "<what is wrong>", "fix": "<specific fix>"}}]}}

Files:
{code_block}"""

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )

    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    parsed = json.loads(raw)
    # Gemini sometimes returns a bare list instead of {"comments": [...]}
    if isinstance(parsed, list):
        return {"comments": parsed}
    if "comments" not in parsed:
        # Try to find any list value in the dict
        for v in parsed.values():
            if isinstance(v, list):
                return {"comments": v}
        return {"comments": []}
    return parsed


@app.route('/review', methods=['POST'])
def review():
    data = request.json
    files = data.get('files', {})
    language = data.get('language', 'python')

    if not files:
        return jsonify({'error': 'No files provided'}), 400

    try:
        G = build_dependency_graph(files)
        graph_summary = get_graph_summary(G)
        groups = group_files(G, files)

        all_comments = []

        for group in groups:
            group_files_dict = {f: files[f] for f in group}
            result = review_group(
                group_files_dict,
                language,
                graph_summary
            )

            all_comments.extend(
                result.get('comments', [])
            )

        project_name = list(files.keys())[0]

        save_review(
            project_name,
            all_comments,
            graph_summary
        )

        return jsonify({
            'comments': all_comments,
            'graph': graph_summary,
            'groups': groups
        })

    except json.JSONDecodeError:
     return jsonify({'error': 'Failed to parse AI response'}), 500
    
    except Exception as e:
     import traceback
     traceback.print_exc()

     return jsonify({
        'error': str(e)
    }), 500

@app.route('/history', methods=['GET'])
def history():
    return jsonify(get_reviews())


if __name__ == '__main__':
    app.run(debug=False, port=5000)