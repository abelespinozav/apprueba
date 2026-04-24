import { useState, useEffect, useRef } from 'react'

const features = [
  { emoji: '🧠', tag: 'Plan IA', title: 'Plan de estudio personalizado', desc: 'Sube tu material y la IA reparte las tareas en tus días libres antes del examen.', color: '#6c63ff', tagBg: 'rgba(108,99,255,0.15)', tagColor: '#a78bfa' },
  { emoji: '⚡', tag: 'Quiz', title: 'Quiz instantáneo', desc: '20 preguntas generadas desde tu propio material. Estudia más inteligente.', color: '#fbbf24', tagBg: 'rgba(251,191,36,0.12)', tagColor: '#fbbf24' },
  { emoji: '🎙️', tag: 'Podcast', title: 'Podcast de estudio', desc: 'Convierte tus apuntes en un podcast con dos voces. Aprende en la micro.', color: '#34d399', tagBg: 'rgba(52,211,153,0.12)', tagColor: '#34d399' },
  { emoji: '📄', tag: 'Ejercicios', title: 'Ejercicios PDF', desc: '3 niveles de dificultad listos para imprimir o estudiar desde el celu.', color: '#f87171', tagBg: 'rgba(248,113,113,0.12)', tagColor: '#f87171' },
]

const phrases = [
  'Generando tu plan de estudio...',
  'Creando quiz de Cálculo II...',
  'Produciendo podcast de Biología...',
  'Generando ejercicios PDF...',
]

const unis = ['UFRO','U. de Chile','PUC','USACH','UdeC','PUCV','UAH','UBB','INACAP','Santo Tomás','Duoc UC','UTEM']

