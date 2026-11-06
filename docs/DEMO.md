# Stage demo: 1 minute 30 seconds

## Addresses (replace <site> with the production address, e.g. voxis-eight.vercel.app)
| What | Address |
|---|---|
| Candidate page (QR points here) | `https://<site>/v/demo` |
| HR one-tap login (private, bookmark it, never put it on screen) | `https://<site>/hr/demo?k=<KEY>` |
| Big QR for the projector | HR job page -> "Tam ekran QR" |
| Is everything configured? | `https://<site>/api/health` -> must say `"ok": true` |

`<KEY>` = HMAC-SHA256 of the text `fixed-key:demo-login`, keyed with the HR_SESSION_SECRET value, in hex. Change
HR_SESSION_SECRET in Vercel and every old link stops working.

## 10 minutes before you go on
1. Open `/api/health` on the production address. Anything other than `"ok": true` means a setting is missing: fix it now.
2. Laptop: open the HR one-tap link (you land on the "Kassir" ranked list). Open "Tam ekran QR" in a second tab.
3. Phone: use mobile data, not venue Wi-Fi. Open `/v/demo`, allow the microphone once, and answer the two questions.
   (Your rehearsal application stays in the list: remove it afterwards in Supabase with
   `delete from applications where candidate_name = 'TEST';` if you named yourself TEST.)
4. Keep a screen recording of one good run on the phone as a last resort.

## The 90 seconds
| Time | Say / show |
|---|---|
| 0:00-0:15 | The problem: high-volume jobs in Azerbaijan, hundreds of applicants, nobody writes a CV. |
| 0:15-0:30 | HR side. The job page shows HR's priorities (5 = critical). "HR decides what matters; we never decide for them." |
| 0:30-0:55 | Projector shows the big QR. Scan it and answer by voice in Azerbaijani, two questions, about 8 seconds each. Name and phone, send. |
| 0:55-1:15 | The list refreshes by itself: the new candidate (blue dot) takes its place. Open it: score, each criterion with its priority, and the candidate's own words as proof. |
| 1:15-1:30 | "AI only turns speech into facts. Plain code scores them. A human clicks invite or reject." Click "Müsahibəyə dəvət et". |

## If something goes wrong
- **Microphone refused or no sound:** tap "Yazılı cavab verin" and type the answers. Same pipeline, nothing else changes.
- **"Cavablarınızı emal edə bilmədik":** Gemini is busy (the free tier throttles). Tap "Yenidən cəhd et"; it retries on other models.
- **Venue network down:** play the screen recording.
- **HR link does not log you in:** the secret in Vercel differs from the one the link was made with. Log in with the normal
  form at `/hr/giris` instead.
