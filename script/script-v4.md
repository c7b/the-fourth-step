# The Fourth Step: script v4 (2026-11-08)

For the Tari Creator Contest (community.tari.com/t/503): YouTube long-form plus three Shorts. v4 is v3 (`proposal/script-v3.md`) with the changes the owner asked for after the v3 720p preview (`research/direction-v4/owner-notes-v3-preview.md`). This file covers the words: VO, captions, on-screen text suggestions. The picture (Blender 3D, Ocular Sounds effects, layout fixes) belongs to the art agent and the Blender agent. Timecodes are the real ones from the v4 voice (`work/v4/timeline-*.json`).

## What changed (v4)

| Owner note (v3 preview) | Change | Beats |
|---|---|---|
| "is stealth by design", he didn't get "stealth" | B25 now says "hidden by design". "Stealth" is gone from every VO line, caption and on-screen suggestion (it stays only in this file's claims ledger, quoting the docs). | B25, B27A |
| "here is how it runs…", he didn't understand it; explain it for a 7-year-old | B27A is rewritten as 3 short sentences, one idea each, in kid words: (1) apps follow their own rules like on Ethereum, and the money can stay hidden like on Monero; (2) teams of computers check the work, each team keeping its own piece of the records; (3) anyone can see money moved, but not how much or whose. "Here's how it runs", "state", "slices", "committee of validators", "transaction", "template" and "stealth" are gone. VO clip: 18.4 s (v3: 24.7 s). Every claim sits inside T14, T16, T17 and T18. | B27A |
| Too many terms at once in step 4; "cuando explicas minotari," (cut off) | Step 4 now brings in one new term per beat, each with its meaning: B23 XTM ("a coin called XTM"), B24 the Ootle ("Tari's layer for apps"), B25 TARI ("also called TARI", flagged as the same word as the project), B26 view key (unchanged, defined in the line), B27 burn (unchanged, "a one-way door"). Dropped from the VO: Minotari, merge-mining, "four different ways", templates, smart contracts (in step 4), validators, committees, stealth, state, slices. Merge-mining stays as a plain fact: "Monero miners can secure it at the same time, with the same work." | B23, B24, B25, B27A |
| Remove "Monero is what Bitcoin noobs think they bought" (reads as an attack out of context) | B19 is cut from the long-form. The narration goes from B18 "…money with no memory." to B20 "Isn't privacy just for criminals?"; B18's tail grows from 0.6 to 1.0 s to give the banknote a beat. Short 3 is rebuilt on another verified line from the same talk (31:44): "They have no memory of where they've been, which is really what you want in a money." New title: "Money with no memory". The long-form still names Kim once (B06). | B18, B19, S3A, S3B, S3F |
| Evergreen (no dates) | Checked again: no launch date, "goes live", "launches" or "November" anywhere in VO, captions, on-screen text or metadata. The only years are history (2009, 2014, 2015, 2019). | all |
| First ~12 s cut; B30 jumps straight to the end card (picture changes) | No VO line refers to the cut material. "This is you." (B03) points at the cube, which the owner keeps ("la animación al salto del cubo… ahí está perfecto"). "Remember the flag?" (B29) points at B12–B14, which stay. The timeline now opens with **T00**, a 3.0 s title-card slot with no VO, and B03's lead drops from 2.9 to 1.2 s. B31 is cut, and B32 is the end card's final state only (6.0 s). | T00, B03, B31, B32 |
| Writing style | Every new or changed line was checked against the humanizer patterns: no staged openers ("Here's how it runs", "Here's what he meant" are gone), no ad copy, short spoken sentences. | all changed lines |

**Runtime:** long-form **5:44.3** (v3: 6:30.8). Shorts: S1 0:38.9 and S2 0:48.8 (both unchanged and byte-identical to v3), S3 **0:42.8** (v3: 0:41.8).

