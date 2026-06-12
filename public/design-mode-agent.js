;(function () {
  if (window.__sinDesignAgent) return
  window.__sinDesignAgent = true

  var PARENT_ORIGIN = "*"
  var enabled = false
  var idCounter = 0
  var nodeMap = new Map()

  var overlay = document.createElement("div")
  overlay.style.cssText =
    "position:fixed;pointer-events:none;z-index:2147483647;border:1px solid #0072f5;background:rgba(0,114,245,0.08);display:none;transition:all 60ms ease-out;"
  var label = document.createElement("div")
  label.style.cssText =
    "position:absolute;top:-22px;left:-1px;background:#0072f5;color:#fff;font:11px/1.4 ui-monospace,monospace;padding:2px 6px;border-radius:4px;white-space:nowrap;"
  overlay.appendChild(label)

  function ensureOverlay() {
    if (!overlay.parentNode) document.body.appendChild(overlay)
  }

  function highlight(el) {
    if (!el || el === document.body || el === document.documentElement) {
      overlay.style.display = "none"
      return
    }
    ensureOverlay()
    var r = el.getBoundingClientRect()
    overlay.style.display = "block"
    overlay.style.left = r.left + "px"
    overlay.style.top = r.top + "px"
    overlay.style.width = r.width + "px"
    overlay.style.height = r.height + "px"
    label.textContent =
      el.tagName.toLowerCase() +
      (el.id ? "#" + el.id : "") +
      " · " + Math.round(r.width) + "×" + Math.round(r.height)
  }

  function serializeTree(el, depth) {
    if (depth > 12 || !el.tagName) return null
    var tag = el.tagName.toLowerCase()
    if (tag === "script" || tag === "style" || el === overlay) return null
    var id = "n" + idCounter++
    nodeMap.set(id, el)
    var children = []
    for (var i = 0; i < el.children.length; i++) {
      var child = serializeTree(el.children[i], depth + 1)
      if (child) children.push(child)
    }
    return {
      id: id,
      tag: tag,
      classes: typeof el.className === "string" ? el.className : "",
      text: el.children.length === 0 ? (el.textContent || "").slice(0, 40) : "",
      children: children,
    }
  }

  function sendTree() {
    idCounter = 0
    nodeMap.clear()
    var tree = serializeTree(document.body, 0)
    parent.postMessage({ source: "sin-design", type: "tree", tree: tree }, PARENT_ORIGIN)
  }

  function inspect(el, id) {
    var cs = getComputedStyle(el)
    var r = el.getBoundingClientRect()
    parent.postMessage(
      {
        source: "sin-design",
        type: "inspect",
        node: {
          id: id,
          tag: el.tagName.toLowerCase(),
          classes: typeof el.className === "string" ? el.className : "",
          text: (el.textContent || "").slice(0, 120),
          rect: { width: Math.round(r.width), height: Math.round(r.height) },
          styles: {
            display: cs.display,
            color: cs.color,
            backgroundColor: cs.backgroundColor,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            margin: cs.margin,
            padding: cs.padding,
            borderRadius: cs.borderRadius,
          },
        },
      },
      PARENT_ORIGIN,
    )
  }

  function findId(el) {
    var found = null
    nodeMap.forEach(function (v, k) {
      if (v === el) found = k
    })
    return found
  }

  document.addEventListener("mousemove", function (e) {
    if (!enabled) return
    highlight(e.target)
  }, true)

  document.addEventListener("click", function (e) {
    if (!enabled) return
    e.preventDefault()
    e.stopPropagation()
    var id = findId(e.target)
    highlight(e.target)
    if (id) inspect(e.target, id)
  }, true)

  window.addEventListener("message", function (e) {
    var d = e.data
    if (!d || d.source !== "sin-webui") return
    if (d.type === "enable") {
      enabled = true
      sendTree()
    }
    if (d.type === "disable") {
      enabled = false
      overlay.style.display = "none"
    }
    if (d.type === "highlight") {
      var el = nodeMap.get(d.id)
      if (el) {
        highlight(el)
        el.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
    if (d.type === "select") {
      var sel = nodeMap.get(d.id)
      if (sel) {
        highlight(sel)
        inspect(sel, d.id)
      }
    }
  })

  parent.postMessage({ source: "sin-design", type: "ready" }, PARENT_ORIGIN)
})()
