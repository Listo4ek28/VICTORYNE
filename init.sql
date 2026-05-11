-- Удаляем старую базу данных, если она существует
DROP DATABASE IF EXISTS VICTORYNE;

-- Создаем базу данных заново
CREATE DATABASE VICTORYNE;
USE VICTORYNE;

-- Таблица ролей
CREATE TABLE ROLES (
    ID INT PRIMARY KEY NOT NULL,
    N VARCHAR(32)
);

-- Таблица пользователей
CREATE TABLE ACCOUNTS (
    ID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    USERNAME VARCHAR(32) NOT NULL UNIQUE,
    U_ROLE INT NOT NULL DEFAULT 2,
    FOREIGN KEY (U_ROLE) REFERENCES ROLES(ID),
    PHONE VARCHAR(16) UNIQUE,
    PASS VARCHAR(255),
    REG_DATE DATE,
    PROFILE_PHOTO MEDIUMBLOB,
    INDEX idx_username (USERNAME),
    INDEX idx_phone (PHONE)
);

-- Таблица тем
CREATE TABLE TOPICS (
    ID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    NAMING VARCHAR(32) NOT NULL,
    DESCRIPTION TEXT,
    ICON VARCHAR(50)
);

-- Таблица вопросов
CREATE TABLE QUESTIONS (
    ID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    TOPIC INT,
    FOREIGN KEY (TOPIC) REFERENCES TOPICS(ID),
    QUEST_TEXT TEXT NOT NULL,
    DIFFICULTY INT DEFAULT 1 COMMENT '1-легкий, 2-средний, 3-сложный',
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_topic (TOPIC)
);

-- Таблица ответов (СПРАВОЧНИК)
CREATE TABLE ANSWERS (
    ID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    QUESTION_ID INT NOT NULL,
    FOREIGN KEY (QUESTION_ID) REFERENCES QUESTIONS(ID) ON DELETE CASCADE,
    ANSWER_TEXT TEXT NOT NULL,
    IS_CORRECT BOOLEAN DEFAULT FALSE,
    INDEX idx_question (QUESTION_ID)
);

-- Лог пройденных викторин
CREATE TABLE PLAYED_VICTORYNES_LOG (
    GAME_ID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    USER_ID INT,
    FOREIGN KEY (USER_ID) REFERENCES ACCOUNTS(ID),
    TOPIC INT,
    FOREIGN KEY (TOPIC) REFERENCES TOPICS(ID),
    SCORE INT DEFAULT 0,
    TOTAL_QUESTIONS INT DEFAULT 0,
    MAX_POSSIBLE_SCORE INT DEFAULT 0,
    PLAYED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (USER_ID),
    INDEX idx_topic (TOPIC)
);

-- Связь вопросов с пройденными викторинами
CREATE TABLE PLAYED_VICTORYNES_QUESTIONS_CONNECT (
    ID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    VICTORYNE INT,
    FOREIGN KEY (VICTORYNE) REFERENCES PLAYED_VICTORYNES_LOG(GAME_ID) ON DELETE CASCADE,
    QUESTION INT,
    FOREIGN KEY (QUESTION) REFERENCES QUESTIONS(ID),
    RIGHT_ANSWER BOOLEAN,
    USER_ANSWER INT,
    INDEX idx_victoryne (VICTORYNE),
    INDEX idx_question (QUESTION)
);

-- Вставка ролей
INSERT INTO ROLES(ID, N) VALUES
    (1, 'Admin'),
    (2, 'Common');

-- Вставка тем
INSERT INTO TOPICS(NAMING, DESCRIPTION, ICON) VALUES
    ('История', 'Вопросы по всемирной истории и историческим событиям', '🏛️'),
    ('География', 'Страны, столицы, реки, горы и другие географические объекты', '🌍'),
    ('Наука', 'Физика, химия, биология и другие науки', '🔬');

-- Вставка пользователей
INSERT INTO ACCOUNTS(USERNAME, U_ROLE, PHONE, PASS, REG_DATE, PROFILE_PHOTO) VALUES
    ('Admin1', 1, '+7(999)999-99-99', 'password3', CURDATE(), NULL),
    ('Default', 2, '+7(999)111-11-11', 'password2', CURDATE(), NULL);

