"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  MousePointer2,
  Loader2,
  Type,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Move,
  Square,
  Plus,
  ChevronsUp,
  ChevronsDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
  Layers,
  ArrowUpFromLine,
  Undo2,
  Redo2,
} from "lucide-react";
import { clsx } from "clsx";
import { saveEditedContentAction } from "@/app/wp-pages/[domain]/[slug]/edit/actions";
import { saveEmbeddedHtmlAction } from "@/app/lps/[slug]/edit-visual/actions";
import {
  ImageReplaceModal,
  type SelectedImage,
} from "@/components/image-replace-modal";

export type EditorSource =
  | { kind: "wp"; domain: string; slug: string }
  | { kind: "embed"; slug: string };

export type EditorShellProps = {
  source: EditorSource;
  title: string;
  initialHtml: string;
};

type SelectedInfo = {
  id: string;
  tag: string;
  className: string;
  text: string;
  hasBackgroundImage: boolean;
  imageSrc?: string;
  imageAlt?: string;
  childCount: number;
  hasParent: boolean;
  styles: {
    color: string;
    fontSize: string;
    fontWeight: string;
    textAlign: string;
    zIndex: string;
    letterSpacing: string;
    lineHeight: string;
  };
};

const EDITOR_SCRIPT = `
(function() {
  const TEXT_TAGS = new Set(['P','H1','H2','H3','H4','H5','H6','SPAN','LI','A','TD','TH','BUTTON','STRONG','EM','LABEL','BLOCKQUOTE','DT','DD','FIGCAPTION','SMALL']);
  const OVERLAY_ID = '__editor_overlay__';
  const MAX_HISTORY = 50;
  let selected = null;
  let drag = null;
  let pendingDrag = null;
  let history = [];
  let historyIndex = -1;
  let snapshotTimer = null;
  let isRestoring = false;

  function getCleanBody() {
    // Captura body sem o overlay (não faz parte da edição real)
    const overlay = document.getElementById(OVERLAY_ID);
    let removed = null;
    if (overlay && overlay.parentNode) {
      removed = { el: overlay, parent: overlay.parentNode };
      overlay.parentNode.removeChild(overlay);
    }
    const html = document.body.innerHTML;
    if (removed) removed.parent.appendChild(removed.el);
    return html;
  }

  function snapshot() {
    if (isRestoring) return;
    if (snapshotTimer) clearTimeout(snapshotTimer);
    snapshotTimer = setTimeout(function() {
      const html = getCleanBody();
      // Se idêntico ao último, não duplica
      if (history[historyIndex] === html) return;
      // Trunca futuro
      history = history.slice(0, historyIndex + 1);
      history.push(html);
      if (history.length > MAX_HISTORY) {
        history.shift();
      } else {
        historyIndex++;
      }
      parent.postMessage({ type: 'editor:history', canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1 }, '*');
    }, 600);
  }

  function snapshotNow() {
    if (snapshotTimer) { clearTimeout(snapshotTimer); snapshotTimer = null; }
    const html = getCleanBody();
    if (history[historyIndex] === html) return;
    history = history.slice(0, historyIndex + 1);
    history.push(html);
    if (history.length > MAX_HISTORY) history.shift();
    else historyIndex++;
    parent.postMessage({ type: 'editor:history', canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1 }, '*');
  }

  function reapplyEditableState() {
    TEXT_TAGS.forEach(function(tag) {
      document.querySelectorAll(tag).forEach(function(el) {
        if (el.children.length === 0 || el.querySelector('strong,em,a,span,br')) {
          el.setAttribute('contenteditable', 'true');
          el.style.cursor = 'text';
        }
      });
    });
    document.querySelectorAll('img').forEach(function(img) {
      img.style.cursor = 'pointer';
    });
  }

  function undo() {
    if (historyIndex <= 0) return;
    isRestoring = true;
    historyIndex--;
    document.body.innerHTML = history[historyIndex];
    selected = null;
    parent.postMessage({ type: 'editor:deselect' }, '*');
    reapplyEditableState();
    parent.postMessage({ type: 'editor:dirty' }, '*');
    parent.postMessage({ type: 'editor:history', canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1 }, '*');
    setTimeout(function() { isRestoring = false; }, 50);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    isRestoring = true;
    historyIndex++;
    document.body.innerHTML = history[historyIndex];
    selected = null;
    parent.postMessage({ type: 'editor:deselect' }, '*');
    reapplyEditableState();
    parent.postMessage({ type: 'editor:dirty' }, '*');
    parent.postMessage({ type: 'editor:history', canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1 }, '*');
    setTimeout(function() { isRestoring = false; }, 50);
  }

  function ensureId(el) {
    if (!el.dataset.editorId) {
      el.dataset.editorId = 'el-' + Math.random().toString(36).slice(2, 10);
    }
    return el.dataset.editorId;
  }

  function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    if (rgb.startsWith('#')) return rgb;
    const m = rgb.match(/\\d+/g);
    if (!m || m.length < 3) return '#000000';
    return '#' + m.slice(0, 3).map(function(v) {
      const h = parseInt(v, 10).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }

  function getBgImageUrl(cs) {
    const bg = cs.backgroundImage;
    if (!bg || bg === 'none') return null;
    const m = bg.match(/url\\(["']?([^"')]+)["']?\\)/);
    return m ? m[1] : null;
  }

  function isResizable(el) {
    return el.tagName === 'IMG' || !!getBgImageUrl(window.getComputedStyle(el));
  }

  function countSelectableChildren(el) {
    if (!el || !el.querySelectorAll) return 0;
    return el.querySelectorAll('img, p, h1, h2, h3, h4, h5, h6, span, a, button, li, figure, picture').length;
  }

  function getOverlay() {
    return document.getElementById(OVERLAY_ID);
  }

  function removeAllOverlays() {
    const overlays = document.querySelectorAll('#' + OVERLAY_ID);
    overlays.forEach(function(o) {
      if (o.parentNode) o.parentNode.removeChild(o);
    });
  }

  function positionOverlay(el) {
    const overlay = getOverlay();
    if (!overlay || !el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    overlay.style.left = r.left + 'px';
    overlay.style.top = r.top + 'px';
    overlay.style.width = r.width + 'px';
    overlay.style.height = r.height + 'px';
  }

  function buildOverlay(el) {
    removeAllOverlays();
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;box-sizing:border-box;outline:2px solid #3b82f6;outline-offset:2px;';

    if (isResizable(el)) {
      ['nw','ne','sw','se'].forEach(function(corner) {
        const h = document.createElement('div');
        h.dataset.corner = corner;
        const cursors = { nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', se: 'nwse-resize' };
        h.style.cssText = 'position:absolute;width:14px;height:14px;background:white;border:2px solid #3b82f6;border-radius:50%;pointer-events:auto;cursor:' + cursors[corner] + ';box-shadow:0 1px 3px rgba(0,0,0,0.3);z-index:2147483647;';
        if (corner === 'nw') { h.style.top = '-8px'; h.style.left = '-8px'; }
        if (corner === 'ne') { h.style.top = '-8px'; h.style.right = '-8px'; }
        if (corner === 'sw') { h.style.bottom = '-8px'; h.style.left = '-8px'; }
        if (corner === 'se') { h.style.bottom = '-8px'; h.style.right = '-8px'; }
        h.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          startResize(e, corner);
        }, true);
        overlay.appendChild(h);
      });
    }

    document.body.appendChild(overlay);
    positionOverlay(el);
  }

  function sendSelectionInfo(el) {
    const cs = window.getComputedStyle(el);
    const bg = getBgImageUrl(cs);
    parent.postMessage({
      type: 'editor:select',
      id: el.dataset.editorId,
      tag: el.tagName,
      className: typeof el.className === 'string' ? el.className : '',
      text: (el.innerText || '').slice(0, 120),
      hasBackgroundImage: !!bg,
      imageSrc: el.tagName === 'IMG' ? (el.getAttribute('src') || '') : (bg || ''),
      imageAlt: el.tagName === 'IMG' ? (el.getAttribute('alt') || '') : '',
      childCount: countSelectableChildren(el),
      hasParent: !!(el.parentElement && el.parentElement !== document.body),
      styles: {
        color: rgbToHex(cs.color),
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        textAlign: cs.textAlign,
        zIndex: cs.zIndex === 'auto' ? '0' : cs.zIndex,
        letterSpacing: cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing,
        lineHeight: cs.lineHeight === 'normal' ? '1.4' : cs.lineHeight
      }
    }, '*');
  }

  function selectElement(el) {
    if (!el || el === document.body || el === document.documentElement) {
      deselect();
      return;
    }
    if (el.id === OVERLAY_ID || (el.closest && el.closest('#' + OVERLAY_ID))) return;

    selected = el;
    ensureId(el);
    buildOverlay(el);
    sendSelectionInfo(el);
  }

  function deselect() {
    removeAllOverlays();
    selected = null;
    parent.postMessage({ type: 'editor:deselect' }, '*');
  }

  function startMoveAt(el, mx, my) {
    snapshotNow(); // snapshot ANTES da mudança pra Ctrl+Z voltar
    const cur = el.style.transform || '';
    const m = cur.match(/translate\\(\\s*(-?\\d+(?:\\.\\d+)?)px\\s*,\\s*(-?\\d+(?:\\.\\d+)?)px\\s*\\)/);
    drag = {
      mode: 'move',
      el: el,
      startMx: mx,
      startMy: my,
      startTx: m ? parseFloat(m[1]) : 0,
      startTy: m ? parseFloat(m[2]) : 0,
      transformOther: cur.replace(/translate\\([^)]*\\)/, '').trim()
    };
  }

  function startResize(e, corner) {
    if (!selected) return;
    snapshotNow(); // snapshot ANTES da mudança pra Ctrl+Z voltar
    // Garante que elemento fica em sua própria camada de composição —
    // assim o scale fica isolado e não causa repaint dos vizinhos
    selected.style.willChange = 'transform';
    selected.style.isolation = 'isolate';
    if (!selected.style.position || selected.style.position === 'static') {
      selected.style.position = 'relative';
    }
    if (!selected.style.zIndex || selected.style.zIndex === '0' || selected.style.zIndex === 'auto') {
      selected.style.zIndex = '1';
    }
    const r = selected.getBoundingClientRect();
    const cur = selected.style.transform || '';
    const scaleMatch = cur.match(/scale\\(\\s*(-?\\d+(?:\\.\\d+)?)(?:\\s*,\\s*(-?\\d+(?:\\.\\d+)?))?\\s*\\)/);
    drag = {
      mode: 'resize',
      el: selected,
      corner: corner,
      startMx: e.clientX,
      startMy: e.clientY,
      startW: r.width,
      startH: r.height,
      aspect: r.width / r.height,
      startScaleX: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
      startScaleY: scaleMatch ? (scaleMatch[2] ? parseFloat(scaleMatch[2]) : parseFloat(scaleMatch[1])) : 1
    };
  }

  function init() {
    // Limpa resíduos do HTML carregado (overlays embedded de saves anteriores)
    document.querySelectorAll('#' + OVERLAY_ID).forEach(function(o) {
      if (o.parentNode) o.parentNode.removeChild(o);
    });
    // Remove scripts duplicados de saves anteriores
    document.querySelectorAll('script[data-editor-script]').forEach(function(s, i) {
      // mantém só o primeiro (que é o atual em execução)
      if (i > 0 && s.parentNode) s.parentNode.removeChild(s);
    });

    TEXT_TAGS.forEach(function(tag) {
      document.querySelectorAll(tag).forEach(function(el) {
        if (el.children.length === 0 || el.querySelector('strong,em,a,span,br')) {
          el.setAttribute('contenteditable', 'true');
          el.style.cursor = 'text';
          el.style.outline = 'none';
        }
      });
    });

    document.querySelectorAll('img').forEach(function(img) {
      img.style.cursor = 'pointer';
    });

    document.addEventListener('mousedown', function(e) {
      // Ignora clicks dentro do overlay (handles)
      if (e.target.id === OVERLAY_ID) return;
      if (e.target.closest && e.target.closest('#' + OVERLAY_ID)) return;

      const target = e.target;
      if (!target || target === document.body || target === document.documentElement) {
        deselect();
        return;
      }

      // Filosofia Canva: sempre seleciona o elemento exato clicado.
      // Sem buscar wrappers, sem subir pra pai.
      // Cada elemento é individual.

      e.stopPropagation();

      if (selected !== target) {
        selectElement(target);
      }

      pendingDrag = {
        el: target,
        startX: e.clientX,
        startY: e.clientY,
        activated: false,
        wasEditable: target.getAttribute('contenteditable') === 'true'
      };
    }, true);

    document.addEventListener('mousemove', function(e) {
      if (pendingDrag && !pendingDrag.activated) {
        const dist = Math.hypot(e.clientX - pendingDrag.startX, e.clientY - pendingDrag.startY);
        if (dist > 5) {
          pendingDrag.activated = true;
          if (pendingDrag.wasEditable) {
            pendingDrag.el.setAttribute('contenteditable', 'false');
          }
          if (window.getSelection) {
            try { window.getSelection().removeAllRanges(); } catch (err) {}
          }
          startMoveAt(pendingDrag.el, pendingDrag.startX, pendingDrag.startY);
        }
      }

      if (!drag) return;
      e.preventDefault();
      const dx = e.clientX - drag.startMx;
      const dy = e.clientY - drag.startMy;

      if (drag.mode === 'move') {
        const nx = drag.startTx + dx;
        const ny = drag.startTy + dy;
        drag.el.style.transform = (drag.transformOther ? drag.transformOther + ' ' : '') + 'translate(' + nx + 'px, ' + ny + 'px)';
        positionOverlay(drag.el);
      } else if (drag.mode === 'resize') {
        let factorW = 1, factorH = 1;
        const keepAspect = !e.shiftKey;

        if (drag.corner === 'se' || drag.corner === 'ne') {
          factorW = Math.max(0.1, (drag.startW + dx) / drag.startW);
        } else {
          factorW = Math.max(0.1, (drag.startW - dx) / drag.startW);
        }
        if (drag.corner === 'se' || drag.corner === 'sw') {
          factorH = Math.max(0.1, (drag.startH + dy) / drag.startH);
        } else {
          factorH = Math.max(0.1, (drag.startH - dy) / drag.startH);
        }

        if (keepAspect) {
          const s = Math.max(factorW, factorH);
          factorW = factorH = s;
        }

        // Sempre usa transform: scale — assim o elemento expande visualmente
        // por cima dos outros sem empurrar layout (igual Canva).
        const newScaleX = drag.startScaleX * factorW;
        const newScaleY = drag.startScaleY * factorH;
        const curT = drag.el.style.transform || '';
        const transMatch = curT.match(/translate\\([^)]*\\)/);
        const trans = transMatch ? transMatch[0] : '';
        drag.el.style.transform = (trans ? trans + ' ' : '') + 'scale(' + newScaleX + ', ' + newScaleY + ')';
        drag.el.style.transformOrigin = drag.corner === 'nw' ? 'bottom right' :
                                         drag.corner === 'ne' ? 'bottom left' :
                                         drag.corner === 'sw' ? 'top right' : 'top left';
        positionOverlay(drag.el);
      }
    }, true);

    document.addEventListener('mouseup', function() {
      if (pendingDrag) {
        if (pendingDrag.activated) {
          if (pendingDrag.wasEditable) {
            pendingDrag.el.setAttribute('contenteditable', 'true');
          }
          parent.postMessage({ type: 'editor:dirty' }, '*');
        }
        pendingDrag = null;
      }
      drag = null;
    }, true);

    document.addEventListener('input', function() {
      parent.postMessage({ type: 'editor:dirty' }, '*');
      snapshot();
    }, true);

    document.addEventListener('keydown', function(e) {
      // Undo/Redo
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        e.stopPropagation();
        undo();
        return;
      }
      if (ctrl && ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        e.stopPropagation();
        redo();
        return;
      }
      if (e.key === 'Escape') deselect();
    }, true);

    window.addEventListener('scroll', function() { if (selected) positionOverlay(selected); }, true);
    window.addEventListener('resize', function() { if (selected) positionOverlay(selected); }, true);

    // Snapshot inicial
    snapshotNow();

    parent.postMessage({ type: 'editor:ready' }, '*');
  }

  window.addEventListener('message', function(e) {
    const data = e.data || {};
    if (data.type === 'editor:export') {
      // Remove TODOS os overlays do DOM
      document.querySelectorAll('#' + OVERLAY_ID).forEach(function(o) {
        if (o.parentNode) o.parentNode.removeChild(o);
      });
      // Remove script do editor injetado
      document.querySelectorAll('script[data-editor-script]').forEach(function(s) {
        if (s.parentNode) s.parentNode.removeChild(s);
      });
      // Limpa atributos e estilos inline aplicados pelo editor
      document.querySelectorAll('[data-editor-id]').forEach(function(el) {
        el.removeAttribute('data-editor-id');
      });
      document.querySelectorAll('[contenteditable]').forEach(function(el) {
        el.removeAttribute('contenteditable');
      });

      const html = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
      parent.postMessage({ type: 'editor:exported', html: html }, '*');

      // Reativa o editor pro user continuar trabalhando
      setTimeout(function() {
        const script = document.createElement('script');
        script.setAttribute('data-editor-script', '1');
        // Re-injetar não funciona via innerText em alguns casos.
        // Em vez disso, re-rodar init manualmente:
        // Re-marca textos como editáveis
        ['P','H1','H2','H3','H4','H5','H6','SPAN','LI','A','TD','TH','BUTTON','STRONG','EM','LABEL','BLOCKQUOTE','DT','DD','FIGCAPTION','SMALL'].forEach(function(tag) {
          document.querySelectorAll(tag).forEach(function(el) {
            if (el.children.length === 0 || el.querySelector('strong,em,a,span,br')) {
              el.setAttribute('contenteditable', 'true');
            }
          });
        });
        // Reativa seleção
        if (selected) {
          ensureId(selected);
          buildOverlay(selected);
        }
      }, 0);
    }
    if (data.type === 'editor:replace-image' && data.id && data.newSrc) {
      const target = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (target) {
        snapshotNow(); // antes da mudança
        if (target.tagName === 'IMG') {
          ['srcset','data-srcset','data-lazy-srcset'].forEach(function(a) {
            if (target.hasAttribute(a)) target.removeAttribute(a);
          });
          ['data-src','data-lazy-src','data-large_image','data-original'].forEach(function(a) {
            if (target.hasAttribute(a)) target.setAttribute(a, data.newSrc);
          });
          ['lazy','lazyload','lazyloading','lazy-load'].forEach(function(cls) {
            target.classList.remove(cls);
          });
          target.setAttribute('src', data.newSrc);
          target.removeAttribute('loading');
        } else {
          target.style.backgroundImage = 'url("' + data.newSrc + '")';
        }
        parent.postMessage({ type: 'editor:dirty' }, '*');
      }
    }
    if (data.type === 'editor:apply-style' && data.id) {
      const target = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (target && data.property && data.value !== undefined) {
        snapshot(); // debounced — várias mudanças rápidas viram 1 snapshot
        target.style[data.property] = data.value;
        if (selected === target) positionOverlay(target);
        parent.postMessage({ type: 'editor:dirty' }, '*');
      }
    }
    if (data.type === 'editor:select-parent' && data.id) {
      const target = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (target && target.parentElement && target.parentElement !== document.body) {
        selectElement(target.parentElement);
      }
    }
    if (data.type === 'editor:reset-transform' && data.id) {
      const target = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (target) {
        target.style.transform = '';
        if (selected === target) positionOverlay(target);
        parent.postMessage({ type: 'editor:dirty' }, '*');
      }
    }
    if (data.type === 'editor:bring-front' && data.id) {
      const t = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (t) {
        snapshotNow();
        const cur = parseInt(t.style.zIndex || '0', 10) || 0;
        t.style.position = t.style.position || 'relative';
        t.style.zIndex = String(cur + 1);
        // Remove backdrop-filter inherits que causam blur visual
        t.style.backdropFilter = 'none';
        parent.postMessage({ type: 'editor:dirty' }, '*');
      }
    }
    if (data.type === 'editor:send-back' && data.id) {
      const t = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (t) {
        snapshotNow();
        const cur = parseInt(t.style.zIndex || '0', 10) || 0;
        t.style.position = t.style.position || 'relative';
        t.style.zIndex = String(cur - 1);
        t.style.backdropFilter = 'none';
        t.style.filter = 'none';
        parent.postMessage({ type: 'editor:dirty' }, '*');
      }
    }
    if (data.type === 'editor:bring-top' && data.id) {
      const t = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (t) {
        snapshotNow();
        t.style.position = t.style.position && t.style.position !== 'static' ? t.style.position : 'relative';
        t.style.zIndex = '99999';
        t.style.backdropFilter = 'none';
        t.style.filter = 'none';
        // Sobe z-index dos ancestrais que criam stacking context
        // (pra escapar do "filho preso" em pai com position/transform)
        let p = t.parentElement;
        while (p && p !== document.body) {
          const cs = window.getComputedStyle(p);
          const creates = cs.position !== 'static' || cs.transform !== 'none' ||
                          cs.filter !== 'none' || cs.opacity !== '1' ||
                          cs.isolation === 'isolate' || cs.willChange.indexOf('transform') >= 0;
          if (creates) {
            const cur = parseInt(p.style.zIndex || '0', 10) || 0;
            if (cur < 999) p.style.zIndex = '999';
            if (!p.style.position || p.style.position === 'static') p.style.position = 'relative';
          }
          p = p.parentElement;
        }
        parent.postMessage({ type: 'editor:dirty' }, '*');
      }
    }
    if (data.type === 'editor:send-bottom' && data.id) {
      const t = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (t) {
        snapshotNow();
        t.style.position = t.style.position && t.style.position !== 'static' ? t.style.position : 'relative';
        t.style.zIndex = '0';
        t.style.backdropFilter = 'none';
        t.style.filter = 'none';
        parent.postMessage({ type: 'editor:dirty' }, '*');
      }
    }
    if (data.type === 'editor:reset-transform' && data.id) {
      const target = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (target) {
        snapshotNow();
        target.style.transform = '';
        if (selected === target) positionOverlay(target);
        parent.postMessage({ type: 'editor:dirty' }, '*');
      }
    }
    if (data.type === 'editor:delete' && data.id) {
      const t = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (t && t.parentNode) {
        t.parentNode.removeChild(t);
        deselect();
        parent.postMessage({ type: 'editor:dirty' }, '*');
        snapshotNow();
      }
    }
    if (data.type === 'editor:undo') undo();
    if (data.type === 'editor:redo') redo();
    if (data.type === 'editor:list-layers') {
      const list = [];
      // Pega TODOS os elementos visíveis (sem filtros restritivos)
      const all = document.querySelectorAll('body *');
      all.forEach(function(el) {
        if (el.id === OVERLAY_ID) return;
        if (el.closest && el.closest('#' + OVERLAY_ID)) return;
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK' || el.tagName === 'META' || el.tagName === 'NOSCRIPT' || el.tagName === 'BR') return;

        const r = el.getBoundingClientRect();
        if (r.width < 5 || r.height < 5) return;

        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;

        ensureId(el);
        const tag = el.tagName;
        const isImg = tag === 'IMG';
        const hasBg = !!getBgImageUrl(cs);

        let label;
        if (isImg) {
          const src = el.getAttribute('src') || '';
          label = el.getAttribute('alt') || src.split('/').pop() || 'imagem';
        } else {
          // Pega texto DIRETO (não vindo de filhos)
          let directText = '';
          for (let i = 0; i < el.childNodes.length; i++) {
            const n = el.childNodes[i];
            if (n.nodeType === 3) directText += n.textContent;
          }
          directText = directText.replace(/\\s+/g, ' ').trim();
          if (directText) {
            label = directText.slice(0, 50);
          } else if (hasBg) {
            label = '🖼️ fundo';
          } else {
            label = '<' + tag.toLowerCase() + '>';
          }
        }

        let depth = 0;
        let p = el.parentElement;
        while (p && p !== document.body && depth < 12) {
          depth++;
          p = p.parentElement;
        }

        list.push({
          id: el.dataset.editorId,
          tag: tag,
          label: label,
          depth: depth,
          isImage: isImg || hasBg,
          top: r.top + (window.scrollY || 0)
        });
      });
      // Limita pra performance — se passar de 500, pega só os 500 primeiros
      list.sort(function(a, b) { return a.top - b.top; });
      const limited = list.slice(0, 500);
      parent.postMessage({ type: 'editor:layers', list: limited }, '*');
    }
    if (data.type === 'editor:select-by-id' && data.id) {
      const el = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function() { selectElement(el); }, 200);
      }
    }
    if (data.type === 'editor:highlight-by-id' && data.id) {
      const el = document.querySelector('[data-editor-id="' + data.id + '"]');
      if (el) {
        const r = el.getBoundingClientRect();
        // Cria highlight temporário
        let hl = document.getElementById('__editor_hl__');
        if (!hl) {
          hl = document.createElement('div');
          hl.id = '__editor_hl__';
          hl.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;border:2px dashed #fbbf24;background:rgba(251,191,36,0.1);box-sizing:border-box;transition:all 0.1s;';
          document.body.appendChild(hl);
        }
        hl.style.left = r.left + 'px';
        hl.style.top = r.top + 'px';
        hl.style.width = r.width + 'px';
        hl.style.height = r.height + 'px';
      }
    }
    if (data.type === 'editor:clear-highlight') {
      const hl = document.getElementById('__editor_hl__');
      if (hl && hl.parentNode) hl.parentNode.removeChild(hl);
    }
    if (data.type === 'editor:insert') {
      const kind = data.kind;
      let el;
      if (kind === 'text') {
        el = document.createElement('p');
        el.textContent = 'Novo texto — clique pra editar';
        el.style.cssText = 'padding: 12px; font-size: 18px; color: #111; background: rgba(255,255,255,0.9); margin: 8px;';
        el.setAttribute('contenteditable', 'true');
      } else if (kind === 'heading') {
        el = document.createElement('h2');
        el.textContent = 'Novo título';
        el.style.cssText = 'padding: 12px; font-size: 32px; font-weight: 700; color: #111; background: rgba(255,255,255,0.9); margin: 8px;';
        el.setAttribute('contenteditable', 'true');
      } else if (kind === 'button') {
        el = document.createElement('button');
        el.textContent = 'Botão';
        el.style.cssText = 'padding: 12px 24px; background: #3b82f6; color: white; border: 0; border-radius: 8px; font-weight: 600; cursor: pointer; margin: 8px;';
        el.setAttribute('contenteditable', 'true');
      } else if (kind === 'image' && data.src) {
        el = document.createElement('img');
        el.src = data.src;
        el.style.cssText = 'max-width: 300px; height: auto; margin: 8px;';
      } else if (kind === 'box') {
        el = document.createElement('div');
        el.style.cssText = 'padding: 24px; background: #f3f4f6; border: 1px dashed #9ca3af; min-height: 100px; margin: 8px;';
      }
      if (el) {
        ensureId(el);
        // 1) Se tem elemento selecionado, insere DEPOIS dele
        if (selected && selected.parentNode && selected !== document.body) {
          selected.parentNode.insertBefore(el, selected.nextSibling);
        } else {
          // 2) Senão, pega o elemento no topo da viewport atual e insere perto
          let anchor = null;
          try {
            anchor = document.elementFromPoint(window.innerWidth / 2, 120);
          } catch (err) {}
          // Sobe pra um pai mais "block-level" pra não inserir dentro de span
          while (anchor && anchor !== document.body) {
            const tag = anchor.tagName;
            if (tag === 'DIV' || tag === 'SECTION' || tag === 'MAIN' || tag === 'ARTICLE') break;
            anchor = anchor.parentElement;
          }
          if (anchor && anchor.parentNode && anchor !== document.body) {
            anchor.parentNode.insertBefore(el, anchor);
          } else {
            document.body.appendChild(el);
          }
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function() { selectElement(el); }, 100);
        parent.postMessage({ type: 'editor:dirty' }, '*');
        snapshotNow();
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;

function injectScript(html: string): string {
  // Limpa só nossos próprios marcadores. Cuidado: o regex precisa ser ESPECÍFICO
  // pra não devorar conteúdo legítimo da página.
  let cleaned = html
    .replace(/<script\s+data-editor-script="1">[\s\S]*?<\/script>/g, "")
    .replace(/<div\s+id="__editor_overlay__"[^>]*>[\s\S]*?<\/div>/g, "")
    .replace(/\sdata-editor-id="[^"]*"/g, "")
    .replace(/\scontenteditable="(?:true|false)"/g, "");
  const tag = `<script data-editor-script="1">${EDITOR_SCRIPT}</script>`;
  if (/<\/body>/i.test(cleaned)) {
    return cleaned.replace(/<\/body>/i, `${tag}</body>`);
  }
  return cleaned + tag;
}

export function EditorShell({
  source,
  title,
  initialHtml,
}: EditorShellProps) {
  // Atalhos pra não quebrar o resto do código que esperava domain/slug
  const isWp = source.kind === "wp";
  const domain = isWp ? source.domain : "embed";
  const slug = source.slug;
  const backHref =
    source.kind === "wp"
      ? `/wp-pages/${source.domain}/${source.slug}`
      : `/lps/${source.slug}`;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  // Trava o srcDoc na primeira render — evita iframe recarregar quando o save
  // dispara revalidatePath e o componente re-renderiza com nova prop.
  const [frozenSrcDoc] = useState(() => injectScript(initialHtml));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [imageModal, setImageModal] = useState<
    (SelectedImage & { id: string; isBackground: boolean }) | null
  >(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [layers, setLayers] = useState<
    Array<{ id: string; tag: string; label: string; depth: number; isImage: boolean }>
  >([]);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const sendToIframe = useCallback((msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }, []);

  const exportHtml = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!iframeRef.current?.contentWindow) {
        reject(new Error("Iframe não pronto"));
        return;
      }
      const timeout = setTimeout(() => {
        window.removeEventListener("message", onMsg);
        reject(new Error("Timeout exportando HTML"));
      }, 5000);
      function onMsg(e: MessageEvent) {
        if (e.data?.type === "editor:exported") {
          clearTimeout(timeout);
          window.removeEventListener("message", onMsg);
          resolve(e.data.html);
        }
      }
      window.addEventListener("message", onMsg);
      iframeRef.current.contentWindow.postMessage({ type: "editor:export" }, "*");
    });
  }, []);

  const doSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const html = await exportHtml();
      const formData = new FormData();
      formData.set("slug", source.slug);
      formData.set("html", html);
      let result: { ok: boolean; error?: string };
      if (source.kind === "wp") {
        formData.set("domain", source.domain);
        result = await saveEditedContentAction(formData);
      } else {
        result = await saveEmbeddedHtmlAction(formData);
      }
      if (result.ok) {
        setSavedAt(new Date().toLocaleTimeString("pt-BR"));
        setDirty(false);
      } else {
        setError(result.error ?? "Erro desconhecido");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [source, exportHtml]);

  // Auto-save com debounce de 3s (só se ativado)
  useEffect(() => {
    if (!autoSave || !dirty || !ready) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      doSave();
    }, 3000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [autoSave, dirty, ready, doSave]);

  // Aviso antes de fechar/navegar
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || typeof data !== "object" || !data.type) return;

      if (data.type === "editor:ready") {
        setReady(true);
      } else if (data.type === "editor:dirty") {
        setDirty(true);
      } else if (data.type === "editor:select") {
        setSelected({
          id: data.id,
          tag: data.tag,
          className: data.className,
          text: data.text,
          hasBackgroundImage: data.hasBackgroundImage,
          imageSrc: data.imageSrc,
          imageAlt: data.imageAlt,
          childCount: data.childCount,
          hasParent: data.hasParent,
          styles: data.styles,
        });
      } else if (data.type === "editor:deselect") {
        setSelected(null);
      } else if (data.type === "editor:history") {
        setCanUndo(!!data.canUndo);
        setCanRedo(!!data.canRedo);
      } else if (data.type === "editor:layers") {
        setLayers(data.list || []);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function openImageReplace() {
    if (!selected) return;
    const isImg = selected.tag === "IMG";
    const isBg = selected.hasBackgroundImage;
    if (!isImg && !isBg) return;
    setImageModal({
      id: selected.id,
      currentSrc: selected.imageSrc || "",
      alt: selected.imageAlt || "",
      width: 0,
      height: 0,
      isBackground: !isImg && isBg,
    });
  }

  function handleSidebarExit(e: React.MouseEvent) {
    if (dirty) {
      const ok = confirm(
        "Você tem mudanças não salvas. Sair sem salvar?"
      );
      if (!ok) {
        e.preventDefault();
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      <header className="shrink-0 border-b border-[#1f1f1f] px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={backHref}
            onClick={handleSidebarExit}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Sair do editor
          </Link>
          <div className="h-5 w-px bg-[#1f1f1f]" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold leading-none">
              Editando
            </p>
            <p
              className="text-sm font-semibold text-white truncate mt-0.5"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          </div>
          <div className="h-5 w-px bg-[#1f1f1f]" />
          <button
            type="button"
            onClick={() => sendToIframe({ type: "editor:undo" })}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#161616] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 size={13} strokeWidth={2.2} />
            Desfazer
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="accent-white"
            />
            Auto-save
          </label>
          <div className="h-5 w-px bg-[#1f1f1f]" />
          <SaveStatus
            saving={saving}
            dirty={dirty}
            savedAt={savedAt}
            error={error}
            autoSave={autoSave}
          />
          <button
            type="button"
            onClick={doSave}
            disabled={saving || !ready || !dirty}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={14} strokeWidth={2.5} />
                Salvar
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <LeftToolbar
          onInsert={(kind, src) =>
            sendToIframe({ type: "editor:insert", kind, src })
          }
          showLayers={showLayers}
          onToggleLayers={() => {
            const next = !showLayers;
            setShowLayers(next);
            if (next) sendToIframe({ type: "editor:list-layers" });
          }}
        />

        {showLayers && (
          <LayersPanel
            layers={layers}
            selectedId={selected?.id}
            onSelectLayer={(id) =>
              sendToIframe({ type: "editor:select-by-id", id })
            }
            onHoverLayer={(id) =>
              sendToIframe({ type: "editor:highlight-by-id", id })
            }
            onLeaveLayer={() =>
              sendToIframe({ type: "editor:clear-highlight" })
            }
            onRefresh={() => sendToIframe({ type: "editor:list-layers" })}
          />
        )}

        <main className="flex-1 min-w-0 bg-neutral-900 relative">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-10">
              <div className="inline-flex items-center gap-2 text-neutral-400 text-sm">
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                Carregando editor...
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            srcDoc={frozenSrcDoc}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms"
            title={`Editando ${slug}`}
          />
        </main>

        <aside className="w-80 shrink-0 border-l border-[#1f1f1f] bg-[#0a0a0a] flex flex-col overflow-y-auto">
          <SidebarHeader selected={selected} />
          {selected ? (
            <SelectedPanel
              selected={selected}
              onReplaceImage={openImageReplace}
              onStyleChange={(property, value) => {
                sendToIframe({
                  type: "editor:apply-style",
                  id: selected.id,
                  property,
                  value,
                });
                setSelected((p) =>
                  p ? { ...p, styles: { ...p.styles, [property]: value } } : p
                );
              }}
              onLayerAction={(action) =>
                sendToIframe({ type: `editor:${action}`, id: selected.id })
              }
              onSelectParent={() =>
                sendToIframe({
                  type: "editor:select-parent",
                  id: selected.id,
                })
              }
              onResetTransform={() =>
                sendToIframe({
                  type: "editor:reset-transform",
                  id: selected.id,
                })
              }
              onDelete={() => {
                if (!confirm("Excluir esse elemento?")) return;
                sendToIframe({ type: "editor:delete", id: selected.id });
              }}
            />
          ) : (
            <EmptyState />
          )}
        </aside>
      </div>

      {imageModal && (
        <ImageReplaceModal
          image={imageModal}
          onClose={() => setImageModal(null)}
          onReplace={(newSrc) => {
            sendToIframe({
              type: "editor:replace-image",
              id: imageModal.id,
              newSrc,
            });
            setImageModal(null);
          }}
        />
      )}
    </div>
  );
}

function SaveStatus({
  saving,
  dirty,
  savedAt,
  error,
  autoSave,
}: {
  saving: boolean;
  dirty: boolean;
  savedAt: string | null;
  error: string | null;
  autoSave: boolean;
}) {
  if (error) {
    return (
      <span className="text-xs text-rose-300 font-medium inline-flex items-center gap-1">
        <AlertCircle size={12} strokeWidth={2.2} />
        {error}
      </span>
    );
  }
  if (saving) {
    return (
      <span className="text-xs text-neutral-400 font-medium inline-flex items-center gap-1">
        <Loader2 size={12} strokeWidth={2.2} className="animate-spin" />
        Salvando...
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="text-xs text-amber-300 font-medium inline-flex items-center gap-1">
        <AlertCircle size={12} strokeWidth={2.2} />
        {autoSave ? "Salvando em 3s..." : "Mudanças não salvas"}
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="text-xs text-emerald-300 font-medium inline-flex items-center gap-1">
        <CheckCircle2 size={12} strokeWidth={2.2} />
        Salvo {savedAt}
      </span>
    );
  }
  return null;
}

function LeftToolbar({
  onInsert,
  showLayers,
  onToggleLayers,
}: {
  onInsert: (kind: string, src?: string) => void;
  showLayers: boolean;
  onToggleLayers: () => void;
}) {
  return (
    <div className="w-14 shrink-0 border-r border-[#1f1f1f] bg-[#0a0a0a] flex flex-col items-center py-3 gap-1">
      <p className="text-[8px] uppercase tracking-wider text-neutral-600 font-semibold mb-1">
        Add
      </p>
      <ToolButton icon={Type} label="Texto" onClick={() => onInsert("text")} />
      <ToolButton
        icon={Square}
        label="Título"
        onClick={() => onInsert("heading")}
      />
      <ToolButton
        icon={Plus}
        label="Botão"
        onClick={() => onInsert("button")}
      />
      <ToolButton
        icon={ImageIcon}
        label="Imagem"
        onClick={() => {
          const url = prompt("URL da imagem:");
          if (url) onInsert("image", url);
        }}
      />
      <ToolButton icon={Square} label="Caixa" onClick={() => onInsert("box")} />

      <div className="w-8 h-px bg-[#1f1f1f] my-2" />

      <button
        type="button"
        onClick={onToggleLayers}
        title="Camadas"
        className={
          showLayers
            ? "w-10 h-10 rounded-md flex flex-col items-center justify-center text-white bg-[#161616] transition"
            : "w-10 h-10 rounded-md flex flex-col items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
        }
      >
        <Layers size={14} strokeWidth={2} />
        <span className="text-[8px] uppercase tracking-wider mt-0.5 font-semibold">
          Camadas
        </span>
      </button>
    </div>
  );
}

function LayersPanel({
  layers,
  selectedId,
  onSelectLayer,
  onHoverLayer,
  onLeaveLayer,
  onRefresh,
}: {
  layers: Array<{
    id: string;
    tag: string;
    label: string;
    depth: number;
    isImage: boolean;
  }>;
  selectedId?: string;
  onSelectLayer: (id: string) => void;
  onHoverLayer: (id: string) => void;
  onLeaveLayer: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="w-64 shrink-0 border-r border-[#1f1f1f] bg-[#0a0a0a] flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-[#1f1f1f] flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
            Camadas
          </p>
          <p className="text-xs font-semibold text-white mt-0.5">
            {layers.length} elementos
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          title="Atualizar lista"
          className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
        >
          <RefreshCw size={12} strokeWidth={2} />
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto scrollbar-thin py-1"
        onMouseLeave={onLeaveLayer}
      >
        {layers.length === 0 ? (
          <p className="px-4 py-6 text-xs text-neutral-500 text-center">
            Carregando elementos...
          </p>
        ) : (
          layers.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelectLayer(l.id)}
              onMouseEnter={() => onHoverLayer(l.id)}
              className={clsx(
                "w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs transition truncate",
                selectedId === l.id
                  ? "bg-blue-500/20 text-white"
                  : "text-neutral-400 hover:bg-[#121212] hover:text-white"
              )}
              style={{ paddingLeft: 8 + Math.min(l.depth, 6) * 10 }}
            >
              <span className="shrink-0 text-neutral-600">
                {l.isImage ? (
                  <ImageIcon size={11} strokeWidth={2} />
                ) : l.tag.startsWith("H") ? (
                  <Type size={11} strokeWidth={2} />
                ) : l.tag === "BUTTON" ? (
                  <Square size={11} strokeWidth={2} />
                ) : (
                  <Layers size={11} strokeWidth={1.8} />
                )}
              </span>
              <span className="truncate">{l.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`+ ${label}`}
      className="w-10 h-10 rounded-md flex flex-col items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
    >
      <Icon size={14} strokeWidth={2} />
      <span className="text-[8px] uppercase tracking-wider mt-0.5 font-semibold">
        {label}
      </span>
    </button>
  );
}

function SidebarHeader({ selected }: { selected: SelectedInfo | null }) {
  return (
    <div className="px-5 pt-5 pb-4 border-b border-[#1f1f1f]">
      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
        Inspetor
      </p>
      <h3 className="text-base font-semibold text-white tracking-[-0.02em] mt-1">
        {selected ? `<${selected.tag.toLowerCase()}>` : "Nada selecionado"}
      </h3>
      {selected?.className && (
        <p className="text-[11px] text-neutral-500 font-mono mt-1 truncate">
          .{selected.className.split(" ").slice(0, 3).join(".")}
        </p>
      )}
    </div>
  );
}

function SelectedPanel({
  selected,
  onReplaceImage,
  onStyleChange,
  onLayerAction,
  onSelectParent,
  onResetTransform,
  onDelete,
}: {
  selected: SelectedInfo;
  onReplaceImage: () => void;
  onStyleChange: (property: string, value: string) => void;
  onLayerAction: (
    action: "bring-front" | "send-back" | "bring-top" | "send-bottom"
  ) => void;
  onSelectParent: () => void;
  onResetTransform: () => void;
  onDelete: () => void;
}) {
  const isImage = selected.tag === "IMG";
  const hasBg = selected.hasBackgroundImage;
  const showImageButton = isImage || hasBg;
  const isContainer = selected.childCount > 2;

  return (
    <div className="px-5 py-5 space-y-4">
      {isContainer && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-amber-300 inline-flex items-center gap-1.5 mb-1">
            <AlertCircle size={12} strokeWidth={2.4} />
            {selected.childCount} elementos dentro
          </p>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Esse elemento contém outros. Pra editar só uma parte, clique direto
            no elemento específico que quer mexer.
          </p>
        </div>
      )}

      {selected.text && !isImage && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-2">
            Conteúdo
          </p>
          <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-300 max-h-24 overflow-y-auto">
            {selected.text}
          </div>
        </div>
      )}

      {showImageButton && (
        <button
          type="button"
          onClick={onReplaceImage}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white text-[#0a0a0a] hover:opacity-90 transition"
        >
          <RefreshCw size={13} strokeWidth={2.4} />
          {isImage ? "Trocar imagem" : "Trocar imagem de fundo"}
        </button>
      )}

      <StylePanel
        styles={selected.styles}
        onChange={onStyleChange}
        showFont={!isImage}
      />

      <LayerPanel onAction={onLayerAction} currentZ={selected.styles.zIndex} />

      <div className="grid grid-cols-2 gap-2">
        {selected.hasParent && (
          <button
            type="button"
            onClick={onSelectParent}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold text-neutral-300 bg-[#161616] border border-[#1f1f1f] hover:border-neutral-700 hover:text-white transition"
          >
            <ArrowUpFromLine size={12} strokeWidth={2.2} />
            Pai
          </button>
        )}
        <button
          type="button"
          onClick={onResetTransform}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold text-neutral-300 bg-[#161616] border border-[#1f1f1f] hover:border-neutral-700 hover:text-white transition"
        >
          <RefreshCw size={12} strokeWidth={2.2} />
          Resetar pos
        </button>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition"
      >
        <Trash2 size={13} strokeWidth={2.2} />
        Excluir
      </button>
    </div>
  );
}

const FONT_WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Normal" },
  { value: "600", label: "Semi" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra" },
];

const ALIGNMENTS = [
  { value: "left", label: "←" },
  { value: "center", label: "↔" },
  { value: "right", label: "→" },
  { value: "justify", label: "≡" },
];

function StylePanel({
  styles,
  onChange,
  showFont,
}: {
  styles: NonNullable<SelectedInfo["styles"]>;
  onChange: (property: string, value: string) => void;
  showFont: boolean;
}) {
  const fontSizePx = parseInt(styles.fontSize, 10) || 16;
  const currentWeight = String(parseInt(styles.fontWeight, 10) || 400);
  const letterSpacingPx = parseFloat(styles.letterSpacing) || 0;
  const lineHeightRaw = parseFloat(styles.lineHeight);
  // Se lineHeight vem em px (ex: 24px), normaliza dividindo pelo fontSize
  const lineHeightNum = isNaN(lineHeightRaw)
    ? 1.4
    : styles.lineHeight.endsWith("px")
    ? lineHeightRaw / fontSizePx
    : lineHeightRaw;

  return (
    <div className="space-y-3 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
        Estilo
      </p>

      <div>
        <label className="flex items-center justify-between text-[11px] text-neutral-400 font-medium mb-1.5">
          <span>{showFont ? "Cor do texto" : "Cor"}</span>
          <span className="font-mono text-neutral-500">{styles.color}</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={styles.color}
            onChange={(e) => onChange("color", e.target.value)}
            className="w-10 h-9 rounded border border-[#1f1f1f] bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={styles.color}
            onChange={(e) => onChange("color", e.target.value)}
            className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-neutral-600"
          />
        </div>
      </div>

      {showFont && (
        <>
          <div>
            <label className="flex items-center justify-between text-[11px] text-neutral-400 font-medium mb-1.5">
              <span>Tamanho da fonte</span>
              <span className="font-mono text-neutral-500">{fontSizePx}px</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={8}
                max={300}
                value={fontSizePx}
                onChange={(e) => onChange("fontSize", `${e.target.value}px`)}
                className="flex-1 accent-white"
              />
              <input
                type="number"
                min={4}
                max={500}
                value={fontSizePx}
                onChange={(e) => onChange("fontSize", `${e.target.value}px`)}
                className="w-14 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-[11px] text-neutral-400 font-medium mb-1.5">
              <span>Espaçamento entre letras</span>
              <span className="font-mono text-neutral-500">{letterSpacingPx}px</span>
            </label>
            <input
              type="range"
              min={-5}
              max={30}
              step={0.5}
              value={letterSpacingPx}
              onChange={(e) => onChange("letterSpacing", `${e.target.value}px`)}
              className="w-full accent-white"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-[11px] text-neutral-400 font-medium mb-1.5">
              <span>Altura da linha</span>
              <span className="font-mono text-neutral-500">{lineHeightNum.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0.8}
              max={3}
              step={0.1}
              value={lineHeightNum}
              onChange={(e) => onChange("lineHeight", e.target.value)}
              className="w-full accent-white"
            />
          </div>

          <div>
            <p className="text-[11px] text-neutral-400 font-medium mb-1.5">
              Peso
            </p>
            <div className="grid grid-cols-5 gap-1">
              {FONT_WEIGHTS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => onChange("fontWeight", w.value)}
                  className={
                    currentWeight === w.value
                      ? "px-1 py-1.5 rounded-md bg-white text-[#0a0a0a] text-[10px] font-semibold"
                      : "px-1 py-1.5 rounded-md bg-[#161616] text-neutral-400 hover:text-white text-[10px] font-medium border border-[#1f1f1f]"
                  }
                  style={{ fontWeight: parseInt(w.value, 10) }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-neutral-400 font-medium mb-1.5">
              Alinhamento
            </p>
            <div className="grid grid-cols-4 gap-1">
              {ALIGNMENTS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => onChange("textAlign", a.value)}
                  className={
                    styles.textAlign === a.value
                      ? "px-2 py-1.5 rounded-md bg-white text-[#0a0a0a] text-sm font-bold"
                      : "px-2 py-1.5 rounded-md bg-[#161616] text-neutral-400 hover:text-white text-sm font-bold border border-[#1f1f1f]"
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LayerPanel({
  onAction,
  currentZ,
}: {
  onAction: (
    action: "bring-front" | "send-back" | "bring-top" | "send-bottom"
  ) => void;
  currentZ: string;
}) {
  return (
    <div className="space-y-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
          Camadas
        </p>
        <span className="text-[10px] text-neutral-600 font-mono">
          z: {currentZ}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <LayerBtn icon={ChevronsUp} label="Topo" onClick={() => onAction("bring-top")} />
        <LayerBtn icon={ArrowUp} label="+1" onClick={() => onAction("bring-front")} />
        <LayerBtn icon={ChevronsDown} label="Fundo" onClick={() => onAction("send-bottom")} />
        <LayerBtn icon={ArrowDown} label="-1" onClick={() => onAction("send-back")} />
      </div>
    </div>
  );
}

function LayerBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-1.5 rounded-md bg-[#161616] text-neutral-300 hover:text-white hover:bg-[#1f1f1f] text-xs font-semibold border border-[#1f1f1f] inline-flex items-center justify-center gap-1.5"
    >
      <Icon size={12} strokeWidth={2.2} />
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-full border border-dashed border-[#262626] flex items-center justify-center mb-3">
        <MousePointer2 size={18} strokeWidth={1.6} className="text-neutral-500" />
      </div>
      <p className="text-sm font-semibold text-neutral-300">
        Clique em algo na página
      </p>
      <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
        Arraste o elemento pra mover · cantos pra redimensionar · click pra
        editar texto · Esc pra deselecionar
      </p>
    </div>
  );
}
