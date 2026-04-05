CREATE TABLE IF NOT EXISTS evaluaciones_diagnostico (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES planes_estudio(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  preguntas JSONB NOT NULL,
  respuestas JSONB,
  nota DECIMAL(3,1),
  completada BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