**Voice:** no time-stretch, as in v3. The 7 new lines are natural George takes (eleven_v4, stability 0.5, similarity 0.75), picked for pace near the 4.10 syl/s reference: b23 4.12, b24 4.03, b25 4.30, b27a 4.19, s3a 4.36, s3b 4.24, s3f 3.98. All are inside the ±7% band. The other 37 lines play their v3 clips byte for byte. End-to-end scribe_v2: 0 errors in all four pieces (long 0/763, S1 0/84, S2 0/115, S3 0/98). Details: `work/v4/vo-pace.md`, `work/v4/vo/takes-report.md`, `work/v4/qa/wer.json`.

**One voice-only respelling (s3a).** The 31:44 quote has many short words, and with the subtitler's comma eleven_v4 read it fast: 4.93–5.30 syl/s in 9 takes across line mode, paragraph mode, seeds and contexts. So the voice gets `voiceText`: the same 17 words with two ellipses and a period ("They have no memory... of where they've been. Which is really... what you want in a money."). That take reads at 4.36 syl/s. Captions and the on-screen quote keep the exact subtitle wording and punctuation, and the word check confirms the voice says exactly those words.

**Beat IDs:** new: **T00** (title-card slot, no VO). Removed: **B01, B02** (cut, replaced by T00), **B19**, **B31**. VO keys: removed `b19`; changed `b23`, `b24`, `b25`, `b27a`, `s3a`, `s3b`, `s3f`.

**Word cues the v3 scenes use that no longer exist** (for whoever ports `prod-v3/acts`): all of B19; B23 `Minotari,` `the coin` `It's mined four different ways,` `one of them is merge-mining` `both at once.`; B24 `programs.` `Apps there are built from templates,` `Tari's word for smart contracts,` `validators` `committees.`; B25 `TARI,` `stealth` `the amount is hidden, the owner is hidden,`; B27A everything (`Here's how it runs.` `state` `slices,` `committee of validators` `wallet` `transaction:` `template,` `stealth` `committees` `shape,` `amounts` `owners.`); S3A `Monero is what Bitcoin noobs think they bought.`; S3B `Here's what he meant.`; S3F `smart contracts,` `templates,` `network` `amounts and owners are hidden.` New cue words: B23 `XTM.` `Miners` `Monero miners` `same work.`; B24 `apps.`; B25 `also called TARI,` `hidden by design:` `no one else`; B27A `Ethereum,` `Monero.` `Teams of computers` `piece of the records.` `money moved,` `how much,` `whose.`; S3A `memory` `money.`; S3B `Monero coins.`; S3F `own rules,` `hidden by design.`

## Resumen en español (corto)

- **"Stealth" → "hidden by design".** La palabra "stealth" ya no aparece en la voz ni en los subtítulos.
- **"Cómo funciona" (B27A), para un niño de 7 años:** son tres frases. Las apps del Ootle siguen sus propias reglas, como en Ethereum, y el dinero que mueven puede quedar oculto, como en Monero. Equipos de computadoras revisan el trabajo, y cada equipo cuida su parte de los registros. Cualquiera puede ver que se movió dinero, pero no cuánto ni de quién. Dura 18 s (antes 25).
- **Menos términos en el paso 4:** un término nuevo por bloque, cada uno con su significado (XTM, Ootle, TARI, view key, quemar). Se quitaron Minotari, merge-mining, templates, validadores, comités, estado, "slices" y stealth.
- **Se quitó la frase de los "noobs".** El Short 3 ahora abre con otra cita de Kim de la misma charla: "No tienen memoria de dónde han estado…". Kim se nombra una sola vez en el video largo.
- **Duración:** el video largo queda en 5:44 (antes 6:31). La voz es la misma, sin estirar: solo se grabaron las 7 líneas nuevas, y el resto suena idéntico a v3.

## Long-form script

Timecodes are the v4 voice timeline. "On screen" means typed text, as in v3; for changed beats it is a suggestion for the art agent, who decides the picture. Beats marked "(unchanged)" have the same VO clip as v3, byte for byte; only their timecodes moved.

### COLD OPEN

