import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import * as THREE from 'three'

export default function Landing() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const statsObservedRef = useRef(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setClearColor(0x080c0a, 1)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.set(0, 0, 28)

        const N = 180
        const geo = new THREE.BufferGeometry()
        const pos = new Float32Array(N * 3)
        const vel: { x: number; y: number }[] = []
        const sizes = new Float32Array(N)

        for (let i = 0; i < N; i++) {
            const spread = 36
            pos[i * 3] = (Math.random() - 0.5) * spread
            pos[i * 3 + 1] = (Math.random() - 0.5) * spread
            pos[i * 3 + 2] = (Math.random() - 0.5) * 8
            vel.push({ x: (Math.random() - 0.5) * 0.012, y: (Math.random() - 0.5) * 0.012 })
            sizes[i] = Math.random() * 2.5 + 0.5
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        const mat = new THREE.PointsMaterial({
            color: 0x4ade80,
            size: 0.18,
            transparent: true,
            opacity: 0.55,
            sizeAttenuation: true
        })

        const particles = new THREE.Points(geo, mat)
        scene.add(particles)

        const lineMat = new THREE.LineBasicMaterial({
            color: 0x4ade80,
            transparent: true,
            opacity: 0.07
        })

        let lineSegs: THREE.LineSegments | null = null

        const buildLines = () => {
            if (lineSegs) { scene.remove(lineSegs); lineSegs.geometry.dispose() }
            const linePos: number[] = []
            const threshold = 7.5
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    const dx = pos[i * 3] - pos[j * 3]
                    const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
                    if (Math.sqrt(dx * dx + dy * dy) < threshold) {
                        linePos.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
                        linePos.push(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2])
                    }
                }
            }
            const lineGeo = new THREE.BufferGeometry()
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3))
            lineSegs = new THREE.LineSegments(lineGeo, lineMat)
            scene.add(lineSegs)
        }

        buildLines()

        const mouse = { x: 0, y: 0 }
        const onMouseMove = (e: MouseEvent) => {
            mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.4
            mouse.y = -(e.clientY / window.innerHeight - 0.5) * 0.4
        }
        window.addEventListener('mousemove', onMouseMove)

        let frame = 0
        let animId: number

        const animate = () => {
            animId = requestAnimationFrame(animate)
            frame++

            for (let i = 0; i < N; i++) {
                pos[i * 3] += vel[i].x
                pos[i * 3 + 1] += vel[i].y
                if (pos[i * 3] > 18) pos[i * 3] = -18
                if (pos[i * 3] < -18) pos[i * 3] = 18
                if (pos[i * 3 + 1] > 18) pos[i * 3 + 1] = -18
                if (pos[i * 3 + 1] < -18) pos[i * 3 + 1] = 18
            }

            geo.attributes.position.needsUpdate = true
            if (frame % 3 === 0) buildLines()

            camera.position.x += (mouse.x - camera.position.x) * 0.03
            camera.position.y += (mouse.y - camera.position.y) * 0.03
            camera.lookAt(0, 0, 0)

            renderer.render(scene, camera)
        }
        animate()

        const onResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight)
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
        }
        window.addEventListener('resize', onResize)

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
            renderer.dispose()
            geo.dispose()
            mat.dispose()
            lineMat.dispose()
        }
    }, [])

    useEffect(() => {
        const countUp = (el: HTMLElement, target: number, duration: number) => {
            let start = 0
            const step = target / (duration / 16)
            const timer = setInterval(() => {
                start = Math.min(start + step, target)
                el.textContent = String(Math.round(start))
                if (start >= target) clearInterval(timer)
            }, 16)
        }

        const statsSection = document.getElementById('stats-section')
        if (!statsSection) return

        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting && !statsObservedRef.current) {
                    statsObservedRef.current = true
                    const s1 = document.getElementById('stat1')
                    const s2 = document.getElementById('stat2')
                    const s3 = document.getElementById('stat3')
                    if (s1) countUp(s1, 7, 1200)
                    if (s2) countUp(s2, 3, 1000)
                    if (s3) countUp(s3, 50, 1400)
                    obs.disconnect()
                }
            })
        }, { threshold: 0.3 })

        obs.observe(statsSection)
        return () => obs.disconnect()
    }, [])

    const games = ['CHESS', 'BADMINTON', 'CARROM', 'TABLE TENNIS', 'CRICKET', 'FOOTBALL', 'CARDS']
    const doubled = [...games, ...games]

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');

                .landing * { box-sizing: border-box; }

                .landing {
                    background: #080c0a;
                    min-height: 100vh;
                    font-family: 'DM Sans', sans-serif;
                    color: #e8f0eb;
                    overflow-x: hidden;
                }

                .bg-canvas {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100vh;
                    z-index: 0;
                    pointer-events: none;
                }

                .land-nav {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 28px 48px;
                }

                .land-logo {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 28px;
                    letter-spacing: 3px;
                    color: #4ade80;
                    text-decoration: none;
                }

                .land-nav-links {
                    display: flex;
                    gap: 36px;
                    align-items: center;
                }

                .land-nav-links a {
                    text-decoration: none;
                    color: #94a89c;
                    font-size: 14px;
                    font-weight: 400;
                    letter-spacing: 0.5px;
                    transition: color 0.2s;
                }

                .land-nav-links a:hover { color: #e8f0eb; }

                .land-btn-nav {
                    background: #4ade80 !important;
                    color: #080c0a !important;
                    padding: 10px 22px !important;
                    border-radius: 100px !important;
                    font-weight: 500 !important;
                    font-size: 13px !important;
                    transition: transform 0.15s, background 0.2s !important;
                }

                .land-btn-nav:hover {
                    background: #86efac !important;
                    transform: translateY(-1px);
                    color: #080c0a !important;
                }

                .land-hero {
                    position: relative;
                    z-index: 5;
                    min-height: calc(100vh - 88px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 0 24px 80px;
                }

                .land-hero-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(74, 222, 128, 0.08);
                    border: 1px solid rgba(74, 222, 128, 0.2);
                    border-radius: 100px;
                    padding: 6px 16px;
                    font-size: 12px;
                    color: #4ade80;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin-bottom: 32px;
                    animation: lfadeUp 0.8s ease both;
                }

                .land-tag-dot {
                    width: 6px; height: 6px;
                    background: #4ade80;
                    border-radius: 50%;
                    animation: lpulse 2s ease infinite;
                }

                .land-hero-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: clamp(72px, 12vw, 140px);
                    line-height: 0.92;
                    letter-spacing: 2px;
                    color: #f0f7f2;
                    margin-bottom: 28px;
                    animation: lfadeUp 0.8s 0.1s ease both;
                }

                .land-hero-title .green-word {
                    color: #4ade80;
                    position: relative;
                    display: inline-block;
                }

                .land-hero-title .green-word::after {
                    content: '';
                    position: absolute;
                    bottom: 4px; left: 0; right: 0;
                    height: 4px;
                    background: #4ade80;
                    border-radius: 2px;
                    transform: scaleX(0);
                    transform-origin: left;
                    animation: lunderline 0.6s 1s ease forwards;
                }

                .land-hero-sub {
                    max-width: 520px;
                    font-size: 17px;
                    line-height: 1.7;
                    color: #7a9482;
                    margin-bottom: 44px;
                    font-weight: 300;
                    animation: lfadeUp 0.8s 0.2s ease both;
                }

                .land-hero-cta {
                    display: flex;
                    gap: 14px;
                    align-items: center;
                    animation: lfadeUp 0.8s 0.3s ease both;
                }

                .land-btn-primary {
                    background: #4ade80;
                    color: #080c0a;
                    padding: 15px 32px;
                    border-radius: 100px;
                    font-size: 15px;
                    font-weight: 500;
                    text-decoration: none;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.15s, box-shadow 0.2s;
                    letter-spacing: 0.3px;
                    font-family: 'DM Sans', sans-serif;
                }

                .land-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(74, 222, 128, 0.3);
                }

                .land-btn-ghost {
                    color: #94a89c;
                    font-size: 15px;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    transition: color 0.2s;
                }

                .land-btn-ghost:hover { color: #e8f0eb; }

                .land-arrow {
                    width: 18px; height: 18px;
                    border: 1px solid currentColor;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    transition: transform 0.2s;
                }

                .land-btn-ghost:hover .land-arrow { transform: rotate(45deg); }

                .land-scroll-hint {
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    color: #3d5445;
                    font-size: 11px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    animation: lfadeUp 1s 1s ease both;
                }

                .land-scroll-line {
                    width: 1px; height: 40px;
                    background: linear-gradient(to bottom, #4ade80, transparent);
                    animation: lscrollpulse 2s ease infinite;
                }

                .land-marquee-section {
                    position: relative;
                    z-index: 5;
                    background: #080c0a;
                    padding: 0 0 0;
                }

                .land-marquee-wrap {
                    overflow: hidden;
                    border-top: 1px solid #1a2a1f;
                    border-bottom: 1px solid #1a2a1f;
                    padding: 20px 0;
                }

                .land-marquee-track {
                    display: flex;
                    animation: lmarquee 22s linear infinite;
                    width: max-content;
                }

                .land-game-pill {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 36px;
                    border-right: 1px solid #1a2a1f;
                    white-space: nowrap;
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 22px;
                    letter-spacing: 2px;
                    color: #2a4a32;
                }

                .land-game-pill.hl { color: #4ade80; }

                .land-pill-dot {
                    width: 5px; height: 5px;
                    border-radius: 50%;
                    background: currentColor;
                    opacity: 0.5;
                }

                .land-features {
                    position: relative;
                    z-index: 5;
                    background: #080c0a;
                    padding: 120px 48px;
                }

                .land-section-label {
                    text-align: center;
                    font-size: 11px;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    color: #4ade80;
                    margin-bottom: 16px;
                }

                .land-section-title {
                    font-family: 'Bebas Neue', sans-serif;
                    text-align: center;
                    font-size: clamp(40px, 6vw, 72px);
                    letter-spacing: 1px;
                    color: #f0f7f2;
                    margin-bottom: 72px;
                    line-height: 1;
                }

                .land-features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2px;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .land-feature-card {
                    background: #0d1410;
                    padding: 40px 32px;
                    border: 1px solid #1a2a1f;
                    transition: border-color 0.3s, background 0.3s;
                }

                .land-feature-card:hover {
                    border-color: rgba(74, 222, 128, 0.25);
                    background: #0f1a13;
                }

                .land-feature-card:first-child { border-radius: 16px 0 0 16px; }
                .land-feature-card:last-child { border-radius: 0 16px 16px 0; }

                .land-feature-icon {
                    width: 44px; height: 44px;
                    background: rgba(74, 222, 128, 0.08);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    font-size: 20px;
                }

                .land-feature-name {
                    font-size: 18px;
                    font-weight: 500;
                    color: #e8f0eb;
                    margin-bottom: 10px;
                }

                .land-feature-desc {
                    font-size: 14px;
                    color: #5a7a62;
                    line-height: 1.7;
                    font-weight: 300;
                }

                .land-stats {
                    position: relative;
                    z-index: 5;
                    background: #080c0a;
                    padding: 80px 48px 120px;
                }

                .land-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    max-width: 900px;
                    margin: 0 auto;
                    border: 1px solid #1a2a1f;
                    border-radius: 20px;
                    overflow: hidden;
                }

                .land-stat-item {
                    background: #0d1410;
                    padding: 48px 40px;
                    text-align: center;
                    border-right: 1px solid #1a2a1f;
                }

                .land-stat-item:last-child { border-right: none; }

                .land-stat-num {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 64px;
                    letter-spacing: 1px;
                    color: #4ade80;
                    line-height: 1;
                    margin-bottom: 8px;
                }

                .land-stat-label {
                    font-size: 13px;
                    color: #4a6a52;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    font-weight: 300;
                }

                .land-cta-section {
                    position: relative;
                    z-index: 5;
                    background: #080c0a;
                    padding: 40px 48px 100px;
                    text-align: center;
                }

                .land-cta-box {
                    max-width: 700px;
                    margin: 0 auto;
                    background: #0d1410;
                    border: 1px solid #1a2a1f;
                    border-radius: 28px;
                    padding: 72px 48px;
                    position: relative;
                    overflow: hidden;
                }

                .land-cta-glow {
                    position: absolute;
                    top: -60px; left: 50%;
                    transform: translateX(-50%);
                    width: 200px; height: 200px;
                    background: radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }

                .land-cta-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: clamp(40px, 6vw, 64px);
                    letter-spacing: 1px;
                    color: #f0f7f2;
                    margin-bottom: 16px;
                    line-height: 1;
                }

                .land-cta-sub {
                    font-size: 16px;
                    color: #5a7a62;
                    margin-bottom: 36px;
                    font-weight: 300;
                }

                .land-footer {
                    position: relative;
                    z-index: 5;
                    background: #080c0a;
                    border-top: 1px solid #111e14;
                    padding: 28px 48px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .land-footer-logo {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 20px;
                    letter-spacing: 3px;
                    color: #2a4a32;
                }

                .land-footer-copy {
                    font-size: 12px;
                    color: #2a4a32;
                }

                @keyframes lfadeUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                @keyframes lpulse {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.3; }
                }

                @keyframes lunderline {
                    to { transform: scaleX(1); }
                }

                @keyframes lscrollpulse {
                    0%, 100% { opacity: 0.3; }
                    50%       { opacity: 1; }
                }

                @keyframes lmarquee {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-50%); }
                }

                @media (max-width: 768px) {
                    .land-nav { padding: 20px 24px; }
                    .land-nav-links { gap: 16px; }
                    .land-features { padding: 80px 24px; }
                    .land-features-grid { grid-template-columns: 1fr; gap: 2px; }
                    .land-feature-card:first-child { border-radius: 16px 16px 0 0; }
                    .land-feature-card:last-child { border-radius: 0 0 16px 16px; }
                    .land-stats { padding: 60px 24px 80px; }
                    .land-stats-grid { grid-template-columns: 1fr; }
                    .land-stat-item { border-right: none; border-bottom: 1px solid #1a2a1f; }
                    .land-stat-item:last-child { border-bottom: none; }
                    .land-cta-section { padding: 40px 24px 80px; }
                    .land-cta-box { padding: 48px 28px; }
                    .land-footer { padding: 24px; flex-direction: column; gap: 8px; }
                    .land-hero-cta { flex-direction: column; }
                }
            `}</style>

            <div className="landing">
                <canvas ref={canvasRef} className="bg-canvas" />

                <nav className="land-nav">
                    <Link to="/" className="land-logo">LOCALPLAY</Link>
                    <div className="land-nav-links">
                        <a href="#features">How it works</a>
                        <a href="#games">Games</a>
                        <Link to="/register" className="land-btn-nav">Get started</Link>
                    </div>
                </nav>

                <section className="land-hero">
                    <div className="land-hero-tag">
                        <div className="land-tag-dot" />
                        Now live in your neighbourhood
                    </div>
                    <h1 className="land-hero-title">
                        FIND YOUR<br />
                        <span className="green-word">GAME</span><br />
                        PARTNER
                    </h1>
                    <p className="land-hero-sub">
                        Connect with players near you for chess, badminton, carrom and more.
                        No more empty courts. No more playing alone.
                    </p>
                    <div className="land-hero-cta">
                        <Link to="/register" className="land-btn-primary">
                            Find players near me
                        </Link>
                        <Link to="/login" className="land-btn-ghost">
                            Already have an account
                            <div className="land-arrow">↗</div>
                        </Link>
                    </div>
                    <div className="land-scroll-hint">
                        <div className="land-scroll-line" />
                        scroll
                    </div>
                </section>

                <div className="land-marquee-section" id="games">
                    <div className="land-marquee-wrap">
                        <div className="land-marquee-track">
                            {doubled.map((game, i) => (
                                <div
                                    key={i}
                                    className={`land-game-pill${i % 2 === 0 ? ' hl' : ''}`}
                                >
                                    <div className="land-pill-dot" />
                                    {game}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <section className="land-features" id="features">
                    <div className="land-section-label">Why LocalPlay</div>
                    <h2 className="land-section-title">BUILT FOR PLAYERS</h2>
                    <div className="land-features-grid">
                        {[
                            {
                                icon: '📍',
                                name: 'Nearby discovery',
                                desc: 'Find players within walking distance using real geolocation. No fake results, no out-of-city matches.'
                            },
                            {
                                icon: '🎯',
                                name: 'Skill matching',
                                desc: 'Set your level per game. A chess beginner can be a cricket pro. We match accordingly.'
                            },
                            {
                                icon: '⚡',
                                name: 'Instant requests',
                                desc: 'Send play requests in seconds. Pick the game, time and location. Accept or decline with one tap.'
                            }
                        ].map(f => (
                            <div key={f.name} className="land-feature-card">
                                <div className="land-feature-icon">{f.icon}</div>
                                <div className="land-feature-name">{f.name}</div>
                                <div className="land-feature-desc">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="land-stats" id="stats-section">
                    <div className="land-stats-grid">
                        <div className="land-stat-item">
                            <div className="land-stat-num" id="stat1">0</div>
                            <div className="land-stat-label">Games supported</div>
                        </div>
                        <div className="land-stat-item">
                            <div className="land-stat-num" id="stat2">0</div>
                            <div className="land-stat-label">Skill levels</div>
                        </div>
                        <div className="land-stat-item">
                            <div className="land-stat-num" id="stat3">0</div>
                            <div className="land-stat-label">km max search radius</div>
                        </div>
                    </div>
                </section>

                <section className="land-cta-section">
                    <div className="land-cta-box">
                        <div className="land-cta-glow" />
                        <h2 className="land-cta-title">READY TO PLAY?</h2>
                        <p className="land-cta-sub">
                            Create your profile in 60 seconds. Your next opponent is already nearby.
                        </p>
                        <Link to="/register" className="land-btn-primary">
                            Create free account
                        </Link>
                    </div>
                </section>

                <footer className="land-footer">
                    <div className="land-footer-logo">LOCALPLAY</div>
                    <div className="land-footer-copy">© 2026 LocalPlay. Find your game.</div>
                </footer>
            </div>
        </>
    )
}