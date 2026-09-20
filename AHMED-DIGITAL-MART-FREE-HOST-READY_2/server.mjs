import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import cookieSession from "cookie-session";
import bcrypt from "bcryptjs";
import multer from "multer";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

dotenv.config();
const app=express(), PORT=process.env.PORT||3000, __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(cors({origin:process.env.SITE_ORIGIN||true}));
app.use(express.json({limit:"30kb"}));
app.use(cookieSession({name:"ahmed_admin",keys:[process.env.SESSION_SECRET||"change-this-secret"],httpOnly:true,sameSite:"lax",secure:process.env.COOKIE_SECURE==="true",maxAge:1000*60*60*12}));
app.use(express.static(path.join(__dirname,"public")));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>cb(null,/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype))});
const supabase=process.env.SUPABASE_URL&&process.env.SUPABASE_SECRET_KEY?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}):null;
const cometApiKey=process.env.COMETAPI_KEY||"";
const cometApiBase=process.env.COMETAPI_BASE_URL||"https://api.cometapi.com/v1beta";
const cometApiModel=process.env.COMETAPI_MODEL||"gemini-3.8-flash";
const adminUser=process.env.ADMIN_USERNAME||"admin";
const adminHash=process.env.ADMIN_PASSWORD_HASH||"";
const adminPassword=process.env.ADMIN_PASSWORD||"";
const limiter=rateLimit({windowMs:60*1000,max:30,standardHeaders:true,legacyHeaders:false});

function requireSetup(res){if(!supabase)return res.status(503).json({error:"Supabase is not configured."});}
function auth(req,res,next){if(req.session?.admin===true)return next();return res.status(401).json({error:"Unauthorized"});}
const publicFields="id,name,description,price,stock,category,image_url,active,created_at,updated_at";
app.get("/api/products",async(req,res)=>{if(!supabase)return res.json([]);const {data,error}=await supabase.from("products").select(publicFields).eq("active",true).order("created_at",{ascending:false});if(error)return res.status(500).json({error:error.message});res.json(data||[])});
app.post("/api/orders",limiter,async(req,res)=>{
 requireSetup(res); if(!supabase)return;
 const {customer_name,phone,address,notes,items}=req.body||{};
 if(!customer_name||!phone||!address||!Array.isArray(items)||!items.length)return res.status(400).json({error:"Name, phone, address and at least one item are required."});
 const ids=items.map(x=>x.product_id);const {data:dbProducts,error}=await supabase.from("products").select("id,name,price,stock,active").in("id",ids);
 if(error)return res.status(500).json({error:error.message});
 const map=new Map((dbProducts||[]).map(p=>[p.id,p]));let clean=[],total=0;
 for(const x of items){const p=map.get(x.product_id),q=Math.max(1,Math.min(99,Number(x.quantity)||1));if(!p||!p.active)continue;if(p.stock<q)return res.status(400).json({error:`${p.name} এর stock পর্যাপ্ত নেই।`});clean.push({product_id:p.id,name:p.name,price:Number(p.price),quantity:q});total+=Number(p.price)*q;}
 if(!clean.length)return res.status(400).json({error:"No valid items."});
 const order={customer_name:String(customer_name).slice(0,120),phone:String(phone).slice(0,40),address:String(address).slice(0,500),notes:String(notes||"").slice(0,500),items:clean,total,status:"new"};
 const {data, error:insertError}=await supabase.from("orders").insert(order).select("id").single();
 if(insertError)return res.status(500).json({error:insertError.message});
 const lines=clean.map(x=>`• ${x.name} × ${x.quantity} = ৳${x.price*x.quantity}`).join("\n");
 const text=`AHMED DIGITAL & MART - New Order\nOrder ID: ${data.id}\nName: ${order.customer_name}\nPhone: ${order.phone}\nAddress: ${order.address}\n\n${lines}\n\nTotal: ৳${total}${order.notes?`\nNote: ${order.notes}`:""}`;
 res.json({order_id:data.id,whatsapp_url:`https://wa.me/${process.env.BUSINESS_WHATSAPP||"8801922198493"}?text=${encodeURIComponent(text)}`});
});

