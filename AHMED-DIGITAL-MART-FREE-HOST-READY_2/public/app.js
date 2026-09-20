let products=[],cart=JSON.parse(localStorage.getItem('ahmed_cart')||'{}');
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const money=n=>`৳${Number(n||0).toLocaleString('en-BD')}`;
async function loadProducts(){
 const r=await fetch('/api/products'); products=await r.json();
 const box=$('#products'); box.innerHTML=products.length?products.map(p=>`
 <article class="product">
 ${p.image_url?`<img src="${escapeAttr(p.image_url)}" alt="${escapeAttr(p.name)}">`:`<div style="height:190px;display:grid;place-items:center;font-size:55px">🛍️</div>`}
 <div class="product-body"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||'')}</p>
 <div class="price">${money(p.price)}</div><div class="stock ${p.stock>0?'ok':'no'}">${p.stock>0?'Stock: '+p.stock:'Out of stock'}</div>
 <div class="actions"><button class="mini" ${p.stock<1?'disabled':''} onclick="addToCart('${p.id}')">Add to Cart</button><a class="mini" target="_blank" href="https://wa.me/8801922198493?text=${encodeURIComponent('আমি '+p.name+' সম্পর্কে জানতে চাই।')}">WhatsApp</a></div>
 </div></article>`).join(''):'<p class="loading">এখন কোনো product নেই।</p>';
 renderCart();
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function escapeAttr(s){return escapeHtml(s);}
function addToCart(id){cart[id]=(cart[id]||0)+1;saveCart();renderCart();openCart();}
function changeQty(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];saveCart();renderCart();}
function saveCart(){localStorage.setItem('ahmed_cart',JSON.stringify(cart));}
function renderCart(){
 const rows=Object.entries(cart).map(([id,qty])=>{const p=products.find(x=>x.id===id);return p?`<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><br><small>${money(p.price)} × ${qty}</small></div><div class="qty"><button onclick="changeQty('${id}',-1)">−</button> ${qty} <button onclick="changeQty('${id}',1)">+</button></div><b>${money(Number(p.price)*qty)}</b></div>`:''}).join('');
 $('#cartItems').innerHTML=rows||'<p class="note">Cart খালি।</p>';
 const total=Object.entries(cart).reduce((s,[id,q])=>{const p=products.find(x=>x.id===id);return s+(p?Number(p.price)*q:0)},0);
 $('#cartTotal').textContent=money(total);$('#cartCount').textContent=Object.values(cart).reduce((a,b)=>a+b,0);
}
function openCart(){$('#cartDrawer').classList.add('open');$('#overlay').classList.add('show')}
function closeCart(){$('#cartDrawer').classList.remove('open');$('#overlay').classList.remove('show')}
$('#cartBtn').onclick=openCart;$('#closeCart').onclick=closeCart;$('#overlay').onclick=closeCart;
$('#orderForm').onsubmit=async e=>{
 e.preventDefault(); if(!Object.keys(cart).length)return alert('Cart খালি।');
 const fd=new FormData(e.target); const items=Object.entries(cart).map(([id,quantity])=>{const p=products.find(x=>x.id===id);return {product_id:id,name:p.name,price:Number(p.price),quantity}});
 try{
  const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_name:fd.get('customer_name'),phone:fd.get('phone'),address:fd.get('address'),notes:fd.get('notes'),items})});
  const data=await r.json(); if(!r.ok)throw new Error(data.error||'Order failed');
  cart={};saveCart();renderCart();e.target.reset();
  closeCart(); alert('Order received! WhatsApp-এ order details পাঠানো হবে।'); window.open(data.whatsapp_url,'_blank');
 }catch(err){alert(err.message)}
};
const form=$('#chatForm'),input=$('#question'),messages=$('#messages');
function addMsg(t,c){const d=document.createElement('div');d.className='msg '+c;d.textContent=t;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d}
$$('.suggestions button').forEach(b=>b.onclick=()=>{input.value=b.textContent;form.requestSubmit()});
form.onsubmit=async e=>{e.preventDefault();const q=input.value.trim();if(!q)return;input.value='';addMsg(q,'user');const wait=addMsg('Live product database দেখছি...','bot');try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q})});const d=await r.json();wait.textContent=d.answer||'উত্তর পাওয়া যায়নি।'}catch(_){wait.textContent='AI service-এ সমস্যা হচ্ছে। 01922-198493 নম্বরে যোগাযোগ করুন।'}};
loadProducts();
