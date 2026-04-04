CREATE TABLE IF NOT EXISTS planes_estudio (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  evaluacion_id TEXT NOT NULL,
  resumen TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tareas_plan (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES planes_estudio(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  prioridad TEXT DEFAULT 'media',
  descripcion TEXT,
  tiempo_estimado TEXT,
  guia TEXT,
  completada BOOLEAN DEFAULT FALSE,
  orden INTEGER DEFAULT 0
);