app.post("/api/chat",limiter,async(req,res)=>{
 if(!cometApiKey)return res.status(503).json({answer:"AI এখনো configure করা হয়নি। Wispbyte Environment Variables-এ COMETAPI_KEY দিন।"});
 const message=String(req.body?.message||"").trim();if(!message)return res.status(400).json({answer:"প্রশ্ন লিখুন।"});
 let products=[];
 if(supabase){const q=await supabase.from("products").select("id,name,description,price,stock,category,active").eq("active",true).order("name");if(!q.error)products=q.data||[];}
 const knowledge={business_name:"AHMED DIGITAL & MART",owner:"MD ALI AHMED",phone:"01922-198493",location:"Terokhada, Khulna, Bangladesh",payment_number:"01922198493",services:["Electronics","Mobile accessories","Computer services","Online services","Printing","Photo copy","bKash cash in/out","Nagad cash in/out","SIM sales","Mobile recharge","China product sourcing","Online purchase assistance","Digital subscriptions"],products};
 const instructions=`তুমি AHMED DIGITAL & MART-এর website AI assistant। বাংলা ভাষায় সংক্ষিপ্ত, পরিষ্কার ও বাস্তব তথ্য দাও। নিচের LIVE PRODUCT DATABASE প্রতি request-এ বর্তমান database থেকে নেওয়া হয়েছে। Product name, price এবং stock নিয়ে প্রশ্ন হলে শুধু এই data ব্যবহার করবে। stock 0 হলে available বলবে না। দাম/stock অনিশ্চিত হলে 01922-198493 নম্বরে যোগাযোগ করতে বলবে। অর্ডার হয়েছে বা payment হয়েছে এমন দাবি করবে না। কোনো third-party brand (Meta/Facebook, YouTube, Google, OpenAI ইত্যাদি)-এর official partnership/authorization দাবি করবে না। Password, OTP, API key বা sensitive credential চাইবে না।\n\nBUSINESS + LIVE PRODUCTS:\n${JSON.stringify(knowledge,null,2)}`;
 try{
   const apiRes=await fetch(`${cometApiBase}/models/${encodeURIComponent(cometApiModel)}:generateContent`,{
     method:"POST",
     headers:{"Authorization":cometApiKey,"Content-Type":"application/json"},
     body:JSON.stringify({contents:[{parts:[{text:`${instructions}\n\nCUSTOMER QUESTION:\n${message}`}]}]})
   });
   const data=await apiRes.json().catch(()=>({}));
   if(!apiRes.ok){console.error("CometAPI error",apiRes.status,data);return res.status(502).json({answer:"AI service-এ সাময়িক সমস্যা হচ্ছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।"});}
   const answer=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim()||data?.candidates?.[0]?.content?.parts?.[0]?.text||"উত্তর পাওয়া যায়নি।";
   res.json({answer});
 }catch(e){console.error("CometAPI request failed",e);res.status(500).json({answer:"AI service-এ সাময়িক সমস্যা হচ্ছে। 01922-198493 নম্বরে যোগাযোগ করুন।"});}
});

