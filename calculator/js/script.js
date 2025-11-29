// script.js
(function(){
  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  const buttons = Array.from(document.querySelectorAll('.btn'));
  let expr = ''; // current expression

  function render(){
    expressionEl.textContent = expr || '0';
    // try to compute result preview
    try {
      const safe = sanitize(expr);
      if (safe.length && /[0-9)]$/.test(safe)) {
        const val = evaluate(safe);
        resultEl.textContent = Number.isFinite(val) ? formatNumber(val) : '';
      } else {
        resultEl.textContent = '';
      }
    } catch(e){
      resultEl.textContent = '';
    }
  }

  function formatNumber(n){
    // show up to 10 significant digits, remove trailing zeros
    if (!isFinite(n)) return '';
    const s = +parseFloat(n.toPrecision(12));
    return s.toString();
  }

  // sanitize: allow only digits, operators, dot, parentheses, spaces
  function sanitize(s){
    if (!s) return '';
    const allowed = /^[0-9+\-*/().\s%]*$/;
    if (!allowed.test(s)) throw new Error('Invalid characters');
    // replace unicode multiply/divide for safety
    return s.replace(/×/g,'*').replace(/÷/g,'/').replace(/%/g,'%');
  }

  // evaluate expression with percent handling:
  function evaluate(s){
    // handle percent: convert "x%" into "(x/100)"
    // But keep things like "50+10%" => 50 + (50*(10/100)) is complex; we'll interpret x% as x/100
    // Simpler: replace number% with (number/100)
    const replaced = s.replace(/(\d+(\.\d+)?)%/g, '($1/100)');
    // Use Function to evaluate; sanitized beforehand
    // eslint-disable-next-line no-new-func
    const fn = new Function('return (' + replaced + ')');
    return fn();
  }

  // button clicks
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.value;
      const action = btn.dataset.action;
      if (v !== undefined) {
        // number or dot or operator
        // prevent multiple dots in a number: basic guard
        if (v === '.' ) {
          const parts = expr.split(/[\+\-\*\/\s]/);
          const last = parts[parts.length-1] || '';
          if (last.includes('.')) return;
          if (last === '') expr += '0';
        }
        expr += v;
      } else if (action) {
        if (action === 'clear') {
          expr = '';
        } else if (action === 'equals') {
          try {
            const val = evaluate(sanitize(expr));
            expr = (Number.isFinite(val) ? formatNumber(val) : '');
          } catch(e){
            expr = '';
            alert('Error'); // simple error feedback
          }
        } else if (action === 'neg') {
          // toggle sign of last number
          expr = toggleNeg(expr);
        } else if (action === 'percent') {
          expr += '%';
        }
      }
      render();
    });
  });

  // toggle negative for last number
  function toggleNeg(s){
    // find last number token
    const match = s.match(/(-?\d+(\.\d+)?)\s*$/);
    if (!match) {
      // if nothing, add '-' (start negative)
      return s + '-';
    }
    const num = match[1];
    const start = match.index;
    const toggled = (num.indexOf('-') === 0) ? num.slice(1) : ('-' + num);
    return s.slice(0, start) + toggled;
  }

  // keyboard support
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      document.querySelector('[data-action="equals"]').click();
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      expr = expr.slice(0,-1);
      render();
      return;
    }
    if (e.key === 'Escape') {
      expr = '';
      render();
      return;
    }
    const allowedKeys = '0123456789+-*/().%';
    if (allowedKeys.includes(e.key)) {
      expr += e.key;
      render();
    }
  });

  // initial render
  render();

})();
