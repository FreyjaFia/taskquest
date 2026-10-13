import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '../store';
import { StylePicker } from '../style-picker';

@Component({
  selector: 'app-login',
  imports: [StylePicker],
  template: `
    <div class="picker"><app-style-picker /></div>
    <main class="login">
      <section class="hero">
        <div class="logo"><span class="mark" aria-hidden="true">⭐</span> TaskQuest</div>
        <h1>Chores, but make it a quest.</h1>
        <p class="lead">Parents set the missions. Kids tick them off, earn points and cash them in for real rewards.</p>

        <div class="cta">
          <button class="btn primary big" (click)="go(false)">
            <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.3 6.5v5.4h7c4.1-3.8 6.6-9.4 6.6-15.9z"/>
              <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7-5.4c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.2H4.4v5.6C8 41.1 15.4 46 24 46z"/>
              <path fill="#FBBC05" d="M11.6 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.6H4.4C2.9 17.1 2 20.4 2 24s.9 6.9 2.4 9.8l7.2-5.6z"/>
              <path fill="#EA4335" d="M24 10.6c3.3 0 6.2 1.1 8.5 3.3l6.4-6.4C34.9 4.1 29.9 2 24 2 15.4 2 8 6.9 4.4 14.2l7.2 5.6c1.700-5.300 6.600-9.200 12.400-9.200z"/>
            </svg>
            Continue with Google
          </button>
          <button class="btn ghost" (click)="go(true)">Peek as a kid</button>
        </div>
        <p class="fine">This is a design preview. Sign in is simulated and nothing leaves your browser.</p>
      </section>

      <section class="showcase" aria-label="How it works">
        <div class="photo" aria-hidden="true">
          <span class="stk a">🧹</span><span class="stk b">🐶</span><span class="stk c">🏆</span>
          <span class="stk d">📚</span><span class="stk e">🍦</span><span class="stk f">⭐</span>
          <div class="speech">+25 points!</div>
        </div>
        <ol class="steps">
          <li class="step s1"><span class="n" aria-hidden="true">📋</span><div><h3>Parents assign</h3><p>Titles, times and repeats like every Monday.</p></div></li>
          <li class="step s2"><span class="n" aria-hidden="true">🎉</span><div><h3>Kids finish</h3><p>One big tap sends it for approval.</p></div></li>
          <li class="step s3"><span class="n" aria-hidden="true">🎁</span><div><h3>Points become prizes</h3><p>Movie night, ice cream, a new book.</p></div></li>
        </ol>
      </section>
    </main>
  `,
  styles: `
    .picker { position: absolute; top: 16px; right: 16px; z-index: 30; }
    .login { min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(24px, 5vw, 80px); align-items: center; padding: clamp(20px, 5vw, 72px); max-width: 1320px; margin: 0 auto; }
    .hero { display: grid; gap: 22px; justify-items: start; animation: rise .5s cubic-bezier(.16, 1, .3, 1) both; }
    .logo { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .mark { display: grid; place-items: center; width: 44px; height: 44px; border-radius: calc(14px * var(--rs)); background: var(--accent); border: var(--bw) solid var(--edge); animation: bob 3s ease-in-out infinite; }
    h1 { font-size: clamp(2.3rem, 5.2vw, 4rem); max-width: 14ch; }
    .lead { font-size: 1.15rem; color: var(--muted); max-width: 44ch; }
    .cta { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 6px; }
    .big { min-height: 58px; padding: 0 28px; font-size: 1.05rem; }
    .fine { font-size: .85rem; color: var(--muted); max-width: 46ch; }
    .showcase { display: grid; gap: 18px; position: relative; animation: rise .6s .1s cubic-bezier(.16, 1, .3, 1) both; }
    .photo { position: relative; aspect-ratio: 5 / 4; border-radius: calc(36px * var(--rs)); overflow: hidden; border: var(--bw) solid var(--edge); box-shadow: 0 8px 0 var(--hard); background: var(--accent); }
    .stk { position: absolute; display: grid; place-items: center; width: 22%; aspect-ratio: 1; border-radius: 28%; background: var(--surface); border: var(--bw) solid var(--edge); box-shadow: 0 5px 0 var(--hard); font-size: clamp(2rem, 5vw, 3.4rem); animation: bob 4s ease-in-out infinite; }
    .a { left: 8%; top: 12%; transform: rotate(-8deg); } .b { left: 40%; top: 6%; animation-delay: -1s; } .c { right: 8%; top: 16%; animation-delay: -2s; }
    .d { left: 14%; bottom: 12%; animation-delay: -.5s; } .e { left: 42%; bottom: 8%; animation-delay: -1.5s; } .f { right: 10%; bottom: 14%; animation-delay: -2.5s; }
    .speech { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-4deg); padding: 10px 22px; border-radius: var(--pill); background: #17213d; color: #fff; font-family: var(--font-display); font-weight: 600; font-size: clamp(1.1rem, 2.4vw, 1.6rem); white-space: nowrap; }
    .steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
    .step { display: flex; gap: 14px; align-items: center; padding: 14px 18px; border-radius: var(--r); background: var(--surface); border: var(--bw) solid var(--line); }
    .step h3 { font-size: 1.05rem; } .step p { color: var(--muted); font-size: .92rem; }
    .step .n { width: 48px; height: 48px; border-radius: calc(16px * var(--rs)); display: grid; place-items: center; font-size: 1.5rem; flex: none; }
    .s1 .n { background: var(--info-soft); } .s2 .n { background: var(--good-soft); } .s3 .n { background: var(--accent-soft); }
    @media (max-width: 900px) { .login { grid-template-columns: 1fr; padding-top: 28px; } .photo { aspect-ratio: 16 / 10; } }
  `,
})
export class Login {
  constructor(private s: Store, private router: Router) {}
  go(kid: boolean) { this.s.signIn(kid); this.router.navigateByUrl('/'); }
}