app.post("/api/admin/login",limiter,async(req,res)=>{
 const {username,password}=req.body||{};if(!adminHash&&!adminPassword)return res.status(503).json({error:"ADMIN_PASSWORD_HASH or ADMIN_PASSWORD is not configured."});
 const supplied=String(password||"");
 const validPassword=adminHash ? await bcrypt.compare(supplied,adminHash) : (adminPassword && supplied===adminPassword);
 if(username!==adminUser||!validPassword)return res.status(401).json({error:"Invalid login"});
 req.session.admin=true;res.json({ok:true});
});
app.post("/api/admin/logout",auth,(req,res)=>{req.session=null;res.json({ok:true})});
app.get("/api/admin/me",auth,(req,res)=>res.json({ok:true,username:adminUser}));
app.get("/api/admin/products",auth,async(req,res)=>{requireSetup(res);if(!supabase)return;const {data,error}=await supabase.from("products").select("*").order("created_at",{ascending:false});if(error)return res.status(500).json({error:error.message});res.json(data||[])});
app.post("/api/admin/products",auth,async(req,res)=>{requireSetup(res);if(!supabase)return;const {name,description,price,stock,category,image_url,active}=req.body||{};if(!name)return res.status(400).json({error:"Product name required"});const {data,error}=await supabase.from("products").insert({name,description:description||"",price:Number(price)||0,stock:Math.max(0,Number(stock)||0),category:category||"General",image_url:image_url||null,active:active!==false}).select().single();if(error)return res.status(500).json({error:error.message});res.json(data)});
app.put("/api/admin/products/:id",auth,async(req,res)=>{requireSetup(res);if(!supabase)return;const b=req.body||{};const patch={name:b.name,description:b.description||"",price:Number(b.price)||0,stock:Math.max(0,Number(b.stock)||0),category:b.category||"General",image_url:b.image_url||null,active:b.active!==false,updated_at:new Date().toISOString()};const {data,error}=await supabase.from("products").update(patch).eq("id",req.params.id).select().single();if(error)return res.status(500).json({error:error.message});res.json(data)});
app.delete("/api/admin/products/:id",auth,async(req,res)=>{requireSetup(res);if(!supabase)return;const {data:p}=await supabase.from("products").select("image_path").eq("id",req.params.id).single();const {error}=await supabase.from("products").delete().eq("id",req.params.id);if(error)return res.status(500).json({error:error.message});if(p?.image_path)await supabase.storage.from(process.env.SUPABASE_BUCKET||"product-images").remove([p.image_path]);res.json({ok:true})});
app.post("/api/admin/products/:id/photo",auth,upload.single("photo"),async(req,res)=>{requireSetup(res);if(!supabase)return;if(!req.file)return res.status(400).json({error:"Photo required"});const ext=req.file.mimetype.split("/")[1].replace("jpeg","jpg"),filePath=`products/${req.params.id}-${crypto.randomUUID()}.${ext}`,bucket=process.env.SUPABASE_BUCKET||"product-images";const {error}=await supabase.storage.from(bucket).upload(filePath,req.file.buffer,{contentType:req.file.mimetype,upsert:false,cacheControl:"3600"});if(error)return res.status(500).json({error:error.message});const {data:url}=supabase.storage.from(bucket).getPublicUrl(filePath);const {data,error:updateError}=await supabase.from("products").update({image_url:url.publicUrl,image_path:filePath,updated_at:new Date().toISOString()}).eq("id",req.params.id).select().single();if(updateError)return res.status(500).json({error:updateError.message});res.json(data)});
app.get("/api/admin/orders",auth,async(req,res)=>{requireSetup(res);if(!supabase)return;const {data,error}=await supabase.from("orders").select("*").order("created_at",{ascending:false}).limit(200);if(error)return res.status(500).json({error:error.message});res.json(data||[])});
app.patch("/api/admin/orders/:id",auth,async(req,res)=>{requireSetup(res);if(!supabase)return;const allowed=["new","confirmed","processing","completed","cancelled"];if(!allowed.includes(req.body.status))return res.status(400).json({error:"Invalid status"});const {data,error}=await supabase.from("orders").update({status:req.body.status,updated_at:new Date().toISOString()}).eq("id",req.params.id).select().single();if(error)return res.status(500).json({error:error.message});res.json(data)});

app.get("/health",(req,res)=>res.json({ok:true,service:"AHMED DIGITAL & MART"}));
app.use((req,res,next)=>{if(req.method==="GET" && !req.path.startsWith("/api/") && !req.path.startsWith("/admin")){return res.sendFile(path.join(__dirname,"public/index.html"));} next();});
app.listen(PORT,()=>console.log(`AHMED DIGITAL & MART running on :${PORT}`));
