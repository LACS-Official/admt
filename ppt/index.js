const VS = `attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}`;

const FS = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_dark;
uniform vec3 u_accent;

float gridLine(vec2 uv, float spacing, float thickness){
  vec2 g = abs(fract(uv / spacing) - 0.5);
  float d = min(g.x, g.y);
  return 1.0 - smoothstep(thickness - 0.005, thickness + 0.005, d);
}

float dot2(vec2 p){ return dot(p,p); }

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = uv;
  p.x *= aspect;

  vec2 drift = vec2(u_time * 0.008, u_time * 0.005);
  vec2 gp = p + drift;

  float mainGrid = gridLine(gp, 0.12, 0.012);
  float subGrid = gridLine(gp, 0.024, 0.04) * 0.4;

  vec2 m = u_mouse;
  m.x *= aspect;
  float md = length(p - m);
  float mInfluence = exp(-md * 4.0) * 0.5;

  float gridStrength = (mainGrid + subGrid * 0.5) * (0.45 + mInfluence);

  vec2 dotGrid = fract(gp * 50.0) - 0.5;
  float dotMask = 1.0 - smoothstep(0.05, 0.14, length(dotGrid));
  float wave = sin(gp.x * 1.4 + u_time * 0.15) * cos(gp.y * 1.6 - u_time * 0.12);
  dotMask *= smoothstep(-0.3, 0.6, wave) * 0.6;

  vec3 lineColor = mix(vec3(0.08), vec3(0.92), u_dark);
  vec3 bgColor = mix(vec3(0.97, 0.97, 0.96), vec3(0.06, 0.06, 0.07), u_dark);

  vec3 col = bgColor;
  col = mix(col, lineColor, gridStrength * 0.55);
  col = mix(col, lineColor, dotMask * 0.35);
  col = mix(col, u_accent, mInfluence * 0.18);

  gl_FragColor = vec4(col, 1.0);
}`;

const mouse = { x: 0.5, y: 0.5 };
addEventListener('mousemove', e => { mouse.x = e.clientX / innerWidth; mouse.y = 1 - e.clientY / innerHeight });

function bootGL(canvasId, fsSrc) {
    const canvas = document.getElementById(canvasId);
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return () => false;
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); return sh };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const lRes = gl.getUniformLocation(prog, 'u_resolution');
    const lT = gl.getUniformLocation(prog, 'u_time');
    const lM = gl.getUniformLocation(prog, 'u_mouse');
    const lD = gl.getUniformLocation(prog, 'u_dark');
    const lA = gl.getUniformLocation(prog, 'u_accent');
    const resize = () => {
        const d = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = innerWidth * d; canvas.height = innerHeight * d;
        gl.viewport(0, 0, canvas.width, canvas.height);
    };
    addEventListener('resize', resize); resize();

    function readAccent() {
        const cs = getComputedStyle(document.documentElement);
        const hex = cs.getPropertyValue('--accent').trim() || '#002FA7';
        const m = hex.match(/^#([0-9a-f]{6})$/i);
        if (!m) return [0, 0.18, 0.65];
        const n = parseInt(m[1], 16);
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    let accent = readAccent();
    let dark = 0;

    return (tSec, isDark) => {
        if (isDark !== undefined) dark = isDark ? 1 : 0;
        accent = readAccent();
        gl.uniform2f(lRes, canvas.width, canvas.height);
        gl.uniform1f(lT, tSec);
        gl.uniform2f(lM, mouse.x, mouse.y);
        gl.uniform1f(lD, dark);
        gl.uniform3f(lA, accent[0], accent[1], accent[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return true;
    };
}

let darkMode = false;
let gridCtrl = null, gridRAF = 0, gridT0 = Date.now();
function startGrid() {
    if (document.body.classList.contains('canvas-mode') || window.__lowPowerMode || gridRAF) return;
    if (!gridCtrl) gridCtrl = bootGL('bg-grid', FS);
    if (!gridCtrl) return;
    gridT0 = Date.now();
    function loop() {
        if (window.__lowPowerMode) { gridRAF = 0; return; }
        const t = (Date.now() - gridT0) / 1000;
        gridCtrl(t, darkMode);
        gridRAF = requestAnimationFrame(loop);
    }
    gridRAF = requestAnimationFrame(loop);
}
function stopGrid() {
    if (gridRAF) cancelAnimationFrame(gridRAF);
    gridRAF = 0;
}

addEventListener('swiss-low-power-change', e => { e.detail.on ? stopGrid() : startGrid(); });

const deck = document.getElementById('deck');
const slides = deck.querySelectorAll('.slide');
const nav = document.getElementById('nav');
let idx = 0, total = slides.length, lock = false;

deck.style.width = (total * 100) + 'vw';

slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'dot'; b.dataset.i = i; b.setAttribute('aria-label', 'Page ' + (i + 1));
    b.onclick = () => go(i);
    nav.appendChild(b);
});

function go(n) {
    if (lock) return;
    idx = Math.max(0, Math.min(total - 1, n));
    window.__currentSlideIndex = idx;
    deck.style.transform = `translateX(${-idx * 100}vw)`;
    nav.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    const el = slides[idx];
    const isDark = el.classList.contains('dark') || el.classList.contains('accent');
    document.body.classList.toggle('dark-bg', isDark);
    darkMode = isDark;
    if (window.__playSlide) setTimeout(() => window.__playSlide(idx), 450);
    lock = true; setTimeout(() => lock = false, 700);
}

let overviewOn = false;
const ov = document.createElement('div');
ov.id = 'overview';
ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(250,250,248,.96);backdrop-filter:blur(12px);display:none;overflow-y:auto;padding:4vh 4vw';
document.body.appendChild(ov);

function buildOverview() {
    ov.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:2vh 1.6vw;max-width:90vw;margin:0 auto';
    slides.forEach((s, i) => {
        const card = document.createElement('div');
        card.style.cssText = 'cursor:pointer;overflow:hidden;border:2px solid ' + (i === idx ? 'var(--accent)' : 'rgba(0,0,0,.12)') + ';transition:border-color .2s';
        card.onmouseenter = () => card.style.borderColor = 'rgba(0,0,0,.4)';
        card.onmouseleave = () => card.style.borderColor = i === idx ? 'var(--accent)' : 'rgba(0,0,0,.12)';
        const wrap = document.createElement('div');
        const isDark = s.classList.contains('dark') || s.classList.contains('accent');
        wrap.style.cssText = 'width:100%;aspect-ratio:16/9;overflow:hidden;position:relative;pointer-events:none;background:' + (isDark ? 'var(--ink)' : 'var(--paper)');
        const clone = s.cloneNode(true);
        clone.style.cssText = 'width:100vw;height:100vh;transform:scale(' + (1 / 4.5) + ');transform-origin:top left;position:absolute;top:0;left:0;pointer-events:none';
        wrap.appendChild(clone);
        const label = document.createElement('div');
        label.style.cssText = 'padding:6px 10px;font-family:var(--mono);font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink);opacity:.7';
        label.textContent = (i + 1) + ' / ' + total;
        card.appendChild(wrap);
        card.appendChild(label);
        card.onclick = () => { toggleOverview(); go(i) };
        grid.appendChild(card);
    });
    ov.appendChild(grid);
}

function toggleOverview() {
    overviewOn = !overviewOn;
    if (overviewOn) { buildOverview(); ov.style.display = 'block'; }
    else { ov.style.display = 'none'; }
}

addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); toggleOverview(); return; }
    if (e.key && e.key.toLowerCase() === 'b' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        window.__setLowPowerMode(!window.__lowPowerMode);
        return;
    }
    if (overviewOn) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'ArrowDown') {
        if (window.__pipeAdvance && window.__pipeAdvance()) return;
        go(idx + 1);
        return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'ArrowUp') go(idx - 1);
    if (e.key === 'Home') go(0);
    if (e.key === 'End') go(total - 1);
});

let wheelTO = null, wheelAcc = 0;
addEventListener('wheel', e => {
    wheelAcc += e.deltaY + e.deltaX;
    if (Math.abs(wheelAcc) > 50) {
        if (wheelAcc > 0 && window.__pipeAdvance && window.__pipeAdvance()) {
            wheelAcc = 0;
        } else {
            go(idx + (wheelAcc > 0 ? 1 : -1)); wheelAcc = 0;
        }
    }
    clearTimeout(wheelTO); wheelTO = setTimeout(() => wheelAcc = 0, 150);
}, { passive: true });

let tx = 0, ty = 0;
addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY }, { passive: true });
addEventListener('touchend', e => {
    const dx = (e.changedTouches[0].clientX - tx);
    const dy = (e.changedTouches[0].clientY - ty);
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0 && window.__pipeAdvance && window.__pipeAdvance()) return;
        go(idx + (dx < 0 ? 1 : -1));
    }
}, { passive: true });

const initialSlideParam = new URLSearchParams(location.search).get('slide');
const initialSlide = initialSlideParam ? Number(initialSlideParam) - 1 : 0;
go(Number.isFinite(initialSlide) ? initialSlide : 0);

// ASCII Canvas Animation
(function () {
    const canvases = document.querySelectorAll('canvas.ascii-bg');
    if (!canvases.length) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    const grids = [];

    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        let width, height, cols, rows;
        let grid = [];

        function resize() {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
            cols = Math.floor(width / 14);
            rows = Math.floor(height / 20);
            grid = [];
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    grid.push({
                        x: x * 14 + 7,
                        y: y * 20 + 15,
                        char: chars[Math.floor(Math.random() * chars.length)],
                        phase: Math.random() * Math.PI * 2
                    });
                }
            }
        }

        resize();
        window.addEventListener('resize', resize);
        grids.push({ ctx, grid, width, height });
    });

    let frame = 0;
    function animate() {
        if (window.__lowPowerMode) {
            requestAnimationFrame(animate);
            return;
        }

        frame++;
        if (frame % 2 === 0) {
            const t = Date.now() * 0.001;
            grids.forEach(({ ctx, grid, width, height }) => {
                ctx.clearRect(0, 0, width, height);
                ctx.font = '12px JetBrains Mono';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                grid.forEach(cell => {
                    const brightness = 0.3 + 0.7 * Math.sin(t + cell.phase);
                    ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.4})`;
                    ctx.fillText(cell.char, cell.x, cell.y);

                    if (Math.random() < 0.02) {
                        cell.char = chars[Math.floor(Math.random() * chars.length)];
                    }
                });
            });
        }
        requestAnimationFrame(animate);
    }
    animate();
})();

