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
  });
})();
