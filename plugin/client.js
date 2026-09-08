/**
 * dsh-whale-pet — browser half.
 *
 * 右下角常驻鲸鱼娘桌宠：AI 插画鲸鱼娘 + 头顶常驻气泡显示 DeepSeek 余额。
 * 数据通过 fetch 调 Host 端 webServer 路由：
 *   /__whale-pet/balance  → 余额
 *   /__whale-pet/image    → 鲸鱼娘形象图 data URI
 *
 * Hand-written ModuleLoader bundle — no build step required.
 */
window.__ModuleLoader__.load({
  id: "dsh-whale-pet",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var h = react.createElement;

    // —— CSS ——
    var CSS =
      ".whale-pet-root{position:fixed;right:14px;bottom:8px;width:170px;height:250px;pointer-events:none;user-select:none;z-index:2147483647;font-family:system-ui,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}" +
      ".whale-pet-root *{box-sizing:border-box}" +
      ".whale-pet-fig{position:absolute;left:10px;right:10px;bottom:0;top:auto;pointer-events:auto;cursor:grab;touch-action:none;animation:whale-bob 3.4s ease-in-out infinite}" +
      ".whale-pet-fig.dragging{cursor:grabbing;animation:none}" +
      ".whale-pet-fig img{display:block;width:150px;height:auto;filter:drop-shadow(0 6px 14px rgba(30,80,150,.28))}" +
      ".whale-pet-fig svg{display:block;width:150px;height:auto}" +
      "@keyframes whale-bob{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-7px) rotate(1.5deg)}}" +
      ".whale-bubble{position:absolute;left:8px;bottom:175px;width:142px;background:rgba(255,255,255,.97);border:1px solid #cfe4f7;border-radius:14px;padding:8px 10px 9px;box-shadow:0 8px 22px rgba(30,70,130,.35);color:#1e3a5f;text-align:center;z-index:2147483647;pointer-events:none;opacity:1;transform:scale(1);animation:bubble-breathe 4s ease-in-out infinite}" +
      ".whale-bubble::after{content:'';position:absolute;left:66px;bottom:-7px;width:14px;height:14px;background:rgba(255,255,255,.97);border-right:1px solid #cfe4f7;border-bottom:1px solid #cfe4f7;transform:rotate(45deg)}" +
      "@keyframes bubble-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}" +
      ".whale-bubble-title{font-size:11px;color:#6d8bb0;letter-spacing:.5px}" +
      ".whale-bubble-value{font-size:20px;font-weight:700;color:#0e3a66;margin-top:2px;white-space:nowrap}" +
      ".whale-bubble-sub{font-size:10px;color:#86a3c4;margin-top:2px}";
    var tagId = "dsh-whale-pet/main.css";
    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
      var tag = document.createElement("style");
      tag.dataset.plugin = "dsh-whale-pet";
      tag.dataset.pluginCss = tagId;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    function el(tag, props) {
      var children = Array.prototype.slice.call(arguments, 2);
      if (children.length === 0) return h(tag, props);
      return h(tag, props, children);
    }

    // —— 内置 SVG 兜底鲸鱼娘（图片读取失败时显示）——
    var FALLBACK_SVG = el("svg", { viewBox: "0 0 150 130", width: 150, height: 130, xmlns: "http://www.w3.org/2000/svg" },
      el("g", { className: "whale-pet-spout" },
        el("path", { d: "M 102 26 C 100 18 104 12 112 10 C 104 12 97 17 95 24", fill: "none", stroke: "#9fd4f5", strokeWidth: 3, strokeLinecap: "round" }),
        el("path", { d: "M 110 22 C 110 16 113 12 118 10 C 113 13 110 17 109 22", fill: "none", stroke: "#b7e0f8", strokeWidth: 2.5, strokeLinecap: "round" }),
        el("circle", { cx: 118, cy: 9, r: 2.6, fill: "#cdeafc" })
      ),
      el("path", { d: "M 30 92 C 12 88 6 76 8 62 L 0 50 L 14 56 C 18 44 28 38 40 40 C 30 52 26 66 30 78 C 32 84 34 90 40 94 Z", fill: "#6db6e4" }),
      el("ellipse", { cx: 82, cy: 92, rx: 56, ry: 32, fill: "#79c2ef" }),
      el("ellipse", { cx: 82, cy: 101, rx: 40, ry: 18, fill: "#e8f6ff" }),
      el("path", { d: "M 122 82 C 134 80 142 74 144 68 C 140 78 132 84 124 88 Z", fill: "#6db6e4" }),
      el("circle", { cx: 86, cy: 58, r: 30, fill: "#79c2ef" }),
      el("path", { d: "M 56 62 C 56 42 70 34 86 34 C 102 34 116 42 116 62 C 110 50 104 48 98 54 C 94 46 88 46 84 52 C 80 46 74 48 70 54 C 64 48 60 52 56 62 Z", fill: "#335f8f" }),
      el("path", { d: "M 60 58 C 48 60 40 70 42 88 C 46 76 54 70 62 68 Z", fill: "#335f8f" }),
      el("path", { d: "M 112 58 C 124 60 132 70 130 88 C 126 76 118 70 110 68 Z", fill: "#335f8f" }),
      el("ellipse", { cx: 74, cy: 64, rx: 4, ry: 5.5, fill: "#1e3a5f" }),
      el("circle", { cx: 75.4, cy: 62, r: 1.6, fill: "#ffffff" }),
      el("ellipse", { cx: 96, cy: 64, rx: 4, ry: 5.5, fill: "#1e3a5f" }),
      el("circle", { cx: 97.4, cy: 62, r: 1.6, fill: "#ffffff" }),
      el("ellipse", { cx: 66, cy: 73, rx: 5, ry: 3, fill: "#ffb3c7", opacity: 0.85 }),
      el("ellipse", { cx: 104, cy: 73, rx: 5, ry: 3, fill: "#ffb3c7", opacity: 0.85 }),
      el("path", { d: "M 83 72 Q 85 75 88 72", fill: "none", stroke: "#5a7c9e", strokeWidth: 1.6, strokeLinecap: "round" }),
      el("ellipse", { cx: 62, cy: 82, rx: 9, ry: 5, fill: "#ffffff", opacity: 0.3 })
    );

    // —— 拖拽位置记忆（localStorage，键名含插件 id）——
    var POS_KEY = "dsh-whale-pet.pos";
    function loadSavedPos() {
      try {
        var raw = localStorage.getItem(POS_KEY);
        if (!raw) return null;
        var p = JSON.parse(raw);
        if (p && typeof p.x === "number" && typeof p.y === "number" && isFinite(p.x) && isFinite(p.y)) {
          return { x: p.x, y: p.y };
        }
      } catch (e) {}
      return null;
    }
    function savePos(p) {
      try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch (e) {}
    }
    function clampNum(v, lo, hi) {
      if (hi < lo) return lo;
      return v < lo ? lo : (v > hi ? hi : v);
    }
    // 以拖拽起始时的鲸鱼娘矩形为基准，把整个鲸鱼娘夹在视口内，反推 root 的 left/top。
    function clampDragPos(dx, dy, figRectAtDown, rootH, vw, vh) {
      var m = 4;
      var figLeft = clampNum(figRectAtDown.left + dx, m, vw - figRectAtDown.width - m);
      var figTop = clampNum(figRectAtDown.top + dy, m, vh - figRectAtDown.height - m);
      return {
        x: figLeft - 10,          // CSS: .whale-pet-fig left:10px
        y: (figTop + figRectAtDown.height) - rootH,  // 鲸鱼娘贴 root 底边
      };
    }

    // 组件通过 props 接收 ctx（固定插件没有模块级 ctx 闭包）
    function WhalePet(props) {
      var ctx = props.ctx;
      var _s = react.useState([]);
      var balances = _s[0];
      var setBalances = _s[1];
      var _s2 = react.useState(true);
      var isAvailable = _s2[0];
      var setIsAvailable = _s2[1];
      var _s3 = react.useState("loading");
      var state = _s3[0];
      var setState = _s3[1];
      var _s4 = react.useState(null);
      var imgSrc = _s4[0];
      var setImgSrc = _s4[1];
      var clickTimerRef = react.useRef(null);
      var rootRef = react.useRef(null);
      var figRef = react.useRef(null);
      var dragRef = react.useRef(null);           // 进行中的拖拽数据
      var didDragRef = react.useRef(false);       // 本次按下是否发生过拖拽（用于抑制拖完后的 click/dblclick）
      var _s5 = react.useState(false);
      var dragging = _s5[0];
      var setDragging = _s5[1];
      var _s6 = react.useState(function () { return loadSavedPos(); });
      var pos = _s6[0];
      var setPos = _s6[1];

      react.useEffect(function () {
        fetch("/__whale-pet/image").then(function (r) { return r.json(); }).then(function (res) {
          if (res && res.ok && res.dataUri) setImgSrc(res.dataUri);
        }).catch(function () {});
      }, []);

      var refresh = react.useCallback(function () {
        fetch("/__whale-pet/balance").then(function (r) { return r.json(); }).then(function (res) {
          if (res && res.ok === true) {
            setBalances(Array.isArray(res.balances) ? res.balances : []);
            setIsAvailable(res.isAvailable !== false);
            setState("ok");
          } else {
            setState("error");
          }
        }).catch(function () { setState("error"); });
      }, []);

      react.useEffect(function () { refresh(); }, [refresh]);
      // 60s 自动刷新余额（浏览器原生定时器，不依赖 Cordis 服务）
      react.useEffect(function () {
        var timer = setInterval(refresh, 60000);
        return function () { clearInterval(timer); };
      }, [refresh]);

      // —— 拖拽移动位置（Pointer Events + pointer capture）——
      var onPointerDown = function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        var figEl = e.currentTarget;
        var rootEl = rootRef.current;
        if (!figEl || !rootEl) return;
        dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          figRect: figEl.getBoundingClientRect(),
          rootH: rootEl.offsetHeight,
          moved: false,
          pos: null,
        };
        didDragRef.current = false;
        try { figEl.setPointerCapture(e.pointerId); } catch (err) {}
      };
      var onPointerMove = function (e) {
        var d = dragRef.current;
        if (!d) return;
        var dx = e.clientX - d.startX;
        var dy = e.clientY - d.startY;
        if (!d.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;  // 3px 阈值区分点击与拖拽
        d.moved = true;
        if (!d.visual) { d.visual = true; setDragging(true); }
        var next = clampDragPos(dx, dy, d.figRect, d.rootH, window.innerWidth, window.innerHeight);
        d.pos = next;
        setPos(next);
      };
      var onPointerEnd = function () {
        var d = dragRef.current;
        if (!d) return;
        dragRef.current = null;
        if (d.moved) {
          didDragRef.current = true;
          setDragging(false);
          if (d.pos) savePos(d.pos);   // 记忆位置：拖完即持久化
        }
      };

      // 单击刷新余额；延迟 280ms 以区分双击（双击时取消挂起的刷新）
      var handleClick = function () {
        if (didDragRef.current) return;   // 拖拽结束触发的 click 忽略
        if (clickTimerRef.current !== null) clearTimeout(clickTimerRef.current);
        clickTimerRef.current = setTimeout(function () {
          clickTimerRef.current = null;
          refresh();
        }, 280);
      };
      var handleDoubleClick = function () {
        if (didDragRef.current) return;   // 拖拽结束触发的 dblclick 忽略
        if (clickTimerRef.current !== null) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
        window.open("https://platform.deepseek.com/usage", "_blank", "noopener,noreferrer");
      };

      var first = balances[0] || null;
      var symbol = first && first.currency === "CNY" ? "¥" : (first ? first.currency + " " : "¥");
      var value = first ? symbol + first.total : symbol + "--";
      var sub = state === "loading" ? "查询中…"
        : state === "error" ? "获取失败，点我重试"
        : isAvailable ? "余额可用"
        : "⚠ 余额不足";

      var figure = imgSrc
        ? el("img", { src: imgSrc, alt: "DeepSeek 鲸鱼娘", draggable: false })
        : FALLBACK_SVG;

      // 挂载后校验记忆位置：若鲸鱼娘已完全移出视口（如换了显示器），回到默认右下角
      react.useEffect(function () {
        if (pos === null) return;
        var figEl = figRef.current;
        if (!figEl) return;
        var r = figEl.getBoundingClientRect();
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        if (r.right < 20 || r.left > vw - 20 || r.bottom < 20 || r.top > vh - 20) {
          try { localStorage.removeItem(POS_KEY); } catch (e) {}
          setPos(null);
        }
      }, []);

      var rootStyle = pos === null ? {} : { left: pos.x + "px", top: pos.y + "px", right: "auto", bottom: "auto" };

      return el("div", { ref: rootRef, className: "whale-pet-root", style: rootStyle, title: "鲸鱼娘 · DeepSeek 余额（形象：溟月·上善无形二创，CC BY-NC-SA）· 拖动移动位置，单击刷新余额，双击打开用量页" },
        el("div", { className: "whale-bubble" },
          el("div", { className: "whale-bubble-title" }, "DeepSeek 余额"),
          el("div", { className: "whale-bubble-value" }, value),
          el("div", { className: "whale-bubble-sub" }, sub)
        ),
        el("div", { ref: figRef, className: "whale-pet-fig" + (dragging ? " dragging" : ""),
          onPointerDown: onPointerDown, onPointerMove: onPointerMove,
          onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd,
          onClick: handleClick, onDoubleClick: handleDoubleClick,
          role: "button", "aria-label": "鲸鱼娘桌宠：拖动移动位置，单击刷新余额，双击打开用量页" },
          figure
        )
      );
    }

    // 对象形式插件（与 cyber-particle 一致）：inject + apply
    exports.apply = function apply(ctx) {
      var slots = ctx.get ? ctx.get("slots") : (ctx.slots || undefined);
      if (slots === undefined) return;

      slots.inject("shell.overlay", function () {
        return slots.register({
          name: "shell.overlay",
          id: "whale-pet",
          order: 100,
          label: "鲸鱼娘桌宠",
        }, function () {
          return h(WhalePet, { ctx: ctx });
        });
      });
    };

    exports.inject = ["slots"];
    return module.exports;
  }
});