// Motion One animations
(function () {
    if (typeof window.Motion === 'undefined') {
        window.Motion = {
            animate: (el, keyframes, options) => {
                el.style.opacity = keyframes.opacity ? keyframes.opacity[keyframes.opacity.length - 1] : 1;
                el.style.transform = 'none';
                return { finished: Promise.resolve() };
            }
        };
    }

    const recipes = {
        'hero': (slide) => {
            const kicker = slide.querySelector('[data-anim="kicker"]');
            const title = slide.querySelector('[data-anim="title"]');
            const lead = slide.querySelector('[data-anim="lead"]');
            const bottom = slide.querySelector('[data-anim="bottom"]');

            if (kicker) {
                kicker.style.opacity = '0';
                kicker.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    kicker.style.transition = 'all 0.7s cubic-bezier(0,0,.3,1)';
                    kicker.style.opacity = '1';
                    kicker.style.transform = 'translateY(0)';
                }, 100);
            }

            if (title) {
                title.style.opacity = '0';
                title.style.transform = 'translateY(30px)';
                setTimeout(() => {
                    title.style.transition = 'all 0.9s cubic-bezier(0,0,.3,1)';
                    title.style.opacity = '1';
                    title.style.transform = 'translateY(0)';
                }, 300);
            }

            if (lead) {
                lead.style.opacity = '0';
                setTimeout(() => {
                    lead.style.transition = 'opacity 0.6s ease';
                    lead.style.opacity = '1';
                }, 600);
            }

            if (bottom) {
                bottom.style.opacity = '0';
                setTimeout(() => {
                    bottom.style.transition = 'opacity 0.6s ease';
                    bottom.style.opacity = '1';
                }, 800);
            }
        },

        'statement-rise': (slide) => {
            const statement = slide.querySelector('.h-statement');
            if (statement) {
                statement.style.opacity = '0';
                statement.style.transform = 'translateY(40px)';
                setTimeout(() => {
                    statement.style.transition = 'all 0.8s cubic-bezier(0,0,.3,1)';
                    statement.style.opacity = '1';
                    statement.style.transform = 'translateY(0)';
                }, 200);
            }
        },

        'grid-reveal': (slide) => {
            const cards = slide.querySelectorAll('.sub-card, .stack-block');
            cards.forEach((card, i) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.5s cubic-bezier(0,0,.3,1)';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100 + i * 80);
            });
        },

        'tower-grow': (slide) => {
            const towers = slide.querySelectorAll('.bar-tower');
            towers.forEach((tower, i) => {
                const body = tower.querySelector('.body-block');
                if (body) {
                    body.style.transform = 'scaleY(0)';
                    body.style.transformOrigin = 'bottom';
                    setTimeout(() => {
                        body.style.transition = 'transform 0.8s cubic-bezier(0,0,.3,1)';
                        body.style.transform = 'scaleY(1)';
                    }, 200 + i * 150);
                }
            });
        },

        'duo-mirror': (slide) => {
            const cols = slide.querySelectorAll('.duo-compare .col');
            const vrule = slide.querySelector('.vrule');

            if (vrule) {
                vrule.style.transform = 'scaleY(0)';
                setTimeout(() => {
                    vrule.style.transition = 'transform 0.6s cubic-bezier(0,0,.3,1)';
                    vrule.style.transform = 'scaleY(1)';
                }, 100);
            }

            cols.forEach((col, i) => {
                col.style.opacity = '0';
                col.style.transform = i === 0 ? 'translateX(-30px)' : 'translateX(30px)';
                setTimeout(() => {
                    col.style.transition = 'all 0.7s cubic-bezier(0,0,.3,1)';
                    col.style.opacity = '1';
                    col.style.transform = 'translateX(0)';
                }, 400 + i * 200);
            });
        },

        'stack-reveal': (slide) => {
            const blocks = slide.querySelectorAll('.stack-block');
            blocks.forEach((block, i) => {
                block.style.opacity = '0';
                block.style.transform = 'translateY(30px)';
                setTimeout(() => {
                    block.style.transition = 'all 0.6s cubic-bezier(0,0,.3,1)';
                    block.style.opacity = '1';
                    block.style.transform = 'translateY(0)';
                }, 200 + i * 120);
            });
        },

        'image-reveal': (slide) => {
            const img = slide.querySelector('.frame-img');
            if (img) {
                img.style.opacity = '0';
                img.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    img.style.transition = 'all 0.8s cubic-bezier(0,0,.3,1)';
                    img.style.opacity = '1';
                    img.style.transform = 'scale(1)';
                }, 100);
            }
        },

        'timeline-h': (slide) => {
            const nodes = slide.querySelectorAll('.th-node');
            nodes.forEach((node, i) => {
                node.style.opacity = '0';
                setTimeout(() => {
                    node.style.transition = 'opacity 0.5s ease';
                    node.style.opacity = '1';
                }, 300 + i * 200);
            });
        },

        'split-statement': (slide) => {
            const manifesto = slide.querySelector('[data-anim="manifesto"]');
            const signature = slide.querySelector('[data-anim="signature"]');
            const rules = slide.querySelector('[data-anim="rules"]');
            const foot = slide.querySelector('[data-anim="foot"]');

            if (manifesto) {
                manifesto.style.opacity = '0';
                manifesto.style.transform = 'translateY(30px)';
                setTimeout(() => {
                    manifesto.style.transition = 'all 0.7s cubic-bezier(0,0,.3,1)';
                    manifesto.style.opacity = '1';
                    manifesto.style.transform = 'translateY(0)';
                }, 200);
            }

            if (signature) {
                signature.style.opacity = '0';
                setTimeout(() => {
                    signature.style.transition = 'opacity 0.5s ease';
                    signature.style.opacity = '1';
                }, 600);
            }

            if (rules) {
                rules.style.opacity = '0';
                setTimeout(() => {
                    rules.style.transition = 'opacity 0.6s ease';
                    rules.style.opacity = '1';
                }, 400);
            }

            if (foot) {
                foot.style.opacity = '0';
                setTimeout(() => {
                    foot.style.transition = 'opacity 0.5s ease';
                    foot.style.opacity = '1';
                }, 800);
            }
        }
    };

    window.__playSlide = (index) => {
        const slide = slides[index];
        if (!slide) return;

        const animateType = slide.dataset.animate;
        if (recipes[animateType]) {
            recipes[animateType](slide);
        }
    };

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
})();