export default function LandingPage({ onEntrar }) {
  const [slide, setSlide] = useState(0)
  const [typingText, setTypingText] = useState('')
  const [counter, setCounter] = useState(0)
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  // Typing effect
  useEffect(() => {
    let pi = 0, ci = 0, deleting = false
    let timeout
    function loop() {
      const phrase = phrases[pi]
      if (!deleting) {
        setTypingText(phrase.slice(0, ci++))
        if (ci > phrase.length) { deleting = true; timeout = setTimeout(loop, 1200); return }
      } else {
        setTypingText(phrase.slice(0, ci--))
        if (ci < 0) { deleting = false; pi = (pi + 1) % phrases.length; ci = 0; timeout = setTimeout(loop, 400); return }
      }
      timeout = setTimeout(loop, deleting ? 30 : 55)
    }
    loop()
    return () => clearTimeout(timeout)
  }, [])

  // Slider auto
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % features.length), 3200)
    return () => clearInterval(t)
  }, [])

  // Counter animation
  useEffect(() => {
    let val = 0
    const target = 47
    const step = target / (1500 / 16)
    const t = setInterval(() => {
      val = Math.min(val + step, target)
      setCounter(Math.floor(val))
      if (val >= target) clearInterval(t)
    }, 16)
    return () => clearInterval(t)
  }, [])

  // Particles canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const colors = ['rgba(108,99,255,', 'rgba(96,165,250,', 'rgba(52,211,153,', 'rgba(251,191,36,']
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.1,
    }))

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.alpha + ')'
        ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 60) {
            ctx.beginPath()
            ctx.strokeStyle = 'rgba(108,99,255,' + (0.08 * (1 - dist / 60)) + ')'
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const handleEntrar = () => {
    localStorage.setItem('landing_seen', '1')
    onEntrar()
  }

  const f = features[slide]

  return (
    <div style={{ minHeight: '100vh', background: '#08080f', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes auroraFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.05)} }
        @keyframes logoShimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes btnShine { 0%{left:-100%} 100%{left:200%} }
        @keyframes badgePulse { 0%,100%{box-shadow:0 0 0 0 rgba(108,99,255,0.3)} 50%{box-shadow:0 0 0 8px rgba(108,99,255,0)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .cta-btn-main { position:relative;overflow:hidden; }
        .cta-btn-main::before { content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);animation:btnShine 2.5s infinite; }
        .gc:hover { transform: translateY(-3px); }
      `}</style>

      {/* Canvas partículas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Aurora blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {[
          { w: 320, h: 320, top: '-100px', left: '-80px', bg: 'rgba(108,99,255,0.2)', delay: '0s' },
          { w: 280, h: 280, top: '200px', right: '-100px', bg: 'rgba(46,125,209,0.16)', delay: '-2s' },
          { w: 220, h: 220, bottom: '300px', left: '40px', bg: 'rgba(52,211,153,0.1)', delay: '-4s' },
          { w: 180, h: 180, bottom: '100px', right: '20px', bg: 'rgba(251,191,36,0.08)', delay: '-1s' },
        ].map((b, i) => (
          <div key={i} style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', width: b.w, height: b.h, top: b.top, left: b.left, right: b.right, bottom: b.bottom, background: b.bg, animation: `auroraFloat 6s ease-in-out ${b.delay} infinite` }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', paddingBottom: 60 }}>

        {/* Navbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#6c63ff,#60a5fa,#34d399)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', animation: 'logoShimmer 3s ease infinite' }}>APPrueba</div>
          <button onClick={handleEntrar} style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: 20, padding: '8px 16px', color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Ingresar →</button>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '32px 24px 0', animation: 'fadeUp 0.6s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 20, padding: '7px 16px', marginBottom: 22, fontSize: 10, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em', textTransform: 'uppercase', animation: 'badgePulse 3s ease-in-out infinite' }}>
            ✨ IA para universitarios chilenos
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.04em', marginBottom: 18 }}>
            Estudia menos,<br />
            <span style={{ background: 'linear-gradient(135deg,#6c63ff 0%,#60a5fa 40%,#34d399 100%)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', animation: 'gradShift 4s ease infinite' }}>aprende más</span>
          </h1>

          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24, padding: '0 8px' }}>
            APPrueba organiza tus ramos y crea planes de estudio personalizados con IA para que llegues listo a cada prueba.
          </p>

          {/* Typing */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', marginBottom: 24, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            📚 {typingText}<span style={{ display: 'inline-block', width: 2, height: 16, background: '#6c63ff', borderRadius: 1, animation: 'blink 1s infinite', verticalAlign: 'middle', marginLeft: 2 }} />
          </div>

          <button onClick={handleEntrar} className="cta-btn-main" style={{ width: '100%', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', border: 'none', borderRadius: 16, padding: 17, color: 'white', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 32px rgba(108,99,255,0.45)', marginBottom: 8 }}>
            Empezar gratis 🚀
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginBottom: 32 }}>Sin tarjeta · Solo necesitas tu cuenta Google</p>
        </div>

        {/* Slider */}
        <div style={{ overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ display: 'flex', transform: `translateX(-${slide * 100}%)`, transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
            {features.map((feat, i) => (
              <div key={i} style={{ minWidth: '100%', padding: '0 24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${feat.color}40`, borderRadius: 20, padding: 22, position: 'relative', overflow: 'hidden', transition: 'border-color 0.4s' }}>
                  <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: feat.color, filter: 'blur(40px)', opacity: 0.35 }} />
                  <div style={{ fontSize: 38, marginBottom: 12 }}>{feat.emoji}</div>
                  <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 20, marginBottom: 10, background: feat.tagBg, color: feat.tagColor }}>{feat.tag}</div>
                  <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, color: 'white' }}>{feat.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {features.map((feat, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{ height: 5, width: i === slide ? 22 : 5, borderRadius: 99, border: 'none', cursor: 'pointer', background: i === slide ? feat.color : 'rgba(255,255,255,0.15)', transition: 'all 0.4s', padding: 0 }} />
          ))}
        </div>

        {/* Grid */}
        <div style={{ padding: '0 24px', marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 14 }}>Todo lo que necesitas</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { emoji: '🧠', title: 'Plan IA', desc: 'Plan personalizado desde tu material', bg: 'rgba(108,99,255,0.08)', line: '#6c63ff' },
              { emoji: '⚡', title: 'Quiz', desc: '20 preguntas desde tus apuntes', bg: 'rgba(251,191,36,0.07)', line: '#fbbf24' },
              { emoji: '🎙️', title: 'Podcast', desc: 'Estudia escuchando, en cualquier lugar', bg: 'rgba(52,211,153,0.07)', line: '#34d399' },
              { emoji: '📄', title: 'Ejercicios PDF', desc: '3 niveles listos para imprimir', bg: 'rgba(248,113,113,0.07)', line: '#f87171' },
            ].map((g, i) => (
              <div key={i} className="gc" style={{ background: g.bg, borderRadius: 16, padding: '14px 12px', border: '1px solid rgba(255,255,255,0.06)', transition: 'transform 0.2s', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${g.line},transparent)`, opacity: 0.6 }} />
                <div style={{ fontSize: 24, marginBottom: 8 }}>{g.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 3 }}>{g.title}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{g.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '0 24px', marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'linear-gradient(135deg,rgba(108,99,255,0.1),rgba(46,125,209,0.07))', border: '1px solid rgba(108,99,255,0.18)', borderRadius: 20, padding: '20px 16px', textAlign: 'center' }}>
            {[
              { n: counter, label: 'Estudiantes' },
              { n: '100%', label: 'Gratis ahora' },
              { n: '🇨🇱', label: 'Hecho en Chile' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 4 }}>{s.n}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee universidades */}
        <div style={{ padding: '0 24px', marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 14 }}>Compatible con tu universidad</p>
        </div>
        <div style={{ overflow: 'hidden', marginBottom: 28, WebkitMaskImage: 'linear-gradient(90deg,transparent,black 10%,black 90%,transparent)', maskImage: 'linear-gradient(90deg,transparent,black 10%,black 90%,transparent)' }}>
          <div style={{ display: 'flex', gap: 8, width: 'max-content', animation: 'marquee 18s linear infinite' }}>
            {[...unis, ...unis].map((u, i) => (
              <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '6px 14px', fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{u}</span>
            ))}
          </div>
        </div>

        {/* Testimonios */}
        <div style={{ padding: '0 24px', marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 14 }}>Lo que dicen los estudiantes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { avatar: '👩‍🎓', avatarBg: 'rgba(108,99,255,0.15)', name: 'Coni Vásquez', uni: 'U. Mayor · Ed. Diferencial', text: '"Subí mis apuntes de Psicopedagogía y me armó un plan con tareas claras para cada día. Llegué súper preparada al examen 🎉"' },
              { avatar: '👨‍💻', avatarBg: 'rgba(52,211,153,0.12)', name: 'Benja Espinoza', uni: 'UFRO · Informática', text: '"El podcast es lo mejor. Escucho el resumen mientras voy en la micro. Le ganó a repasar con flashcards."' },
            ].map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.1)' }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>{t.uni}</div>
                  <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 6 }}>★★★★★</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{t.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div style={{ margin: '0 24px 28px', textAlign: 'center', padding: '36px 20px', background: 'linear-gradient(135deg,rgba(108,99,255,0.18),rgba(139,92,246,0.12))', border: '1px solid rgba(108,99,255,0.28)', borderRadius: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: 'rgba(108,99,255,0.2)', filter: 'blur(50px)' }} />
          <div style={{ position: 'relative' }}>
            <img src="/icon-192.png" alt="APPrueba" style={{ width: 72, height: 72, borderRadius: 18, marginBottom: 16, boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }} />
            <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 10 }}>¿Listo para sacar mejores notas?</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 24 }}>Únete a los primeros estudiantes que ya estudian con IA. Los primeros 50 son fundadores para siempre.</p>
            <button onClick={handleEntrar} className="cta-btn-main" style={{ width: '100%', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', border: 'none', borderRadius: 16, padding: 16, color: 'white', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }}>
              Empezar ahora — es gratis 🚀
            </button>
          </div>
        </div>

        {/* CTA planes */}
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
            ¿Listo para estudiar más inteligente? 🚀
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            Empieza gratis o elige el plan que más te acomoda.
          </p>
          <a href="/planes" style={{
            display: 'inline-block', background: '#6366f1', color: '#fff',
            fontWeight: 700, fontSize: 15, padding: '14px 36px',
            borderRadius: 99, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
          }}>
            Ver planes →
          </a>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>Hecho con ❤️ en Chile · apprueba.com</div>
      </div>
    </div>
  )
}
