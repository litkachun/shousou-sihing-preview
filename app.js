(() => {
  'use strict';
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const closeMenu = () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','開啟導覽選單'); };
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded',String(open)); toggle.setAttribute('aria-label',open?'關閉導覽選單':'開啟導覽選單'); nav.classList.toggle('is-open',open);
  });
  document.addEventListener('keydown', e => { if(e.key==='Escape' && nav?.classList.contains('is-open')){closeMenu();toggle.focus();} });
  document.addEventListener('click', e => { if(nav?.classList.contains('is-open') && !e.target.closest('.site-header')) closeMenu(); });
  window.matchMedia('(min-width:961px)').addEventListener('change', e=>{if(e.matches)closeMenu();});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  const form = document.querySelector('#enquiry-form');
  if(!form) return;
  const status = document.querySelector('#form-status');
  const submit = form.querySelector('button[type=submit]');
  const setError = (field,message) => {
    document.querySelector(`#${field}-error`).textContent = message;
    if(field==='category') form.querySelectorAll('[name=category]').forEach(el=>{el.setAttribute('aria-invalid',String(!!message));el.setAttribute('aria-describedby','category-error');});
    else form.elements[field].setAttribute('aria-invalid',String(!!message));
  };
  const announce = (message,success=false) => { status.textContent=message;status.classList.toggle('success',success);status.focus(); };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if(submit.disabled)return;
    status.textContent='';status.classList.remove('success');
    const data = new FormData(form);
    const name = String(data.get('name')||'').trim();
    const phone = String(data.get('phone')||'').trim();
    const category = data.get('category');
    const digits = phone.replace(/[\s()-]/g,'');
    const errors = {
      name: !name || name.length>80 || /[\x00-\x1f<>]/.test(name) ? '請填寫你的姓名（最多 80 個字）。' : '',
      phone: !/^(?:\+852)?[2-9]\d{7}$/.test(digits) && !/^\+[1-9]\d{7,14}$/.test(digits) ? '請填寫有效電話：香港 8 位數字，或附國際區號。' : '',
      category: !['business','personal','other'].includes(category) ? '請選擇大概欠款類別。' : '',
      consent: !data.get('consent') ? '請先閱讀並確認資料收集及轉介告知。' : ''
    };
    Object.entries(errors).forEach(([field,message])=>setError(field,message));
    const first = Object.keys(errors).find(key=>errors[key]);
    if(first){(first==='category'?form.querySelector('[name=category]'):form.elements[first]).focus();return;}
    // Do not transmit any personal data while intake is closed.
    if(form.dataset.intake!=='true'){announce('未能提交：網上查詢暫未開放。你的資料未有送出，請稍後再試。');return;}
    submit.disabled=true;submit.querySelector('span').textContent='正在提交…';form.setAttribute('aria-busy','true');
    try {
      const basePath = document.querySelector('meta[name="site-base"]')?.content || '';
      const response = await fetch(`${basePath}/api/enquiry`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone:digits,category,consent:true}),signal:AbortSignal.timeout(15000)});
      const result = await response.json();
      if(!response.ok || result.accepted!==true || typeof result.receiptId!=='string' || !result.receiptId.trim()) throw new Error('unconfirmed');
      form.reset();announce('查詢已提交，接收端已確認收到。合作承辦公司將按轉介安排聯絡你。',true);
    } catch {
      announce('未能確認查詢已提交，請保留目前資料，稍後再試。為免重複提交，如曾收到確認，請先向聯絡方查詢。');
    } finally {
      submit.disabled=false;submit.querySelector('span').textContent='送出免費初步查詢';form.removeAttribute('aria-busy');
    }
  });
})();
