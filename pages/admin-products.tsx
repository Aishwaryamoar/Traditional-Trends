import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardPaste, ImagePlus, PackagePlus, Pencil, Search, Trash2, X, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { AdminRoute } from "../components/ProtectedRoute";
import { postCreateProduct } from "../endpoints/admin/products/create_POST.schema";
import { getAdminProducts } from "../endpoints/admin/products/list_GET.schema";
import { postUpdateProduct } from "../endpoints/admin/products/update_POST.schema";
import { postDeleteProduct } from "../endpoints/admin/products/delete_POST.schema";
import styles from "./admin-products.module.css";

const sampleMessage=["👉Fabrics : pure Dhabu cotton ✨","👉Aline Kalamkari aplik work & Back side work one side pocket","👉pent : same Fabric matching","👉 size:Xxl only","👉wholesale & dealer price 950/-free $"].join("\n\n");
const categories=["Sarees","Kurtas","Kurta Sets","Sets","Co-ords","Shirts","Tops","Dresses"];

function parsePreview(raw:string, marginPercent:number){
  const text=raw.replace(/\r/g,"").trim(), lower=text.toLowerCase();
  const match=(patterns:RegExp[])=>{for(const p of patterns){const m=text.match(p);if(m?.[1])return m[1].trim();}return ""};
  const fabric=match([/fabrics?\s*[:\-]\s*([^\n]+)/i,/fabric\s*[:\-]\s*([^\n]+)/i]).replace(/[✨⭐️]+/g,"").trim();
  const work=match([/(?:👉\s*)?aline[^\n]*/i,/(?:👉\s*)?a[-\s]?line[^\n]*/i]).replace(/^[👉\s]+/,"").trim();
  const pants=match([/(?:👉\s*)?(?:pant|pants)\s*[:\-]\s*([^\n]+)/i]);
  const sizeRaw=match([/size\s*[:\-]\s*([^\n]+)/i]).replace(/\s+only.*$/i,"").trim();
  const inchSizes=(sizeRaw.match(/\b(?:34|36|38|40|42|44|46|48|50|52|54|56)\b/g)??[]).filter((v,i,a)=>a.indexOf(v)===i);
  const labelSizes=(sizeRaw.match(/\b(?:XS|S|M|L|XL|XXL|XXXL|[2-8]XL)\b/gi)??[]).map(v=>v.toUpperCase().replace("XXXL","3XL").replace("XXL","2XL")).filter((v,i,a)=>a.indexOf(v)===i);
  const size=inchSizes.length?inchSizes.join(", "):labelSizes.join(", ");
  const costText=match([/(?:wholesale|dealer)[^\d]{0,30}(\d[\d,]*)/i,/price[^\d]{0,20}(\d[\d,]*)/i]);
  const cost=Number(costText.replace(/,/g,""));
  const category=/saree/i.test(lower)?"Sarees":/shirt/i.test(lower)?"Shirts":/top/i.test(lower)?"Tops":/co[- ]?ord/i.test(lower)?"Co-ords":/kurta|kurti|a[- ]?line/i.test(lower)?"Kurta Sets":/dress/i.test(lower)?"Dresses":"Sets";
  const workName=/kalamkari/i.test(lower)?"Kalamkari":"", silhouette=/a[- ]?line/i.test(lower)?"A-Line":"";
  const productName=[fabric?fabric.replace(/\b\w/g,c=>c.toUpperCase()):"",workName,silhouette,category==="Kurta Sets"?"Kurta Set":category.slice(0,-1)].filter(Boolean).join(" ");
  const price=Number.isFinite(cost)&&cost>0?Math.ceil((cost/(1-marginPercent/100)-99)/100)*100+99:0;
  return {fabric,work,pants,size,cost,category,productName,price};
}

type Product=Record<string,any>;

