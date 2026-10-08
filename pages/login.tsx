import { Link } from "react-router-dom";
import { OAuthLoginButton } from "../components/OAuthLoginButton";
import { ArrowLeft, CheckCircle2, LogOut, PackagePlus, Sparkles } from "lucide-react";
import { Button } from "../components/Button";
import { useAuth } from "../helpers/useAuth";
import styles from "./login.module.css";

export default function Login() {
  const { authState, logout } = useAuth();

  if (authState.type === "loading") {
    return <main className={styles.page}><section className={styles.card}><div className={styles.brandMark}><Sparkles/></div><p className={styles.eyebrow}>CHECKING YOUR ACCOUNT</p><h1>One sec...</h1><p>We’re checking your Traditional Trends session.</p></section></main>;
  }

  if (authState.type === "authenticated") {
    const isAdmin = authState.user.role === "admin";
    return <main className={styles.page}>
      <Link to="/" className={styles.back}><ArrowLeft size={16}/> Back to shop</Link>
      <section className={styles.card}>
      <div className={styles.brandLogo}><img src="/_cdn/static/597f09d3-ff67-4eac-98d8-4abad487725a-IMG_6259.jpeg" alt="Traditional Trends official logo"/></div>
        <p className={styles.eyebrow}>YOU’RE SIGNED IN</p>
        <h1>Welcome back,<br/><em>{authState.user.displayName}</em></h1>
        <p>{authState.user.email}</p>
        <div className={styles.accountActions}>
          {isAdmin && <Button asChild size="lg"><Link to="/admin-products"><PackagePlus size={18}/> Add products</Link></Button>}
          <Button variant="outline" size="lg" onClick={() => logout()}><LogOut size={18}/> Log out</Button>
        </div>
        <small>{isAdmin ? "Admin access is enabled for this account." : "Your wishlist, bag and account are ready to use."}</small>
      </section>
    </main>;
  }

  return <main className={styles.page}>
    <Link to="/" className={styles.back}><ArrowLeft size={16}/> Back to shop</Link>
    <section className={styles.card}>
      <div className={styles.brandLogo}><img src="/_cdn/static/597f09d3-ff67-4eac-98d8-4abad487725a-IMG_6259.jpeg" alt="Traditional Trends official logo"/></div>
      <p className={styles.eyebrow}>WELCOME TO THE VIBE</p>
      <h1>Come for the craft.<br/><em>Stay for the fits.</em></h1>
      <p>Sign in to save your wishlist, keep your bag synced and check out faster.</p>
      <OAuthLoginButton provider="floot">Continue with Google</OAuthLoginButton>
      <small>By continuing, you agree to our terms and privacy policy.</small>
    </section>
  </main>;
}