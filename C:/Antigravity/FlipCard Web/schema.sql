-- ==============================================================
--   FLIPCARD LEARNING APP — Database Schema
--   File: schema.sql
--   Database: MySQL 8.0+
-- ==============================================================

-- 1. Buat database (jika belum ada)
CREATE DATABASE IF NOT EXISTS flipcard_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE flipcard_db;

-- ==============================================================
-- 2. Tabel: decks
-- ==============================================================
CREATE TABLE IF NOT EXISTS decks (
    id          INT             NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255)    NOT NULL,
    description TEXT,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================
-- 3. Tabel: cards
-- ==============================================================
CREATE TABLE IF NOT EXISTS cards (
    id          INT     NOT NULL AUTO_INCREMENT,
    deck_id     INT     NOT NULL,
    front       TEXT    NOT NULL,
    back        TEXT    NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_cards_deck
        FOREIGN KEY (deck_id)
        REFERENCES decks (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index untuk mempercepat query cards berdasarkan deck_id
CREATE INDEX idx_cards_deck_id ON cards (deck_id);

-- ==============================================================
-- 4. Data Dummy — Decks
-- ==============================================================
INSERT INTO decks (name, description) VALUES
('Kosakata Bahasa Inggris',   'Kumpulan kosakata Bahasa Inggris sehari-hari beserta artinya.'),
('Python Programming',        'Konsep dasar pemrograman Python untuk pemula.'),
('Sejarah Indonesia',         'Fakta dan peristiwa penting dalam sejarah Indonesia.');

-- ==============================================================
-- 5. Data Dummy — Cards
-- ==============================================================

-- Deck 1: Kosakata Bahasa Inggris (deck_id = 1)
INSERT INTO cards (deck_id, front, back) VALUES
(1, 'What does "Ambiguous" mean?',       'Tidak jelas; dapat ditafsirkan lebih dari satu cara. Contoh: "The instructions were ambiguous."'),
(1, 'What does "Benevolent" mean?',      'Baik hati; suka membantu orang lain. Contoh: "She is a benevolent leader."'),
(1, 'What does "Concise" mean?',         'Singkat dan padat; langsung ke inti. Contoh: "Please give a concise answer."'),
(1, 'What does "Diligent" mean?',        'Rajin; tekun dalam bekerja atau belajar. Contoh: "He is a diligent student."'),
(1, 'What does "Eloquent" mean?',        'Fasih; pandai berbicara dengan meyakinkan. Contoh: "She gave an eloquent speech."');

-- Deck 2: Python Programming (deck_id = 2)
INSERT INTO cards (deck_id, front, back) VALUES
(2, 'Apa itu list comprehension di Python?',
    'Cara ringkas membuat list baru dari iterable.\nContoh: squares = [x**2 for x in range(10)]'),
(2, 'Apa perbedaan list dan tuple?',
    'List bersifat mutable (bisa diubah), tuple bersifat immutable (tidak bisa diubah setelah dibuat).'),
(2, 'Apa fungsi dekorator (@) di Python?',
    'Dekorator adalah fungsi yang membungkus fungsi lain untuk menambah fungsionalitas tanpa mengubah kode aslinya.'),
(2, 'Apa itu *args dan **kwargs?',
    '*args: menerima argumen posisional tak terbatas sebagai tuple.\n**kwargs: menerima argumen keyword tak terbatas sebagai dict.'),
(2, 'Bagaimana cara membuka file di Python?',
    'Gunakan context manager:\nwith open("file.txt", "r") as f:\n    content = f.read()');

-- Deck 3: Sejarah Indonesia (deck_id = 3)
INSERT INTO cards (deck_id, front, back) VALUES
(3, 'Kapan Proklamasi Kemerdekaan Indonesia?',
    '17 Agustus 1945 -- dibacakan oleh Ir. Soekarno dan Drs. Mohammad Hatta di Jalan Pegangsaan Timur 56, Jakarta.'),
(3, 'Siapakah Bapak Proklamator Indonesia?',
    'Ir. Soekarno (Presiden RI ke-1) dan Drs. Mohammad Hatta (Wakil Presiden RI ke-1).'),
(3, 'Apa itu Sumpah Pemuda?',
    'Ikrar yang diucapkan pada 28 Oktober 1928: bertanah air satu, berbangsa satu, berbahasa satu -- Indonesia.'),
(3, 'Kapan Konferensi Meja Bundar (KMB) berlangsung?',
    '23 Agustus - 2 November 1949 di Den Haag, Belanda. Menghasilkan pengakuan kedaulatan Indonesia oleh Belanda.'),
(3, 'Apa peristiwa G30S/PKI?',
    'Peristiwa pada 30 September 1965, terjadi pembunuhan sejumlah jenderal TNI AD. Menandai berakhirnya Orde Lama dan dimulainya Orde Baru.');

-- ==============================================================
-- Verifikasi data yang dimasukkan
-- ==============================================================
SELECT
    d.id            AS deck_id,
    d.name          AS deck_name,
    COUNT(c.id)     AS total_cards
FROM decks d
LEFT JOIN cards c ON c.deck_id = d.id
GROUP BY d.id, d.name;
