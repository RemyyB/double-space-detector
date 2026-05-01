const WS_BASE = `(?:[\u0020\u00A0\t\u2028\u2029]{2,}|[\u0020\u00A0\t][\n\u2028\u2029]|[\n\u2028\u2029][\u0020\u00A0\t])`;
const WS_TEST = new RegExp(WS_BASE);
const WS_REPLACE = new RegExp(`(\\S)(${WS_BASE})(?=\\S)`, 'g');
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

function countDoubleSpaces() {
    return getTextNodes().reduce((count, node) => {
        const matches = node.textContent.match(WS_REPLACE);
        return count + (matches?.length ?? 0);
    }, 0);
}

function highlightDoubleSpaces() {
    for (const node of getTextNodes()) {
        if (!WS_TEST.test(node.textContent)) continue;
        const span = document.createElement('span');
        span.innerHTML = node.textContent.replace(WS_REPLACE,
            `$1<mark data-dsd style="${MARK_STYLE}">$2</mark>`
        );
        node.replaceWith(...span.childNodes);
    }
}

chrome.runtime.sendMessage({ action: 'updateBadge', count: countDoubleSpaces() });

chrome.runtime.onMessage.addListener(({ action }) => {
    if (action !== 'highlightSpaces') return;
    highlightDoubleSpaces()
    document.querySelector('mark[data-dsd]').scrollIntoView({ behavior: 'smooth', block: 'center'  });
});
