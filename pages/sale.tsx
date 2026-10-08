import { Link } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { Button } from "../components/Button";
import styles from "./sale.module.css";

const sale = [
  { name:"Mogra Silk Co-ord", price:1899, old:2499, image:"https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80" },
  { name:"Gulabi Chanderi Set", price:2199, old:2999, image:"https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80" },
  { name:"Kutch Mirrorwork Top", price:999, old:1399, image:"https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80" }
];
export default function Sale() {
  return <div className={styles.page}><header><Link to="/" className={styles.logo}>traditional<span>trends</span></Link><Link to="/" className={styles.back}><ArrowLeft size={17}/> Back to shop</Link></header><main><p className={styles.eyebrow}>THE SALE EDIT</p><h1>Good taste.<br/><em>Better prices.</em></h1><p className={styles.intro}>Up to 50% off on our most-loved Indian-inspired styles. No compromise on the vibe.</p><div className={styles.grid}>{sale.map(p=><article key={p.name}><div className={styles.image}><img src={p.image} alt={p.name}/><button><Heart size={18}/></button></div><p>SALE</p><h2>{p.name}</h2><strong>₹{p.price.toLocaleString("en-IN")}</strong> <del>₹{p.old.toLocaleString("en-IN")}</del><Button className={styles.add}>Add to bag <ShoppingBag size={16}/></Button></article>)}</div></main></div>
}