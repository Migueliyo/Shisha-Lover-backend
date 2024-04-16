-- Creación de la base de datos
DROP DATABASE IF EXISTS shishadb;
CREATE DATABASE shishadb
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Usar
USE shishadb;

-- Creación de la tabla marca de los sabores
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);
-- Creación de la tabla sabores
CREATE TABLE flavours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    brand_id INT NOT NULL, 
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Creación de la tabla usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password CHAR(60) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    disabled BOOLEAN NOT NULL DEFAULT (false),
    created_at TIMESTAMP NOT NULL DEFAULT (NOW())
);

-- Creación de la tabla mezclas de sabores
CREATE TABLE mixes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Creación de la tabla mezcla de los sabores donde almacenaré
-- cada sabor junto con el porcentaje que contendrá en la mezcla
CREATE TABLE mix_flavours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mix_id INT NOT NULL,
    flavour_id INT NOT NULL,
    percentage INT NOT NULL, 
    CHECK (percentage >= 0 AND percentage <= 100),
    FOREIGN KEY (mix_id) REFERENCES mixes(id),
    FOREIGN KEY (flavour_id) REFERENCES flavours(id)
);

-- Creación de la tabla categorías
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Creación de la tabla categoría de las mezclas donde 
-- almacenaré las categorías asociadas en la mezcla
CREATE TABLE mix_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mix_id INT,
    category_id INT,
    FOREIGN KEY (mix_id) REFERENCES mixes(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Creación de la tabla categoría de los sabores donde 
-- almacenaré las categorías asociadas al sabor
CREATE TABLE flavour_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flavour_id INT,
    category_id INT,
    FOREIGN KEY (flavour_id) REFERENCES flavours(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Introduciendo algunos datos
INSERT INTO brands (name) VALUES ("Taboo");
INSERT INTO brands (name) VALUES ("Neo");
INSERT INTO brands (name) VALUES ("Serbetli");

INSERT INTO categories (name) VALUES ("Afrutado");
INSERT INTO categories (name) VALUES ("Dulce");

INSERT INTO flavours (name, description, brand_id) VALUES ("Jungle", "Frutas tropicales con hielo", (SELECT id FROM brands WHERE name="Taboo"));
INSERT INTO flavours (name, description, brand_id) VALUES ("Richman", "Helado de frambuesa", (SELECT id FROM brands WHERE name="Taboo"));
INSERT INTO flavours (name, description, brand_id) VALUES ("Forever", "Arandanos, frambuesa, lima y cereza", (SELECT id FROM brands WHERE name="Neo"));
INSERT INTO flavours (name, description, brand_id) VALUES ("Maca Roll", "Dulce macaron", (SELECT id FROM brands WHERE name="Serbetli"));
INSERT INTO flavour_categories (flavour_id, category_id) VALUES ((SELECT id FROM flavours WHERE name = "Jungle"), (SELECT id FROM categories WHERE name = "Afrutado"));
INSERT INTO flavour_categories (flavour_id, category_id) VALUES ((SELECT id FROM flavours WHERE name = "Jungle"), (SELECT id FROM categories WHERE name = "Dulce"));
INSERT INTO flavour_categories (flavour_id, category_id) VALUES ((SELECT id FROM flavours WHERE name = "Richman"), (SELECT id FROM categories WHERE name = "Afrutado"));
INSERT INTO flavour_categories (flavour_id, category_id) VALUES ((SELECT id FROM flavours WHERE name = "Richman"), (SELECT id FROM categories WHERE name = "Dulce"));
INSERT INTO flavour_categories (flavour_id, category_id) VALUES ((SELECT id FROM flavours WHERE name = "Forever"), (SELECT id FROM categories WHERE name = "Afrutado"));
INSERT INTO flavour_categories (flavour_id, category_id) VALUES ((SELECT id FROM flavours WHERE name = "Forever"), (SELECT id FROM categories WHERE name = "Dulce"));
INSERT INTO flavour_categories (flavour_id, category_id) VALUES ((SELECT id FROM flavours WHERE name = "Maca Roll"), (SELECT id FROM categories WHERE name = "Afrutado"));
INSERT INTO flavour_categories (flavour_id, category_id) VALUES ((SELECT id FROM flavours WHERE name = "Maca Roll"), (SELECT id FROM categories WHERE name = "Dulce"));

INSERT INTO categories (name) VALUES ("Afrutada");
INSERT INTO categories (name) VALUES ("Mentolada");

INSERT INTO users (username, password, first_name, last_name, email) VALUES ("migueliyo", "$2b$10$kPuJL7S/2dsvt1pUdxoiqujpbHT9VUeSBAry2iYDdu/bafVspfjpu", "Miguel", "Colmenero", "miguel@gmail.com");

INSERT INTO mixes (user_id, name) VALUES ((SELECT id FROM users WHERE username = "migueliyo"), "Mezcla 1");
INSERT INTO mix_flavours (mix_id, flavour_id, percentage) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 1"), (SELECT id FROM flavours WHERE name = "Richman"), 50);
INSERT INTO mix_flavours (mix_id, flavour_id, percentage) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 1"), (SELECT id FROM flavours WHERE name = "Forever"), 50);
INSERT INTO mix_categories (mix_id, category_id) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 1"), (SELECT id FROM categories WHERE name = "Afrutada"));
INSERT INTO mix_categories (mix_id, category_id) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 1"), (SELECT id FROM categories WHERE name = "Dulce"));

INSERT INTO mixes (user_id, name) VALUES ((SELECT id FROM users WHERE username = "migueliyo"), "Mezcla 2");
INSERT INTO mix_flavours (mix_id, flavour_id, percentage) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 2"), (SELECT id FROM flavours WHERE name = "Maca Roll"), 50);
INSERT INTO mix_flavours (mix_id, flavour_id, percentage) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 2"), (SELECT id FROM flavours WHERE name = "Jungle"), 50);
INSERT INTO mix_categories (mix_id, category_id) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 2"), (SELECT id FROM categories WHERE name = "Afrutada"));
INSERT INTO mix_categories (mix_id, category_id) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 2"), (SELECT id FROM categories WHERE name = "Mentolada"));