import sqlite3
import json

DB_NAME = "reviews.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)

    conn.execute("""
   CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT,
    review_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    issue_count INTEGER,
    findings TEXT,
    graph_summary TEXT
)
    """)

    conn.commit()
    conn.close()


def save_review(project_name, comments,graph_summary):
    conn = sqlite3.connect(DB_NAME)

    conn.execute(
        """
        INSERT INTO reviews
        (project_name, issue_count, findings,graph_summary)
        VALUES (?, ?, ?,?)
        """,
        (
            project_name,
            len(comments),
            json.dumps(comments),
            json.dumps(graph_summary)
        )
    )

    conn.commit()
    conn.close()


def get_reviews():
    conn = sqlite3.connect(DB_NAME)

    cursor = conn.execute("""
    SELECT id,
           project_name,
           review_time,
           issue_count,
           findings,
           graph_summary                             
    FROM reviews
    ORDER BY review_time DESC
    """)

    reviews = []

    for row in cursor.fetchall():
        reviews.append({
            "id": row[0],
            "project_name": row[1],
            "review_time": row[2],
            "issue_count": row[3],
            "findings": json.loads(row[4]) if row[4] else [],
"graph_summary": json.loads(row[5]) if row[5] else []
        })

    conn.close()

    return reviews