#### T00 · 0:00.0–0:03.0 · Title card (NEW slot; replaces v3 B01 + B02)
| | |
|---|---|
| **On screen** | The owner's spec: `THE FOURTH STEP` / `bitcoin · ethereum · monero · tari` / `+`, all centred, all in #c7ea00. |
| **VO** | none |
| **Note** | v3's B01 (the lookup terminal, 8.2 s) and B02 (title, 5.4 s) are cut. The cube jump and its cling sit on the cut into B03. |

#### B03 · 0:03.0–0:15.2 · You (VO unchanged; lead 2.9 → 1.2 s)
| | |
|---|---|
| **VO** | "This is you. Every time you get paid, or pay someone, you leave a trace. This video is about one question: who gets to read it?" |
| **Note** | "This is you." lands on the cube, 1.2 s after B03 starts. |

### ACT 1 · BITCOIN

#### B04 · 0:15.2–0:26.2 · No bank in the middle (unchanged)
| | |
|---|---|
| **On screen** | `01 · BITCOIN · 2009`; lockup `bitcoin` / `money with no bank in the middle` |
| **VO** | "Step one: Bitcoin, 2009. For the first time, two strangers could send money over the internet with no bank in the middle." |

#### B05 · 0:26.2–0:34.6 · The shared notebook (unchanged)
| | |
|---|---|
| **VO** | "Instead of a bank's private records, everyone keeps a copy of one shared notebook: who paid whom, and how much." |

#### B06 · 0:34.6–0:51.3 · Your statement on a public board (unchanged; the one full Kim credit)
| | |
|---|---|
| **On screen** | Statement card. Quote block, label `DR. DANIEL KIM · 36C3 · LEIPZIG · 2019`: `"Everybody in the world can see / who sent what to whom and when."` Tracker `● MONEY ○ PROGRAMMABLE ○ PRIVATE`. **The only time the long-form names Kim.** |
| **VO** | "But that notebook is public. Picture your bank pinning your monthly statement to a board outside, for anyone walking past. Dr. Daniel Kim put it plainly: everybody in the world can see who sent what to whom and when." |

#### B07 · 0:51.3–1:02.6 · What we were told (unchanged)
| | |
|---|---|
| **On screen** | `WHAT WE WERE TOLD · 2011` / `"permanently and anonymously stored"` (WeUseCoins, "What is Bitcoin?"), `anonymously` → `███████ publicly` |
| **VO** | "Early explainers called Bitcoin anonymous. It isn't. Your name isn't on the board, but one payment tied to your name can be enough to unravel the rest." |

#### B08 · 1:02.6–1:16.8 · The gap (unchanged)
| | |
|---|---|
| **VO** | "Bitcoin also kept its built-in programming language small, on purpose: sturdy, but hard to build apps on. So step one gave us money with no bank, and a perfect memory." |

### ACT 2 · ETHEREUM

#### B09 · 1:16.8–1:30.5 · The notebook runs programs (unchanged)
| | |
|---|---|
| **VO** | "Step two: Ethereum, 2015. What if the shared notebook could also run programs? Put money in, the rules run on their own, and no clerk can change them." |

#### B10 · 1:30.5–1:39.1 · Built on top (unchanged)
| | |
|---|---|
| **VO** | "People built exchanges, loans, games and savings apps on top. Ethereum proved money can be programmed." |

#### B11 · 1:39.1–1:50.0 · Still public (unchanged)
| | |
|---|---|
| **VO** | "But those programs run on the same public board. Now it doesn't just show what you paid. It shows which apps you use, and everyone you deal with." |

### THE FLAG

#### B12 · 1:50.0–2:05.3 · The t-shirt shop (unchanged)
| | |
|---|---|
| **VO** | "Here's where it gets personal. Say you sell t-shirts. A customer pays you. You don't know that months ago, their coins passed near a wallet that someone flagged. Software that watches the board connects the dots." |

