-- Creación de la base de datos
DROP DATABASE IF EXISTS shishadb;
CREATE DATABASE shishadb;

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
    user_id CHAR(36) NOT NULL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password CHAR(32) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW())
);

-- Creación de la tabla mezclas de sabores
CREATE TABLE mixes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255)
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

-- Introduciendo algunos datos
INSERT INTO brands (name) VALUES ("Taboo");
INSERT INTO brands (name) VALUES ("Neo");
INSERT INTO brands (name) VALUES ("Serbetli");

INSERT INTO flavours (name, description, brand_id) VALUES ("Jungle", "Frutas tropicales con hielo", (SELECT id FROM brands WHERE name="Taboo"));
INSERT INTO flavours (name, description, brand_id) VALUES ("Richman", "Helado de frambuesa", (SELECT id FROM brands WHERE name="Taboo"));
INSERT INTO flavours (name, description, brand_id) VALUES ("Forever", "Arándanos, frambuesa, lima y cereza", (SELECT id FROM brands WHERE name="Neo"));
INSERT INTO flavours (name, description, brand_id) VALUES ("Maca Roll", "Dulce macaron", (SELECT id FROM brands WHERE name="Serbetli"));