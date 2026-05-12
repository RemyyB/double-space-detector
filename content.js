const WS_BASE = `(?:[\u0020\u00A0\t]{2,}|[\u0020\u00A0\t]\n|\n[\u0020\u00A0\t])`;
const WS_TEST = new RegExp(WS_BASE);
const WS_REPLACE = new RegExp(`(\\S)(${WS_BASE})(?=\\S)`, 'g');

// Chars that are Unicode whitespace but don't reliably render as spaces
// (e.g. Firefox ignores U+2028/2029 in inline layout)
const WEIRD_CHARS_TEST = /[\u2028\u2029]/;
const WEIRD_CHARS_REPLACE = /[\u2028\u2029]/g;

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

const MARK_STYLE = [
    'background: #FF4952',
    'color: white',
    'padding: 0 2px',
    'border-radius: 100vw',
    'font-weight: bold',
    'outline: 2px solid #FF4952',
    'outline-offset: 2px'
].join(';');

// Separate style so users can tell the two issue types apart at a glance
const WEIRD_MARK_STYLE = [
    'background: #FF8C00',
    'color: white',
    'padding: 0 2px',
    'border-radius: 100vw',
    'font-weight: bold',
    'outline: 2px solid #FF8C00',
    'outline-offset: 2px'
].join(';');

function getTextNodes() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: node => SKIP_TAGS.has(node.parentElement?.tagName)
                ? NodeFilter.FILTER_REJECT
                : NodeFilter.FILTER_ACCEPT }
    );
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightDoubleSpaces() {
    for (const node of getTextNodes()) {
        const hasDouble = WS_TEST.test(node.textContent);
        const hasWeird  = WEIRD_CHARS_TEST.test(node.textContent);
        if (!hasDouble && !hasWeird) continue;

        // Escape first, then apply both replacements on the safe string
        let html = escapeHtml(node.textContent);

        if (hasDouble) {
            // WS_REPLACE captures non-HTML chars so it's safe to run on escaped text
            html = html.replace(WS_REPLACE,
                `$1<mark data-dsd style="${MARK_STYLE}">$2</mark>`);
        }
        if (hasWeird) {
            html = html.replace(WEIRD_CHARS_REPLACE,
                `<mark data-dsd-weird title="U+2028/2029: not a space in Firefox" style="${WEIRD_MARK_STYLE}">$&</mark>`);
        }

        const span = document.createElement('span');
        span.innerHTML = html;
        node.replaceWith(...span.childNodes);
    }
}

const wsCount = getTextNodes().reduce((n, node) => n + (node.textContent.match(WS_REPLACE)?.length ?? 0), 0);
const weirdCount = getTextNodes().reduce((n, node) => n + (node.textContent.match(WEIRD_CHARS_REPLACE)?.length ?? 0), 0);

chrome.runtime.sendMessage({ action: 'updateBadge', wsCount, weirdCount }, () => {
    if (chrome.runtime.lastError) {}
});

chrome.runtime.onMessage.addListener(({ action }) => {
    if (action !== 'highlightSpaces') return;
    highlightDoubleSpaces();
    const first = document.querySelector('mark[data-dsd], mark[data-dsd-weird]');
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
