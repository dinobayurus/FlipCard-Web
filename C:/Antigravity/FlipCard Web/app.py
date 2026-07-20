"""
app.py — Entry point Flask untuk Flipcard Learning App
Berisi: koneksi DB, helper, route halaman, dan REST API endpoint
"""

from flask import Flask, render_template, jsonify, request, abort
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load variabel dari file .env
load_dotenv()

# ──────────────────────────────────────────
# Inisialisasi App
# ──────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "super-secret-key-bayu")
app.debug = os.getenv("DEBUG", "True").lower() in ['true', '1']

# ──────────────────────────────────────────
# Helper: Koneksi Database
# ──────────────────────────────────────────
def get_db_connection():
    """Membuka dan mengembalikan koneksi MySQL baru."""
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', ''),
            database=os.getenv('DB_NAME', 'flipcard_db')
        )
        return conn
    except Error as e:
        print(f"[DB ERROR] Gagal terhubung ke MySQL: {e}")
        return None

def query_db(sql: str, params: tuple = (), fetchone: bool = False):
    """Menjalankan SELECT query dan mengembalikan hasil."""
    conn = get_db_connection()
    if conn is None:
        return None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, params)
        result = cursor.fetchone() if fetchone else cursor.fetchall()
        return result
    except Error as e:
        print(f"[QUERY ERROR] {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def execute_db(sql: str, params: tuple = ()):
    """Menjalankan INSERT / UPDATE / DELETE."""
    conn = get_db_connection()
    if conn is None:
        return False
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        conn.commit()
        last_id = cursor.lastrowid
        return last_id if last_id else True
    except Error as e:
        conn.rollback()
        print(f"[EXECUTE ERROR] {e}")
        return False
    finally:
        cursor.close()
        conn.close()

# ══════════════════════════════════════════
# ROUTE HALAMAN (Server-Side Rendering)
# ══════════════════════════════════════════
@app.route("/")
def index():
    """Halaman utama — menampilkan semua deck beserta jumlah kartu."""
    sql = """
        SELECT d.id, d.name, d.description, d.created_at,
               COUNT(c.id) AS total_cards
        FROM decks d
        LEFT JOIN cards c ON c.deck_id = d.id
        GROUP BY d.id, d.name, d.description, d.created_at
        ORDER BY d.created_at DESC
    """
    decks = query_db(sql)
    return render_template("index.html", decks=decks or [])

@app.route("/deck/<int:deck_id>")
def deck_detail(deck_id: int):
    """Halaman detail — menampilkan semua kartu dalam sebuah deck."""
    deck = query_db("SELECT id, name, description FROM decks WHERE id = %s", (deck_id,), fetchone=True)
    if not deck:
        abort(404)
    cards = query_db("SELECT id, front, back, created_at FROM cards WHERE deck_id = %s ORDER BY id ASC", (deck_id,))
    return render_template("deck_detail.html", deck=deck, cards=cards or [])

@app.route("/study/<int:deck_id>")
def study(deck_id: int):
    """Halaman study mode — belajar kartu satu per satu dengan animasi flip."""
    deck = query_db("SELECT id, name FROM decks WHERE id = %s", (deck_id,), fetchone=True)
    if not deck:
        abort(404)
    cards = query_db("SELECT id, front, back FROM cards WHERE deck_id = %s ORDER BY id ASC", (deck_id,))
    if not cards:
        abort(404)
    return render_template("study.html", deck=deck, cards=cards)

# ══════════════════════════════════════════
# REST API — DECK ENDPOINTS
# ══════════════════════════════════════════
@app.route("/api/decks", methods=["GET"])
def api_get_decks():
    sql = """
        SELECT d.id, d.name, d.description, d.created_at,
               COUNT(c.id) AS total_cards
        FROM decks d
        LEFT JOIN cards c ON c.deck_id = d.id
        GROUP BY d.id, d.name, d.description, d.created_at
        ORDER BY d.created_at DESC
    """
    decks = query_db(sql)
    for d in (decks or []):
        if d.get("created_at"):
            d["created_at"] = d["created_at"].isoformat()
    return jsonify({"success": True, "data": decks or []})

@app.route("/api/deck", methods=["POST"])
def api_create_deck():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    description = (body.get("description") or "").strip()

    if not name:
        return jsonify({"success": False, "message": "Nama deck tidak boleh kosong."}), 400

    new_id = execute_db("INSERT INTO decks (name, description) VALUES (%s, %s)", (name, description or None))
    if not new_id:
        return jsonify({"success": False, "message": "Gagal menyimpan deck."}), 500

    return jsonify({"success": True, "message": "Deck berhasil dibuat."}), 201

@app.route("/api/deck/<int:deck_id>", methods=["PUT"])
def api_update_deck(deck_id: int):
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    description = (body.get("description") or "").strip()
    ok = execute_db("UPDATE decks SET name = %s, description = %s WHERE id = %s", (name, description, deck_id))
    return jsonify({"success": ok})

@app.route("/api/deck/<int:deck_id>", methods=["DELETE"])
def api_delete_deck(deck_id: int):
    ok = execute_db("DELETE FROM decks WHERE id = %s", (deck_id,))
    return jsonify({"success": ok})

# ══════════════════════════════════════════
# REST API — CARD ENDPOINTS
# ══════════════════════════════════════════
@app.route("/api/card", methods=["POST"])
def api_create_card():
    body = request.get_json(silent=True) or {}
    deck_id, front, back = body.get("deck_id"), body.get("front"), body.get("back")
    if not deck_id or not front or not back:
        return jsonify({"success": False, "message": "Data tidak lengkap"}), 400
    execute_db("INSERT INTO cards (deck_id, front, back) VALUES (%s, %s, %s)", (deck_id, front, back))
    return jsonify({"success": True}), 201

@app.route("/api/card/<int:card_id>", methods=["DELETE"])
def api_delete_card(card_id: int):
    ok = execute_db("DELETE FROM cards WHERE id = %s", (card_id,))
    return jsonify({"success": ok})

@app.errorhandler(404)
def not_found(e):
    return "Halaman tidak ditemukan (404)", 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "message": "Terjadi kesalahan pada server."}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)