-- Вставка 10 вопросов по истории (тема ID 1)
INSERT INTO QUESTIONS(TOPIC, QUEST_TEXT, DIFFICULTY) VALUES
    (1, 'В каком году началась Вторая мировая война?', 2),
    (1, 'Кто был первым президентом США?', 1),
    (1, 'В каком году человек впервые полетел в космос?', 2),
    (1, 'Кто открыл Америку?', 1),
    (1, 'В каком году была основана Москва?', 3),
    (1, 'Кто написал "Войну и мир"?', 2),
    (1, 'В каком году произошла Великая Французская революция?', 3),
    (1, 'Кто был первым русским царем?', 2),
    (1, 'В каком году распался СССР?', 2),
    (1, 'Кто изобрел печатный станок?', 3);

-- Ответы для вопросов по истории
INSERT INTO ANSWERS(QUESTION_ID, ANSWER_TEXT, IS_CORRECT) VALUES
    -- Вопрос 1
    (1, '1937', FALSE),
    (1, '1939', TRUE),
    (1, '1941', FALSE),
    (1, '1943', FALSE),
    
    -- Вопрос 2
    (2, 'Авраам Линкольн', FALSE),
    (2, 'Джордж Вашингтон', TRUE),
    (2, 'Томас Джефферсон', FALSE),
    (2, 'Бенджамин Франклин', FALSE),
    
    -- Вопрос 3
    (3, '1957', FALSE),
    (3, '1961', TRUE),
    (3, '1969', FALSE),
    (3, '1955', FALSE),
    
    -- Вопрос 4
    (4, 'Васко да Гама', FALSE),
    (4, 'Христофор Колумб', TRUE),
    (4, 'Фернан Магеллан', FALSE),
    (4, 'Джеймс Кук', FALSE),
    
    -- Вопрос 5
    (5, '1147', TRUE),
    (5, '1247', FALSE),
    (5, '1047', FALSE),
    (5, '1347', FALSE),
    
    -- Вопрос 6
    (6, 'Фёдор Достоевский', FALSE),
    (6, 'Лев Толстой', TRUE),
    (6, 'Антон Чехов', FALSE),
    (6, 'Иван Тургенев', FALSE),
    
    -- Вопрос 7
    (7, '1789', TRUE),
    (7, '1799', FALSE),
    (7, '1776', FALSE),
    (7, '1804', FALSE),
    
    -- Вопрос 8
    (8, 'Иван III', FALSE),
    (8, 'Иван IV (Грозный)', TRUE),
    (8, 'Петр I', FALSE),
    (8, 'Александр I', FALSE),
    
    -- Вопрос 9
    (9, '1989', FALSE),
    (9, '1991', TRUE),
    (9, '1993', FALSE),
    (9, '1985', FALSE),
    
    -- Вопрос 10
    (10, 'Иоганн Гутенберг', TRUE),
    (10, 'Леонардо да Винчи', FALSE),
    (10, 'Галилео Галилей', FALSE),
    (10, 'Николай Коперник', FALSE);

-- Вопросы по географии (тема ID 2) - 10 вопросов
INSERT INTO QUESTIONS(TOPIC, QUEST_TEXT, DIFFICULTY) VALUES
    (2, 'Какая самая длинная река в мире?', 2),
    (2, 'Столица Австралии?', 1),
    (2, 'Самая высокая гора в мире?', 1),
    (2, 'Сколько океанов на Земле?', 1),
    (2, 'Самая большая страна по площади?', 2),
    (2, 'Столица Канады?', 2),
    (2, 'Самая большая пустыня в мире?', 2),
    (2, 'Какой океан самый большой?', 1),
    (2, 'Столица Японии?', 1),
    (2, 'Самое глубокое озеро в мире?', 3);

-- Ответы для вопросов по географии
INSERT INTO ANSWERS(QUESTION_ID, ANSWER_TEXT, IS_CORRECT) VALUES
    -- Вопрос 11
    (11, 'Амазонка', FALSE),
    (11, 'Нил', TRUE),
    (11, 'Янцзы', FALSE),
    (11, 'Миссисипи', FALSE),
    
    -- Вопрос 12
    (12, 'Сидней', FALSE),
    (12, 'Мельбурн', FALSE),
    (12, 'Канберра', TRUE),
    (12, 'Брисбен', FALSE),
    
    -- Вопрос 13
    (13, 'Эверест', TRUE),
    (13, 'Килиманджаро', FALSE),
    (13, 'Монблан', FALSE),
    (13, 'Эльбрус', FALSE),
    
    -- Вопрос 14
    (14, '4', FALSE),
    (14, '5', TRUE),
    (14, '6', FALSE),
    (14, '7', FALSE),
    
    -- Вопрос 15
    (15, 'Китай', FALSE),
    (15, 'США', FALSE),
    (15, 'Россия', TRUE),
    (15, 'Канада', FALSE),
    
    -- Вопрос 16
    (16, 'Торонто', FALSE),
    (16, 'Ванкувер', FALSE),
    (16, 'Оттава', TRUE),
    (16, 'Монреаль', FALSE),
    
    -- Вопрос 17
    (17, 'Сахара', TRUE),
    (17, 'Гоби', FALSE),
    (17, 'Аравийская', FALSE),
    (17, 'Каракумы', FALSE),
    
    -- Вопрос 18
    (18, 'Атлантический', FALSE),
    (18, 'Тихий', TRUE),
    (18, 'Индийский', FALSE),
    (18, 'Северный Ледовитый', FALSE),
    
    -- Вопрос 19
    (19, 'Осака', FALSE),
    (19, 'Киото', FALSE),
    (19, 'Токио', TRUE),
    (19, 'Иокогама', FALSE),
    
    -- Вопрос 20
    (20, 'Байкал', TRUE),
    (20, 'Виктория', FALSE),
    (20, 'Танганьика', FALSE),
    (20, 'Верхнее', FALSE);

