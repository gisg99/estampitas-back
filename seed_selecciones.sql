-- Agregar columnas si no existen
ALTER TABLE selecciones ADD COLUMN IF NOT EXISTS grupo TEXT;
ALTER TABLE selecciones ADD COLUMN IF NOT EXISTS orden INTEGER;

-- 48 selecciones del Mundial 2026 (grupos A–L)
INSERT INTO selecciones (nombre, abreviatura, grupo, orden) VALUES
  -- Grupo A
  ('México',            'MEX', 'A', 1),
  ('Sudáfrica',         'RSA', 'A', 2),
  ('Corea del Sur',     'KOR', 'A', 3),
  ('República Checa',   'CZE', 'A', 4),
  -- Grupo B
  ('Canadá',            'CAN', 'B', 1),
  ('Bosnia',            'BIH', 'B', 2),
  ('Catar',             'QAT', 'B', 3),
  ('Suiza',             'SUI', 'B', 4),
  -- Grupo C
  ('Brasil',            'BRA', 'C', 1),
  ('Marruecos',         'MAR', 'C', 2),
  ('Haití',             'HAI', 'C', 3),
  ('Escocia',           'SCO', 'C', 4),
  -- Grupo D
  ('Estados Unidos',    'USA', 'D', 1),
  ('Paraguay',          'PAR', 'D', 2),
  ('Australia',         'AUS', 'D', 3),
  ('Turquía',           'TUR', 'D', 4),
  -- Grupo E
  ('Alemania',          'GER', 'E', 1),
  ('Curazao',           'CUW', 'E', 2),
  ('Costa de Marfil',   'CIV', 'E', 3),
  ('Ecuador',           'ECU', 'E', 4),
  -- Grupo F
  ('Países Bajos',      'NED', 'F', 1),
  ('Japón',             'JPN', 'F', 2),
  ('Suecia',            'SWE', 'F', 3),
  ('Túnez',             'TUN', 'F', 4),
  -- Grupo G
  ('Bélgica',           'BEL', 'G', 1),
  ('Egipto',            'EGY', 'G', 2),
  ('Irán',              'IRN', 'G', 3),
  ('Nueva Zelanda',     'NZL', 'G', 4),
  -- Grupo H
  ('España',            'ESP', 'H', 1),
  ('Cabo Verde',        'CPV', 'H', 2),
  ('Arabia Saudita',    'KSA', 'H', 3),
  ('Uruguay',           'URU', 'H', 4),
  -- Grupo I
  ('Francia',           'FRA', 'I', 1),
  ('Senegal',           'SEN', 'I', 2),
  ('Irak',              'IRQ', 'I', 3),
  ('Noruega',           'NOR', 'I', 4),
  -- Grupo J
  ('Argentina',         'ARG', 'J', 1),
  ('Argelia',           'ALG', 'J', 2),
  ('Austria',           'AUT', 'J', 3),
  ('Jordania',          'JOR', 'J', 4),
  -- Grupo K
  ('Portugal',          'POR', 'K', 1),
  ('RD Congo',          'COD', 'K', 2),
  ('Uzbekistán',        'UZB', 'K', 3),
  ('Colombia',          'COL', 'K', 4),
  -- Grupo L
  ('Inglaterra',        'ENG', 'L', 1),
  ('Croacia',           'CRO', 'L', 2),
  ('Ghana',             'GHA', 'L', 3),
  ('Panamá',            'PAN', 'L', 4)
ON CONFLICT (abreviatura) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      grupo  = EXCLUDED.grupo,
      orden  = EXCLUDED.orden;
