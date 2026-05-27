from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
import os
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.route('/review', methods=['POST'])
def review():
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')

    if not code.strip():
        return jsonify({'error': 'No code provided'}), 400

    prompt = f"""You are a code reviewer. Review the following {language} code.

Return ONLY a JSON object in this exact format, nothing else, no markdown, no backticks, no explanation:
{{
  "comments": [
    {{
      "line": <line_number as integer>,
      "severity": "<bug|performance|security|style>",
      "category": "<short category>",
      "message": "<what is wrong and how to fix it>"
    }}
  ]
}}

Code to review:
{code}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        raw = response.text.strip()

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        result = json.loads(raw)
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({'error': 'Failed to parse AI response', 'raw': raw}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)