-- Вопросы по науке (тема ID 3) - 10 вопросов
INSERT INTO QUESTIONS(TOPIC, QUEST_TEXT, DIFFICULTY) VALUES
    (3, 'Какая планета известна как "Красная планета"?', 1),
    (3, 'Сколько элементов в периодической таблице Менделеева?', 2),
    (3, 'Кто открыл закон всемирного тяготения?', 1),
    (3, 'Какой газ растения поглощают в процессе фотосинтеза?', 1),
    (3, 'Как называется самая маленькая частица вещества?', 2),
    (3, 'Кто предложил теорию относительности?', 3),
    (3, 'Какой орган в теле человека отвечает за перекачивание крови?', 1),
    (3, 'Что измеряет амперметр?', 2),
    (3, 'Какая кислота содержится в желудке человека?', 2),
    (3, 'Кто открыл пенициллин?', 3);

-- Ответы для вопросов по науке
INSERT INTO ANSWERS(QUESTION_ID, ANSWER_TEXT, IS_CORRECT) VALUES
    -- Вопрос 21
    (21, 'Венера', FALSE),
    (21, 'Марс', TRUE),
    (21, 'Юпитер', FALSE),
    (21, 'Сатурн', FALSE),
    
    -- Вопрос 22
    (22, '92', FALSE),
    (22, '118', TRUE),
    (22, '108', FALSE),
    (22, '126', FALSE),
    
    -- Вопрос 23
    (23, 'Альберт Эйнштейн', FALSE),
    (23, 'Исаак Ньютон', TRUE),
    (23, 'Галилео Галилей', FALSE),
    (23, 'Никола Тесла', FALSE),
    
    -- Вопрос 24
    (24, 'Кислород', FALSE),
    (24, 'Углекислый газ', TRUE),
    (24, 'Азот', FALSE),
    (24, 'Водород', FALSE),
    
    -- Вопрос 25
    (25, 'Молекула', FALSE),
    (25, 'Атом', TRUE),
    (25, 'Электрон', FALSE),
    (25, 'Протон', FALSE),
    
    -- Вопрос 26
    (26, 'Нильс Бор', FALSE),
    (26, 'Альберт Эйнштейн', TRUE),
    (26, 'Стивен Хокинг', FALSE),
    (26, 'Мария Кюри', FALSE),
    
    -- Вопрос 27
    (27, 'Печень', FALSE),
    (27, 'Сердце', TRUE),
    (27, 'Легкие', FALSE),
    (27, 'Почки', FALSE),
    
    -- Вопрос 28
    (28, 'Напряжение', FALSE),
    (28, 'Силу тока', TRUE),
    (28, 'Сопротивление', FALSE),
    (28, 'Мощность', FALSE),
    
    -- Вопрос 29
    (29, 'Серная кислота', FALSE),
    (29, 'Соляная кислота', TRUE),
    (29, 'Азотная кислота', FALSE),
    (29, 'Уксусная кислота', FALSE),
    
    -- Вопрос 30
    (30, 'Луи Пастер', FALSE),
    (30, 'Александр Флеминг', TRUE),
    (30, 'Джозеф Листер', FALSE),
    (30, 'Роберт Кох', FALSE);

-- Тестовые результаты викторин
INSERT INTO PLAYED_VICTORYNES_LOG(USER_ID, TOPIC, SCORE, TOTAL_QUESTIONS, PLAYED_DATE) VALUES
    (2, 1, 80, 10, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (2, 2, 90, 10, DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 3, 70, 10, DATE_SUB(NOW(), INTERVAL 3 DAY));