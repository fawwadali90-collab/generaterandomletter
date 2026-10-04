/* GenerateRandomLetter — shared helpers (vanilla JS, no dependencies) */
(function(){
  "use strict";

  // Copy text to clipboard with fallback
  window.grlCopy = function(text, btn){
    var done = function(){
      if(!btn) return;
      var old = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(function(){ btn.textContent = old; }, 1400);
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(function(){ fallback(); });
    } else { fallback(); }
    function fallback(){
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand("copy"); }catch(e){}
      document.body.removeChild(ta); done();
    }
  };

  // Random helpers
  window.grlRand = function(min, max){ // inclusive
    min = Math.ceil(min); max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  window.grlPick = function(arr){ return arr[Math.floor(Math.random() * arr.length)]; };
  window.grlShuffle = function(arr){
    var a = arr.slice();
    for(var i = a.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  // Confetti burst (canvas particles)
  var canvas = null, ctx = null, parts = [], raf = null;
  function ensureCanvas(){
    if(canvas) return;
    canvas = document.createElement("canvas");
    canvas.id = "confetti";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    var resize = function(){ canvas.width = innerWidth; canvas.height = innerHeight; };
    resize(); addEventListener("resize", resize);
  }
  var COLORS = ["#6c4cf1","#00b894","#ff9f43","#ff6b81","#4dc3ff","#ffe066"];
  window.grlConfetti = function(n){
    ensureCanvas();
    n = n || 120;
    for(var i = 0; i < n; i++){
      parts.push({
        x: innerWidth / 2 + (Math.random() - .5) * 220,
        y: innerHeight * .38,
        vx: (Math.random() - .5) * 13,
        vy: Math.random() * -11 - 3,
        s: Math.random() * 8 + 4,
        r: Math.random() * Math.PI * 2,
        vr: (Math.random() - .5) * .3,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1
      });
    }
    if(!raf) tick();
  };
  function tick(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter(function(p){ return p.life > 0 && p.y < innerHeight + 30; });
    parts.forEach(function(p){
      p.x += p.vx; p.y += p.vy; p.vy += .32; p.vx *= .99; p.r += p.vr; p.life -= .008;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s * .62);
      ctx.restore();
    });
    if(parts.length){ raf = requestAnimationFrame(tick); }
    else { raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  // Footer year
  document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll("[data-year]").forEach(function(el){
      el.textContent = new Date().getFullYear();
    });
    // auto-wire sound toggle buttons
    document.querySelectorAll("[data-sound-toggle]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var on = window.grlSfx.toggle();
        btn.textContent = on ? "🔊" : "🔇";
      });
    });
  });

  /* Shared sound engine (Web Audio, zero audio files) */
  window.grlSfx = (function(){
    var AC = null, on = true, ready = false;
    document.addEventListener("pointerdown", function(){ ready = true; ensure(); }, {once:true});
    function ensure(){
      if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } }
      if(AC && AC.state === "suspended") AC.resume();
      return AC;
    }
    function tone(delay, freq, dur, type, vol, slideTo){
      var ctx = ensure(); if(!ctx || !on || !ready) return;
      var t = ctx.currentTime + delay,
          o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t+dur);
      g.gain.setValueAtTime(vol || .18, t); g.gain.exponentialRampToValueAtTime(.001, t+dur);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+dur+.03);
    }
    function noise(delay, dur, fType, freq, vol, q){
      var ctx = ensure(); if(!ctx || !on || !ready) return;
      var t = ctx.currentTime + delay,
          len = Math.floor(ctx.sampleRate * dur),
          buf = ctx.createBuffer(1, len, ctx.sampleRate),
          d = buf.getChannelData(0);
      for(var i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var f = ctx.createBiquadFilter(); f.type = fType || "bandpass"; f.frequency.value = freq || 2000; f.Q.value = q || 1;
      var g = ctx.createGain(); g.gain.setValueAtTime(vol || .2, t); g.gain.exponentialRampToValueAtTime(.001, t+dur);
      src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(t);
    }
    function sweep(dur, f0, f1, vol){
      var ctx = ensure(); if(!ctx || !on || !ready) return;
      var t = ctx.currentTime,
          len = Math.floor(ctx.sampleRate * dur),
          buf = ctx.createBuffer(1, len, ctx.sampleRate),
          d = buf.getChannelData(0);
      for(var i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1-i/len);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.4;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t+dur);
      var g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t+dur);
      src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(t);
    }
    return {
      isOn: function(){ return on; },
      toggle: function(){ on = !on; return on; },
      pop: function(){ tone(0, 540, .1, "triangle", .2, 920); },
      tick: function(){ tone(0, 2300, .03, "square", .045); },
      whoosh: function(){ sweep(.32, 500, 3400, .13); },
      chime: function(){ tone(0, 880, .2, "sine", .16); tone(.13, 1318, .3, "sine", .14); },
      fanfare: function(){ var n=[523,659,784,1047], i; for(i=0;i<n.length;i++) tone(i*.1, n[i], .22, "triangle", .2); },
      thunk: function(){ tone(0, 130, .15, "sine", .4, 48); noise(0, .07, "lowpass", 500, .3); },
      ching: function(){ tone(0, 3520, .45, "sine", .16, 3300); tone(0, 4699, .38, "sine", .1); },
      womp: function(){ tone(0, 300, .5, "sawtooth", .09, 92); },
      diceRattle: function(){ for(var i=0;i<7;i++) noise(i*.11, .06, "highpass", 1400+Math.random()*2200, .2); }
    };
  })();
})();
