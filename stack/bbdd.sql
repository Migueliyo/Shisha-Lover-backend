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

-- Creación de la tabla de likes de las mezclas
CREATE TABLE mix_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mix_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (mix_id) REFERENCES mixes(id),
    UNIQUE KEY unique_like (user_id, mix_id)
);


-- Creación de la tabla categorías
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Creación de la tabla categoría de los sabores donde 
-- almacenaré las categorías asociadas al sabor
CREATE TABLE flavour_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flavour_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (flavour_id) REFERENCES flavours(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Creación de la tabla entradas de texto
CREATE TABLE entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Creación de la tabla categoría de las entradas de texto
-- donde almacenaré las categorías asociadas a la entrada
CREATE TABLE entry_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES entries(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Introduciendo algunos datos
INSERT INTO brands (name) VALUES ("Taboo");
INSERT INTO brands (name) VALUES ("Neo");
INSERT INTO brands (name) VALUES ("Serbetli");

INSERT INTO categories (name) VALUES ("Afrutado");
INSERT INTO categories (name) VALUES ("Dulce");
INSERT INTO categories (name) VALUES ("Consejos");
INSERT INTO categories (name) VALUES ("Limpieza");
INSERT INTO categories (name) VALUES ("Mantenimiento");
INSERT INTO categories (name) VALUES ("Mezclas");

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

INSERT INTO users (username, password, first_name, last_name, email) VALUES ("migueliyo", "$2b$10$kPuJL7S/2dsvt1pUdxoiqujpbHT9VUeSBAry2iYDdu/bafVspfjpu", "Miguel", 
"Colmenero", "miguel@gmail.com");

INSERT INTO mixes (user_id, name) VALUES ((SELECT id FROM users WHERE username = "migueliyo"), "Mezcla 1");
INSERT INTO mix_flavours (mix_id, flavour_id, percentage) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 1"), (SELECT id FROM flavours WHERE name = "Richman"), 50);
INSERT INTO mix_flavours (mix_id, flavour_id, percentage) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 1"), (SELECT id FROM flavours WHERE name = "Forever"), 50);

INSERT INTO mixes (user_id, name) VALUES ((SELECT id FROM users WHERE username = "migueliyo"), "Mezcla 2");
INSERT INTO mix_flavours (mix_id, flavour_id, percentage) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 2"), (SELECT id FROM flavours WHERE name = "Maca Roll"), 50);
INSERT INTO mix_flavours (mix_id, flavour_id, percentage) VALUES ((SELECT id FROM mixes WHERE name = "Mezcla 2"), (SELECT id FROM flavours WHERE name = "Jungle"), 50);

INSERT INTO entries (user_id, title, description) VALUES ((SELECT id FROM users WHERE username = "migueliyo"), "Como mantener tu cachimba limpia con el paso del tiempo", 
'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In lectus metus, rutrum sed fringilla mattis, lacinia sed mauris. Aenean eget congue enim. Phasellus in quam a 
sapien blandit tempor eu vitae felis. Donec at nunc tincidunt, molestie ex sit amet, posuere mauris. Etiam ac dolor ac diam pretium maximus. In hac habitasse platea dictumst. 
Vivamus eget nulla a eros bibendum suscipit.Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris non felis dictum, feugiat tellus quis, efficitur ante. Nunc 
nec tortor dictum, egestas libero sit amet, luctus quam. Aliquam at porta sapien, vel ultrices est. Suspendisse quam lacus, condimentum a ante eu, pellentesque aliquet libero. 
Nullam dignissim tellus ante, nec scelerisque dolor vehicula eu. Quisque molestie gravida ante sed aliquam. Maecenas gravida, dolor eget congue congue, enim magna vehicula erat, 
vitae condimentum augue urna id risus. Phasellus lacinia fringilla cursus. Donec a tincidunt turpis. Suspendisse blandit mi dignissim lorem euismod, gravida porttitor dolor 
placerat. Pellentesque eget purus nec sapien luctus rutrum. Nulla et lobortis tortor. Donec tempus nibh eu neque imperdiet, eget condimentum enim euismod. Curabitur eros sem, 
fringilla non purus finibus, mattis efficitur justo.');
INSERT INTO entries (user_id, title, description) VALUES ((SELECT id FROM users WHERE username = "migueliyo"), "Consejos para la realizacion de mejores mezclas", 
'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In lectus metus, rutrum sed fringilla mattis, lacinia sed mauris. Aenean eget congue enim. Phasellus in quam a 
sapien blandit tempor eu vitae felis. Donec at nunc tincidunt, molestie ex sit amet, posuere mauris. Etiam ac dolor ac diam pretium maximus. In hac habitasse platea dictumst. 
Vivamus eget nulla a eros bibendum suscipit.Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris non felis dictum, feugiat tellus quis, efficitur ante. Nunc 
nec tortor dictum, egestas libero sit amet, luctus quam. Aliquam at porta sapien, vel ultrices est. Suspendisse quam lacus, condimentum a ante eu, pellentesque aliquet libero. 
Nullam dignissim tellus ante, nec scelerisque dolor vehicula eu. Quisque molestie gravida ante sed aliquam. Maecenas gravida, dolor eget congue congue, enim magna vehicula erat, 
vitae condimentum augue urna id risus. Phasellus lacinia fringilla cursus. Donec a tincidunt turpis. Suspendisse blandit mi dignissim lorem euismod, gravida porttitor dolor 
placerat. Pellentesque eget purus nec sapien luctus rutrum. Nulla et lobortis tortor. Donec tempus nibh eu neque imperdiet, eget condimentum enim euismod. Curabitur eros sem, 
fringilla non purus finibus, mattis efficitur justo.');

INSERT INTO entry_categories (entry_id, category_id) VALUES ((SELECT id FROM entries WHERE title = "Como mantener tu cachimba limpia con el paso del tiempo"), 
(SELECT id FROM categories WHERE name = "Consejos"));
INSERT INTO entry_categories (entry_id, category_id) VALUES ((SELECT id FROM entries WHERE title = "Como mantener tu cachimba limpia con el paso del tiempo"), 
(SELECT id FROM categories WHERE name = "Limpieza"));
INSERT INTO entry_categories (entry_id, category_id) VALUES ((SELECT id FROM entries WHERE title = "Como mantener tu cachimba limpia con el paso del tiempo"), 
(SELECT id FROM categories WHERE name = "Mantenimiento"));
INSERT INTO entry_categories (entry_id, category_id) VALUES ((SELECT id FROM entries WHERE title = "Consejos para la realizacion de mejores mezclas"), 
(SELECT id FROM categories WHERE name = "Consejos"));
INSERT INTO entry_categories (entry_id, category_id) VALUES ((SELECT id FROM entries WHERE title = "Consejos para la realizacion de mejores mezclas"), 
(SELECT id FROM categories WHERE name = "Mezclas"));