#### B13 · 2:05.3–2:22.0 · ALERT (unchanged)
| | |
|---|---|
| **On screen** | `ALERT` / `flagged before you did anything`. `RISK REVIEW · AUTOMATED`: `ledger …… one hop from a flagged wallet` / `account …… frozen, pending review`. Quote block, minimal credit **`KIM · 36C3`**: `"it had nothing to do with anything / that the person in question did"` |
| **VO** | "To the software, you're one hop away. That's a guess, not proof. But you find out afterwards: your account is closed, your bank freezes your funds. It had nothing to do with anything that the person in question did." |

#### B14 · 2:22.0–2:41.9 · Passport and birthplace (unchanged)
| | |
|---|---|
| **VO** | "And it's not just payments that get scored. Banks are told to rate every customer for risk, and your passport's country is part of that score. Sometimes even where you were born, which you never chose. When everything is watched, the default flips: you're guilty until you prove you're innocent." |

#### B15 · 2:41.9–2:45.1 · Breath (unchanged)
No VO. About 2 s of real silence.

### ACT 3 · MONERO

#### B16 · 2:45.1–2:58.4 · The other road (unchanged)
| | |
|---|---|
| **On screen** | `03 · MONERO · 2014` |
| **VO** | "Now rewind to 2014, a year before Ethereum. Monero took a different road out of Bitcoin: make the money itself private, for everyone, by default." |

#### B17 · 2:58.4–3:11.0 · The ring (unchanged)
| | |
|---|---|
| **VO** | "When you pay, your payment hides in a crowd of decoys, so nobody can tell which one is you. The amount is hidden. And the person you pay gets a fresh, one-time address." |

#### B18 · 3:11.0–3:20.2 · The banknote (VO unchanged; tail 0.6 → 1.0 s)
| | |
|---|---|
| **On screen** | Banknote outline; `BACK OF THE NOTE · PAST OWNERS` (`owner 1 … owner 7`) types in, then erases. Landing line: `money with no memory.` Suggestion: the tracker `● MONEY ○ PROGRAMMABLE ● PRIVATE` that lived in the cut B19 can land here, on "no memory". |
| **VO** | "Picture a banknote with every past owner listed on the back. Monero wipes the list: money with no memory." |

#### ~~B19 · The line~~ (CUT in v4)
"Or, in one line: Monero is what Bitcoin noobs think they bought." is removed (owner: out of context it reads as an attack). The narration flows from B18's "money with no memory." straight into B20's question.

#### B20 · 3:20.2–3:29.7 · The objection (unchanged)
| | |
|---|---|
| **On screen** | Label `OBJECTION`: `Isn't privacy just for criminals?` (cool grey). Answer in warm cream: `no.` Then the three ring orbs brighten on "shop owner", "nurse", "sending money home". |
| **VO** | "Isn't privacy just for criminals? No. Privacy protects the shop owner, the nurse, the person sending money home." |

#### B21 · 3:29.7–3:40.6 · Two roads (unchanged)
| | |
|---|---|
| **On screen** | `private. not programmable.` |
| **VO** | "But Monero is built for one job: private money, not apps. So now there are two roads: one programmable, one private." |

### ACT 4 · TARI (step 4: one new term per beat)

| Beat | The one new term | Its meaning, in the line |
|---|---|---|
| B22 | Tari | "programs that run on a private network" |
| B23 | XTM | "a coin called XTM" on Tari's base layer |
| B24 | the Ootle | "Tari's layer for apps" |
| B25 | TARI (the coin) | "the Ootle's own coin, also called TARI", hidden by design |
| B26 | view key | "a read-only key you can hand to an accountant" |
| B27 | burn | "burn XTM … and claim the same amount of TARI … A one-way door." |
| B27A | none | teams of computers, pieces of the records: plain words |

#### B22 · 3:40.6–3:49.5 · Where the roads meet (unchanged)
| | |
|---|---|
| **On screen** | `04 · TARI`; `TARI` / `programmable · private · permissionless` |
| **VO** | "Step four is where the roads meet: programs that run on a private network. That's Tari." |

