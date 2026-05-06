-- Agregar columna grupo si no existe
ALTER TABLE selecciones ADD COLUMN IF NOT EXISTS grupo TEXT;

-- 48 selecciones del Mundial 2026 (grupos A–L)
INSERT INTO selecciones (nombre, abreviatura, grupo) VALUES
  -- Grupo A
  ('México',            'MEX', 'A'),
  ('Sudáfrica',         'RSA', 'A'),
  ('Corea del Sur',     'KOR', 'A'),
  ('República Checa',   'CZE', 'A'),
  -- Grupo B
  ('Canadá',            'CAN', 'B'),
  ('Bosnia',            'BIH', 'B'),
  ('Catar',             'QAT', 'B'),
  ('Suiza',             'SUI', 'B'),
  -- Grupo C
  ('Brasil',            'BRA', 'C'),
  ('Marruecos',         'MAR', 'C'),
  ('Haití',             'HAI', 'C'),
  ('Escocia',           'SCO', 'C'),
  -- Grupo D
  ('Estados Unidos',    'USA', 'D'),
  ('Paraguay',          'PAR', 'D'),
  ('Australia',         'AUS', 'D'),
  ('Turquía',           'TUR', 'D'),
  -- Grupo E
  ('Alemania',          'GER', 'E'),
  ('Curazao',           'CUW', 'E'),
  ('Costa de Marfil',   'CIV', 'E'),
  ('Ecuador',           'ECU', 'E'),
  -- Grupo F
  ('Países Bajos',      'NED', 'F'),
  ('Japón',             'JPN', 'F'),
  ('Suecia',            'SWE', 'F'),
  ('Túnez',             'TUN', 'F'),
  -- Grupo G
  ('Bélgica',           'BEL', 'G'),
  ('Egipto',            'EGY', 'G'),
  ('Irán',              'IRN', 'G'),
  ('Nueva Zelanda',     'NZL', 'G'),
  -- Grupo H
  ('España',            'ESP', 'H'),
  ('Uruguay',           'URU', 'H'),
  ('Arabia Saudita',    'KSA', 'H'),
  ('Cabo Verde',        'CPV', 'H'),
  -- Grupo I
  ('Francia',           'FRA', 'I'),
  ('Senegal',           'SEN', 'I'),
  ('Irak',              'IRQ', 'I'),
  ('Noruega',           'NOR', 'I'),
  -- Grupo J
  ('Argentina',         'ARG', 'J'),
  ('Austria',           'AUT', 'J'),
  ('Argelia',           'ALG', 'J'),
  ('Jordania',          'JOR', 'J'),
  -- Grupo K
  ('Portugal',          'POR', 'K'),
  ('Colombia',          'COL', 'K'),
  ('Uzbekistán',        'UZB', 'K'),
  ('RD Congo',          'COD', 'K'),
  -- Grupo L
  ('Inglaterra',        'ENG', 'L'),
  ('Croacia',           'CRO', 'L'),
  ('Panamá',            'PAN', 'L'),
  ('Ghana',             'GHA', 'L')
ON CONFLICT (abreviatura) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      grupo  = EXCLUDED.grupo;
