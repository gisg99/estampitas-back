-- Página promocional CC (va entre Grupo F y Grupo G)
-- grupo 'FX' ordena lexicográficamente entre 'F' y 'G'
INSERT INTO selecciones (nombre, abreviatura, grupo) VALUES
  ('Página Promo CC', 'CC', 'FX')
ON CONFLICT (abreviatura) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      grupo  = EXCLUDED.grupo;