#### B23 · 3:49.5–4:01.7 · Base layer (CHANGED)
| | |
|---|---|
| **v3 VO** | "Tari has two layers. The base layer, Minotari, holds the coin XTM. It's mined four different ways, and one of them is merge-mining with Monero: the same miners can secure both at once." |
| **v4 VO** | "Tari has two layers. The base layer holds a coin called XTM. Miners keep it safe, and Monero miners can secure it at the same time, with the same work." |
| **On screen (suggestion)** | `BASE LAYER · XTM`; lane label `mined alongside monero`. Drop `MINOTARI` and `merge-mined`. |
| **Why** | Note 3: "Minotari", "merge-mining" and "four different ways" were three terms in one breath. The story only needs: a base layer, its coin XTM, and the link to Monero's miners. |

#### B24 · 4:01.7–4:06.4 · The Ootle (CHANGED)
| | |
|---|---|
| **v3 VO** | "On top sits the Ootle, Tari's layer for programs. Apps there are built from templates, Tari's word for smart contracts, and validators check the work in committees." |
| **v4 VO** | "On top sits the Ootle, Tari's layer for apps." |
| **On screen (suggestion)** | `OOTLE · TARI'S LAYER FOR APPS`. Drop `template / a smart contract on Tari, written in Rust` and `COMMITTEE · 40 VALIDATORS`. |
| **Why** | Note 3: templates, smart contracts, validators and committees were four terms in one line. B27A now explains who runs the apps, in kid words. "Apps" is the word the film has used since B10. |

#### B25 · 4:06.4–4:24.6 · Hidden by design (CHANGED)
| | |
|---|---|
| **v3 VO** | "The Ootle's own coin, TARI, is stealth by design: the amount is hidden, the owner is hidden, and every payment lands at a one-time address. The network can still check that nobody made money out of thin air, without seeing the numbers." |
| **v4 VO** | "The Ootle's own coin, also called TARI, is hidden by design: no one else can see the amount or the owner, and every payment lands at a one-time address. The network can still check that nobody made money out of thin air, without seeing the numbers." |
| **On screen (suggestion)** | `TARI · hidden by design` / `amount ███ · owner ███` / `one-time address`. No "stealth". |
| **Why** | Note 1 (his words: "hidden by design" is easier). "Also called TARI" says out loud that the coin shares the project's name. "The amount is hidden, the owner is hidden" became "no one else can see the amount or the owner", to avoid saying "hidden" three times. The one-time address is a callback to Monero (B17), not a new term. |

#### B26 · 4:24.6–4:35.4 · Builders choose; view keys (unchanged)
| | |
|---|---|
| **VO** | "Builders choose how private each asset is. And a view key is a read-only key you can hand to an accountant: they can see, but they can't spend." |

#### B27 · 4:35.4–4:45.9 · The one-way door (unchanged)
| | |
|---|---|
| **On screen** | `burn XTM → claim TARI` / `1 : 1 · one way` |
| **VO** | "To move in, you burn XTM on the base layer and claim the same amount of TARI on the Ootle, minus a small fee. A one-way door." |

