"""
config.py — Konfigurasi aplikasi Flipcard Learning
Membaca variabel dari file .env menggunakan python-dotenv
"""

import os
from dotenv import load_dotenv

# Muat variabel dari file .env
load_dotenv()

class Config:
    """Konfigurasi dasar aplikasi Flask."""

    # Flask
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-ganti-di-production")
    DEBUG      = os.getenv("FLASK_DEBUG", "True").lower() == "true"

    # Database MySQL
    DB_HOST     = os.getenv("DB_HOST", "localhost")
    DB_PORT     = int(os.getenv("DB_PORT", 3306))
    DB_USER     = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME     = os.getenv("DB_NAME", "flipcard_db")

    @property
    def db_config(self) -> dict:
        """Mengembalikan dict konfigurasi untuk mysql-connector-python."""
        return {
            "host":     self.DB_HOST,
            "port":     self.DB_PORT,
            "user":     self.DB_USER,
            "password": self.DB_PASSWORD,
            "database": self.DB_NAME,
            "charset":  "utf8mb4",
        }