function AdminProducts(){
  const [message,setMessage]=useState(""); const [margin,setMargin]=useState("30"); const [imageUrls,setImageUrls]=useState<string[]>([]);
  const [products,setProducts]=useState<Product[]>([]); const [search,setSearch]=useState(""); const [editing,setEditing]=useState<Product|null>(null);
  const [saving,setSaving]=useState(false); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  const preview=useMemo(()=>parsePreview(message,Number(margin)||30),[message,margin]);

  const loadProducts=async()=>{setLoading(true);const result=await getAdminProducts();if("products" in result)setProducts(result.products);else setError(result.error);setLoading(false)};
  useEffect(()=>{loadProducts()},[]);

  const readImage=(file:File)=>new Promise<string>((resolve,reject)=>{if(!file.type.startsWith("image/"))return reject(new Error("Please choose an image file."));if(file.size>3*1024*1024)return reject(new Error("Please keep product images under 3 MB."));const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Could not read image."));reader.readAsDataURL(file)});
  const chooseImages=async(e:React.ChangeEvent<HTMLInputElement>,setter:(v:string[])=>void)=>{const files=Array.from(e.target.files??[]).slice(0,4);if(!files.length)return;try{const images=await Promise.all(files.map(readImage));setter(images);setError("")}catch(err){setError(err instanceof Error?err.message:"Could not upload images.")}e.target.value=""};

  const publish=async()=>{setError("");setNotice("");if(!message.trim()){setError("Paste the supplier's WhatsApp message first.");return}setSaving(true);try{const result=await postCreateProduct({rawMessage:message,marginPercent:Number(margin)||30,imageUrl:imageUrls[0]??"",imageUrls});if("error" in result)setError(result.error);else{setNotice("Product added successfully.");setMessage("");setImageUrls([]);await loadProducts()}}catch{setError("Something went wrong while publishing the product.")}finally{setSaving(false)}};

  const startEdit=(p:Product)=>{setEditing({...p,imageUrls:Array.isArray(p.imageUrls)&&p.imageUrls.length?p.imageUrls:(p.imageUrl?[p.imageUrl]:[])});setError("");setNotice("")};
  const saveEdit=async()=>{if(!editing)return;setSaving(true);setError("");setNotice("");try{const result=await postUpdateProduct({id:Number(editing.id),name:String(editing.name),category:String(editing.category),price:Number(editing.price),oldPrice:editing.oldPrice==null||editing.oldPrice===""?null:Number(editing.oldPrice),tag:editing.tag?String(editing.tag):null,imageUrl:editing.imageUrls?.[0]?String(editing.imageUrls[0]):(editing.imageUrl?String(editing.imageUrl):null),imageUrls:Array.isArray(editing.imageUrls)?editing.imageUrls:[],description:editing.description?String(editing.description):null,fabric:editing.fabric?String(editing.fabric):null,workDetails:editing.workDetails?String(editing.workDetails):null,sizes:editing.sizes?String(editing.sizes):null,stock:Number(editing.stock)||0,costPrice:editing.costPrice==null||editing.costPrice===""?null:Number(editing.costPrice),marginPercent:Number(editing.marginPercent)||30,sku:editing.sku?String(editing.sku):null,status:editing.stock===0?"out_of_stock":(editing.status==="out_of_stock"?"out_of_stock":"active"),isSale:Boolean(editing.isSale)});if("error" in result)setError(result.error);else{setNotice("Product updated.");setEditing(null);await loadProducts()}}catch{setError("Could not update product.")}finally{setSaving(false)}};

  const toggleStock=async(p:Product)=>{const nextStock=Number(p.stock)>0?0:1;const nextStatus=nextStock===0?"out_of_stock":"active";setSaving(true);const result=await postUpdateProduct({id:Number(p.id),name:String(p.name),category:String(p.category),price:Number(p.price),oldPrice:p.oldPrice==null?null:Number(p.oldPrice),tag:p.tag?String(p.tag):null,imageUrl:p.imageUrl?String(p.imageUrl):null,imageUrls:Array.isArray(p.imageUrls)?p.imageUrls:(p.imageUrl?[p.imageUrl]:[]),description:p.description?String(p.description):null,fabric:p.fabric?String(p.fabric):null,workDetails:p.workDetails?String(p.workDetails):null,sizes:p.sizes?String(p.sizes):null,stock:nextStock,costPrice:p.costPrice==null?null:Number(p.costPrice),marginPercent:Number(p.marginPercent)||30,sku:p.sku?String(p.sku):null,status:nextStatus,isSale:Boolean(p.isSale)});if("error" in result)setError(result.error);else await loadProducts();setSaving(false)};

  const remove=async(id:number)=>{if(!window.confirm("Delete this product permanently? This cannot be undone."))return;setSaving(true);const result=await postDeleteProduct({id});if("error" in result)setError(result.error);else{setNotice("Product deleted.");await loadProducts()}setSaving(false)};
  const filtered=products.filter(p=>String(p.name).toLowerCase().includes(search.toLowerCase())||String(p.category).toLowerCase().includes(search.toLowerCase())||String(p.sku??"").toLowerCase().includes(search.toLowerCase()));

  const field=(label:string,key:string)=><label className={styles.field}><span>{label}</span><Input value={String(editing?.[key]??"")} onChange={e=>editing&&setEditing({...editing,[key]:e.target.value})}/></label>;

  return <div className={styles.page}>
    <header className={styles.header}><Link to="/" className={styles.logo}>traditional<span>trends</span></Link><div className={styles.headerRight}><span className={styles.adminBadge}><Sparkles size={13}/> ADMIN</span><Link to="/" className={styles.back}><ArrowLeft size={15}/> Back to shop</Link></div></header>
    <main className={styles.main}>
      <section className={styles.intro}><div><p className={styles.eyebrow}>PRODUCT COMMAND CENTER</p><h1>Manage your<br/><em>entire catalog.</em></h1><p>Create products from WhatsApp, upload images, edit details, control stock and remove products you no longer need.</p></div><div className={styles.introIcon}><Wand2 size={30}/></div></section>

      <section className={styles.workspace}>
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}><ClipboardPaste size={19}/><div><h2>Add from WhatsApp</h2><p>Paste supplier details and let the system calculate your retail price.</p></div></div>
          <Textarea value={message} onChange={e=>{setMessage(e.target.value);setNotice("")}} placeholder={sampleMessage} className={styles.messageBox}/>
          <div className={styles.settings}><label><span>Target margin</span><div className={styles.inputWithSuffix}><Input type="number" min="1" max="90" value={margin} onChange={e=>setMargin(e.target.value)}/><b>%</b></div></label><label><span>Product images (up to 4)</span><label className={styles.uploadBox}><ImagePlus size={18}/><span>{imageUrls.length?`${imageUrls.length} image${imageUrls.length>1?"s":""} selected`:'Choose up to 4 images'}</span><input type="file" accept="image/*" multiple onChange={e=>chooseImages(e,setImageUrls)}/></label></label></div>
          {imageUrls.length>0&&<div className={styles.selectedImages}>{imageUrls.map((src,i)=><img key={i} src={src} className={styles.selectedImage} alt={`Selected product ${i+1}`}/>)}</div>}
          <Button size="lg" onClick={publish} disabled={saving||!message.trim()}><PackagePlus size={18}/>{saving?"Saving...":"Add product"}</Button>
          {error&&<p className={styles.error}>{error}</p>}{notice&&<p className={styles.success}><CheckCircle2 size={17}/>{notice}</p>}
        </div>
        <aside className={styles.previewCard}><div className={styles.cardTitle}><Wand2 size={19}/><div><h2>Auto-generated preview</h2><p>Based on your WhatsApp message</p></div></div>{message.trim()&&preview.cost>0?<div className={styles.preview}>{imageUrls[0]?<img src={imageUrls[0]} className={styles.previewImage} alt="Product preview"/>:<div className={styles.previewImage}><span>PRODUCT<br/>PREVIEW</span></div>}<p className={styles.category}>{preview.category}</p><h3>{preview.productName||"Traditional Trends Product"}</h3><p className={styles.description}>{preview.fabric?"Fabric: "+preview.fabric+" ":""}{preview.work?"· "+preview.work.replace(/^aline\s*/i,"").trim()+" ":""}{preview.pants?"· Matching pants: "+preview.pants+" ":""}{preview.size?"· Supplier size: "+preview.size+" inch":""}</p>{preview.size&&<p className={styles.description}><b>Customer size:</b> {preview.size.split(", ").map((v:string)=>({"34":"XS","36":"S","38":"M","40":"L","42":"XL","44":"2XL","46":"3XL","48":"4XL","50":"5XL","52":"6XL","54":"7XL","56":"8XL"}[v]||v)).join(", ")}</p>}<div className={styles.priceRow}><div><small>Your cost</small><b>₹{preview.cost.toLocaleString("en-IN")}</b></div><div><small>Suggested price</small><strong>₹{preview.price.toLocaleString("en-IN")}</strong></div></div><div className={styles.marginPill}>{margin}% target margin · rounded retail price</div></div>:<div className={styles.empty}><ClipboardPaste size={32}/><p>Paste a WhatsApp message to see the product preview here.</p></div>}</aside>
      </section>

      <section className={styles.catalog}><div className={styles.catalogHead}><div><p className={styles.eyebrow}>CATALOG</p><h2>All products</h2></div><div className={styles.catalogActions}><div className={styles.catalogSearch}><Search size={16}/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."/></div><Button variant="outline" onClick={loadProducts}><RefreshCw size={16}/> Refresh</Button></div></div>
        {loading?<p className={styles.muted}>Loading products...</p>:filtered.length===0?<div className={styles.noProducts}>No products found.</div>:<div className={styles.productList}>{filtered.map(p=><article className={styles.productRow} key={p.id}><div className={styles.thumb}>{p.imageUrl?<img src={p.imageUrl} alt={p.name}/>:<ImagePlus size={20}/>}</div><div className={styles.productDetails}><div className={styles.productTop}><h3>{p.name}</h3><span className={Number(p.stock)>0?styles.statusActive:styles.statusOut}>{Number(p.stock)>0?"IN STOCK":"OUT OF STOCK"}</span></div><p>{p.category} · SKU {p.sku||"—"} · Cost ₹{Number(p.costPrice||0).toLocaleString("en-IN")} · Margin {Number(p.marginPercent||0)}%</p><strong>₹{Number(p.price||0).toLocaleString("en-IN")}</strong></div><div className={styles.rowActions}><Button variant="outline" size="sm" onClick={()=>toggleStock(p)} disabled={saving}>{Number(p.stock)>0?"Mark out of stock":"Mark in stock"}</Button><Button variant="outline" size="sm" onClick={()=>startEdit(p)}><Pencil size={15}/> Edit</Button><Button variant="ghost" size="icon" onClick={()=>remove(Number(p.id))} aria-label="Delete product"><Trash2 size={17}/></Button></div></article>)}</div>}
      </section>

      {editing&&<div className={styles.modalBackdrop}><section className={styles.modal}><div className={styles.modalHead}><div><p className={styles.eyebrow}>EDIT PRODUCT</p><h2>{editing.name}</h2></div><Button variant="ghost" size="icon" onClick={()=>setEditing(null)}><X/></Button></div><div className={styles.editGrid}>{field("Product name","name")}{field("Category","category")}{field("Selling price","price")}{field("Old price","oldPrice")}{field("Supplier cost","costPrice")}{field("Stock quantity","stock")}{field("Margin %","marginPercent")}{field("SKU","sku")}{field("Tag","tag")}{field("Sizes","sizes")}{field("Fabric","fabric")}{field("Work details","workDetails")}</div><label className={styles.field}><span>Description</span><Textarea value={String(editing.description??"")} onChange={e=>setEditing({...editing,description:e.target.value})}/></label><div className={styles.editImage}><div>{editing.imageUrls?.[0]?<img src={editing.imageUrls[0]} alt={editing.name}/>:<ImagePlus/>}</div><label className={styles.uploadBox}><ImagePlus size={18}/><span>Change up to 4 images</span><input type="file" accept="image/*" multiple onChange={e=>chooseImages(e,v=>setEditing({...editing,imageUrls:v,imageUrl:v[0]??""}))}/></label></div><div className={styles.modalActions}><Button variant="outline" onClick={()=>setEditing(null)}>Cancel</Button><Button onClick={saveEdit} disabled={saving}>{saving?"Saving...":"Save changes"}</Button></div></section></div>}
    </main>
  </div>;
}
export default function AdminProductsPage(){return <AdminRoute><AdminProducts/></AdminRoute>}