#### B27A · 4:45.9–5:05.3 · How it runs, for a 7-year-old (REWRITTEN)
| | |
|---|---|
| **v3 VO** | "Here's how it runs. The Ootle splits its state into slices, and a committee of validators keeps each one. Your wallet sends one transaction: it runs a template, like a smart contract on Ethereum, and can move stealth TARI, private like Monero. The committees holding those slices agree on the result. Anyone can see its shape, but not the amounts or the owners." (24.7 s) |
| **v4 VO** | "An app on the Ootle runs by its own rules, like on Ethereum, and the money it moves can stay hidden, like on Monero. Teams of computers check the work, and each team looks after its own piece of the records. Anyone can see that money moved, but not how much, or whose." (18.4 s) |
| **One idea per sentence** | 1. The combo: Ethereum's rules plus Monero's hiding (owner's v2 note 6: "es el combo de Ethereum/Monero"). 2. Who runs it: small teams of computers, each with its own piece. 3. What still shows: that money moved, not how much or whose. |
| **On screen (suggestion)** | Label `HOW IT RUNS`. Sentence 1: `apps …… their own rules` (Ethereum's blue) / `money …… can stay hidden` (Monero's orange), then the lockup `ethereum's rules + monero's privacy`. Sentence 2: the field splits into pieces, each with its own small team lit over it; label `teams of computers · one piece each`. Sentence 3: a line shows money moved, its labels stay `███`: `anyone sees …… money moved` / `no one sees …… how much · whose`. |
| **Truth** | Every claim sits inside T14, T16, T17 and T18 (ledger below). "Can stay hidden" keeps the builder's choice (B26, B28). "Anyone can see that money moved" is T18's public shape in kid words: Ootle has no ring of decoys, so the movement shows. |

#### B28 · 5:05.3–5:17.1 · Honesty (unchanged)
| | |
|---|---|
| **On screen** | `fee …… 0.0021 visible`; landing line `privacy is a choice. tari builds it in.` |
| **VO** | "It's not magic. Fees are public, and anything a builder makes public stays public. Privacy is a choice, and Tari builds it into the foundations." |

### WHY IT MATTERS

#### B29 · 5:17.1–5:34.2 · The flag, revisited (unchanged)
| | |
|---|---|
| **On screen** | The review panel returns, values flip to `███`; `scanning … nothing to read`; `PERMISSIONLESS · PROGRAMMABLE · PRIVATE` |
| **VO** | "Remember the flag? It worked because a stranger's software could read your history. On a private network, there's no board to read. The network itself doesn't ask for your passport, and no one has to approve you. Your business stays yours." |

#### B30 · 5:34.2–5:38.3 · Step four (unchanged; now goes straight to the end card)
| | |
|---|---|
| **VO** | "Step four starts now." |
| **Note** | The 1.9 s tail (the ring completes on "now", final chord) leads straight into B32. |

#### ~~B31 · The lookup, again~~ (CUT in v4)
No VO was on it, so no line changes.

#### B32 · 5:38.3–5:44.3 · End card (shortened: final state only, 6.0 s)
| | |
|---|---|
| **On screen** | The final state from the v3 preview's 6:26: step chips `01 bitcoin · 02 ethereum · 03 monero · 04 tari`, the Tari logo, `tari.com`, `sources in the description`. The 2 s of black and the four recap lines are out of the slot. |
| **VO** | none |
| **Note** | YouTube end-screen elements need at least 5 s: put them over all of B32. |

## On-screen quotes and credits (v4)

All word-exact (`research/quote-check.md`; `research/transcripts/8quGD9W7B2I.md`, the talk's manual English subtitles).

| Beat | Exact words on screen | Credit on screen | Source position |
|---|---|---|---|
| B06 | "Everybody in the world can see who sent what to whom and when." | DR. DANIEL KIM · 36C3 · LEIPZIG · 2019 (the one full credit) | `8quGD9W7B2I` 28:12–28:15 |
| B07 | "permanently and anonymously stored" | WeUseCoins, "What is Bitcoin?" (2011) | `Um63OQz3bjo` 0:55 |
| B13 | "it had nothing to do with anything that the person in question did" | KIM · 36C3 | 35:31 |
| S1D | "Everybody in the world can see who sent what to whom and when." | DR. DANIEL KIM · 36C3 · 2019 | 28:12 |
| S2D | "That kind of gets told to you at birth as an accident of where you were born." | DR. DANIEL KIM · 36C3 · 2019 | 45:11–45:13 |
| S3A/S3B | "They have no memory of where they've been, which is really what you want in a money." | DR. DANIEL KIM · 36C3 · LEIPZIG · 2019 | 31:44–31:48 |

Cut in v4: "Monero is what Bitcoin noobs think they bought." (52:07), from both B19 and Short 3. Context for 31:44, so the quote is used for what he meant: at 31:38 he says "in Monero, coins are indistinguishable from one another, or they have no memory", and right after it (31:50) he says money with perfect memory, "like it is in Bitcoin", gets used to "falsely associate activities of people who had nothing to do with each other". "They" are Monero coins; S3B says so.

## Shorts (9:16)

Same rules as v3: own hook, own vertical composition, loop ending, safe zones. The picture burns the captions in; SRTs are in `work/v4/captions/`.

### S1 · "The board" · 0:38.9 (unchanged: same clips, same timing, same captions as v3)
| Beat | Time | On screen | VO |
|---|---|---|---|
| S1A | 0:00.0–0:04.0 | **HOOK:** `IMAGINE` / `Your bank statement, / pinned to a / public board.█` | "Imagine your bank pinned your statement to a public board." |
| S1B | 0:04.0–0:11.3 | `to: pharmacy` / `to: landlord` / `from: employer`, then `Anyone can read it.` `Forever.` | "Your pharmacy. Your rent. Your salary. Anyone walking past can read it. Forever." |
| S1C | 0:11.3–0:19.6 | `BITCOIN · 2009` | "That's Bitcoin. Every payment sits on a public ledger, and one payment tied to your name can unravel the rest." |
| S1D | 0:19.6–0:24.6 | Quote: `"Everybody in the world can see who sent what to whom and when."` · DR. DANIEL KIM · 36C3 · 2019 | "Everybody in the world can see who sent what to whom and when." |
| S1E | 0:24.6–0:31.1 | `MONERO` · `sender ??? · amount ??? · receiver ???` | "Monero fixed that for money: hidden sender, hidden amount, one-time addresses." |
| S1F | 0:31.1–0:38.9 | `TARI · programmable · private` then `OOTLE` | "Tari takes the next step: apps that run on a private network. It's called the Ootle." |

### S2 · "Flagged for where you were born" · 0:48.8 (unchanged)
| Beat | Time | On screen | VO |
|---|---|---|---|
| S2A | 0:00.0–0:04.4 | **HOOK:** red flood, `RISK: HIGH` / `reason: place of birth` | "Your bank flagged you. The reason? Where you were born." |
| S2B | 0:04.4–0:16.9 | `passport …… ███████` / `place of birth …… ███████` | "Banks are told to score every customer for risk. The country on your passport counts. Under US tax rules, even a US birthplace triggers a review you have to clear yourself." |
| S2C | 0:16.9–0:29.8 | `one hop from a flagged wallet` / `account closed` | "On a public blockchain it gets worse. Sell a t-shirt to the wrong customer, and software decides you're one hop from a flagged wallet. Your account gets closed. You find out after." |
| S2D | 0:29.8–0:36.8 | Quote: `"That kind of gets told to you at birth / as an accident of where you were born."` · DR. DANIEL KIM · 36C3 · 2019 | "As Dr. Daniel Kim put it: it gets told to you at birth, as an accident of where you were born." |
| S2E | 0:36.8–0:48.8 | `PERMISSIONLESS · PROGRAMMABLE · PRIVATE` / `TARI · OOTLE` | "Privacy isn't a crime. It's what cash always gave you. Tari is building it into programmable money: permissionless, programmable, private." |

### S3 · "Money with no memory" · 0:42.8 (REBUILT; was "What noobs think they bought")
| Beat | Time | On screen (suggestion) | VO |
|---|---|---|---|
| S3A | 0:00.0–0:06.4 | **HOOK:** quote, big: `"They have no memory / of where they've been,"` then smaller `which is really what you want in a money."` | **NEW:** "They have no memory of where they've been, which is really what you want in a money." |
| S3B | 0:06.4–0:11.9 | `DR. DANIEL KIM · 36C3 · LEIPZIG · 2019`; then `they = monero coins` | **NEW:** "That's Dr. Daniel Kim, in 2019, talking about Monero coins." |
| S3C | 0:11.9–0:19.1 | Banknote: back lists `owner 1 … owner 7` | "Bitcoin is like a banknote with every past owner written on the back. Anyone can trace where it's been." (v3 clip) |
| S3D | 0:19.1–0:30.0 | `RING · ONE OF THESE IS YOU` / `amount ???`; lands on `money with no memory.` | "Monero wipes the list. Your payment hides among decoys, the amount is hidden, and the receiver gets a one-time address. Money with no memory." (v3 clip; its last line now answers the hook) |
| S3E | 0:30.0–0:34.6 | `private. not programmable.` | "The catch: Monero is built for money, not apps." (v3 clip) |
| S3F | 0:34.6–0:42.8 | `TARI'S OOTLE` / `apps …… their own rules` / `money …… hidden by design` | **NEW:** "Tari's Ootle goes for both: apps that run by their own rules, and money that's hidden by design." |

v3 S3 lines replaced: S3A "Monero is what Bitcoin noobs think they bought."; S3B "That's Dr. Daniel Kim, in 2019. Here's what he meant."; S3F "Tari's Ootle goes for both: smart contracts, which Tari calls templates, on a network where amounts and owners are hidden." The loop: S3F ends on money hidden by design, and the hook comes back with coins that have no memory. Kim is named once (S3B VO plus the credit).

## Claims ledger (v4)

v2's ledger (`proposal/script.md` §7) still holds for T1–T11 and T13; T12 (a launch date) is claimed nowhere. v3's T14–T18 (checked on 2026-11-07 against ootle.tari.com, exact text in `proposal/script-v3.md`) back the new B27A. In v4, T1 drops the name "Minotari" and T5 drops the number 40 from the VO, which now says less than before. Nothing new is claimed.

| Line (v4) | Claim | Backed by |
|---|---|---|
| B23 | Two layers; the base layer holds a coin called XTM | T1, T2 |
| B23 | Miners keep it safe; Monero miners can secure it at the same time, with the same work | T3 (`RandomXM`: "merged mined monero RandomX"; README: "merge mine Tari alongside Monero via XMRig") |
| B24 | The Ootle is Tari's layer for apps | T1 ("layer-2 execution layer"), T4 (templates are its smart contracts) |
| B25 | The Ootle's coin, TARI, is hidden by design: amount and owner hidden; one-time addresses | T6 ("Stealth — hides the amount and the owner … one-time addresses … The native token, TARI, is a stealth resource.") |
| B25 | The network checks nobody made money from thin air without seeing numbers | T7 |
| B27A s1 | An app runs by its own rules, like on Ethereum | T16 ("It runs WebAssembly smart contracts — called templates —"), T4 |
| B27A s1 | The money it moves can stay hidden, like on Monero | T16 ("WASM templates can execute stealth transfers"; "The native tTARI / $TARI token is a stealth resource"), T6. "Can" keeps the builder's choice (T8). |
| B27A s2 | Teams of computers check the work; each team looks after its own piece of the records | T14 ("Ootle shards the state space"; "a shard to exactly one group, and a validator to exactly one committee"; "Consensus therefore runs many times in parallel — once per shard group — over disjoint slices of state"), T17 ("only validators in committees holding one of its inputs pass it to consensus"), T5 |
| B27A s3 | Anyone can see that money moved, but not how much, or whose | T18 ("The structure of transactions — which inputs were spent, which outputs were created — is public even when owners and amounts are not.") |
| S3B | "They" are Monero coins | Talk 31:38–31:40: "in Monero, coins are indistinguishable from one another, or they have no memory." |
| S3F | Ootle apps run by their own rules; its money is hidden by design | T4, T6 |

Honesty notes:
- "Like on Monero" is an analogy for hidden amounts and owners plus one-time addresses. The Ootle has no ring of decoys, so the movement itself shows. B27A's last sentence says so, in kid words.
- B28 still covers the rest: fees are plaintext, and anything public stays public.
- "Teams of computers" are validator nodes. Each committee reaches agreement by a quorum (HotStuff), and a cross-shard transaction commits in every involved group or in none (T17). B27A's "check the work" stands for all of that.

## Left out (unchanged from v3)

No prices. No "anonymous" or "untraceable" for Tari. No "first" or "only" claims. No launch date.
