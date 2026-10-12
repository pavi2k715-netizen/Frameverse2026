
import re
import sqlite3
from pathlib import Path

from flask import Flask, jsonify, request

app = Flask(__name__)
DB_PATH = Path(__file__).with_name("frameverse.db")

YEAR_TABLES = {
    "first_year": "first_year_registrations",
    "second_year": "second_year_registrations",
    "third_year": "third_year_registrations",
    "fourth_year": "fourth_year_registrations",
}


def connect_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_db():
    with connect_db() as db:
        for table in YEAR_TABLES.values():
            db.execute(f"""
                CREATE TABLE IF NOT EXISTS {table} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    registration_id TEXT UNIQUE NOT NULL,
                    team_lead_name TEXT NOT NULL,
                    team_members TEXT NOT NULL,
                    mobile TEXT NOT NULL,
                    laptop_availability TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)


@app.get("/api/health")
def health():
    try:
        initialize_db()
        return jsonify(status="ok", database="connected")
    except sqlite3.Error:
        app.logger.exception("Database check failed")
        return jsonify(message="Database error"), 500


@app.post("/api/registrations")
def register():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify(message="Invalid registration data."), 400

    year = data.get("academic_year")
    if year not in YEAR_TABLES:
        return jsonify(message="Choose a valid academic year."), 422

    lead = data.get("teamLeadName")
    mobile = data.get("teamLeadMobile")
    laptop = data.get("laptopAvailability")
    members = data.get("teamMembers")

    if not isinstance(lead, str) or not lead.strip():
        return jsonify(message="Team lead name is required."), 422

    if not isinstance(mobile, str):
        return jsonify(message="Enter a valid mobile number."), 422

    digits = re.sub(r"\D", "", mobile)
    if not 7 <= len(digits) <= 15 or len(set(digits)) == 1:
        return jsonify(message="Enter a valid mobile number."), 422

    if laptop not in ("Yes", "No"):
        return jsonify(message="Select laptop availability."), 422

    if not isinstance(members, list) or len(members) > 3:
        return jsonify(message="Enter two or three team members."), 422

    clean_members = []

    for index, member in enumerate(members, start=1):
        if not isinstance(member, dict):
            return jsonify(message="Invalid member details."), 422

        name = member.get("name", "")
        reg = member.get("registerNumber", "")
        section = member.get("section", "")

        if not all(isinstance(v, str) for v in (name, reg, section)):
            return jsonify(message="Invalid member details."), 422

        name, reg, section = name.strip(), reg.strip(), section.strip()

        if index == 3 and not (name or reg or section):
            continue

        if not name or not reg or not section:
            return jsonify(
                message=f"Complete all fields for Team Member {index}."
            ), 422

        if not re.fullmatch(r"\d+", reg):
            return jsonify(
                message="Register number must contain digits only."
            ), 422

        clean_members.append({
            "name": name,
            "registerNumber": reg,
            "section": section,
        })

    names = [member["name"].casefold() for member in clean_members]

    if len(clean_members) < 2 or len(names) != len(set(names)):
        return jsonify(
            message="Enter at least two members with unique names."
        ), 422

    if lead.strip().casefold() not in names:
        return jsonify(
            message="The team lead must be one of the listed members."
        ), 422

    import json

    try:
        with connect_db() as db:
            table = YEAR_TABLES[year]
            cursor = db.execute(
                f"""INSERT INTO {table}
                (registration_id, team_lead_name, team_members,
                 mobile, laptop_availability)
                VALUES (?, ?, ?, ?, ?)""",
                (
                    "PENDING",
                    lead.strip(),
                    json.dumps(clean_members),
                    mobile.strip(),
                    laptop,
                ),
            )
            row_id = cursor.lastrowid
            registration_id = f"FV{row_id}"

            db.execute(
                f"UPDATE {table} SET registration_id = ? WHERE id = ?",
                (registration_id, row_id),
            )

        return jsonify(
            saved=True,
            registrationId=registration_id,
            academic_year=year,
        ), 201

    except sqlite3.Error:
        app.logger.exception("Registration save failed")
        return jsonify(
            saved=False,
            message="Could not save registration. Please try again."
        ), 500


if __name__ == "__main__":
    initialize_db()
    app.run(host="127.0.0.1", port=5000, debug=False)
