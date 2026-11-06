# Stage demo: 1 minute 30 seconds

## Addresses (replace <site> with the production address, e.g. voxis-eight.vercel.app)
| What | Address |
|---|---|
| Candidate page (QR points here) | `https://<site>/v/demo` |
| HR one-tap login (private, bookmark it, never put it on screen). Opens the stage screen | `https://<site>/hr/demo?k=<KEY>` |
| Stage screen: candidate phone + live HR list side by side | `https://<site>/hr/sehne` (after login) |
| Big QR for the projector | HR job page -> "Tam ekran QR" |
| Is everything configured? | `https://<site>/api/health` -> must say `"ok": true` |

`<KEY>` = HMAC-SHA256 of the text `fixed-key:demo-login`, keyed with the HR_SESSION_SECRET value, in hex. Change
HR_SESSION_SECRET in Vercel and every old link stops working.

## 10 minutes before you go on
1. Open `/api/health` on the production address. Anything other than `"ok": true` means a setting is missing: fix it now.
2. Laptop: open the HR one-tap link. You land on the stage screen: the phone on the left, the live "Kassir" list on the right.
   Press "Sıfırla" (top right) to remove rehearsal applications. Open "Tam ekran QR" in a second tab for the projector.
3. Phone: use mobile data, not venue Wi-Fi. Open `/v/demo`, allow the microphone once, and answer the two questions.
   (Rehearsal applications stay in the list until you press "Sıfırla" on the stage screen.)
4. Keep a screen recording of one good run on the phone as a last resort.

## The 90 seconds
| Time | Say / show |
|---|---|
| 0:00-0:15 | The problem: high-volume jobs in Azerbaijan, hundreds of applicants, nobody writes a CV. |
| 0:15-0:30 | HR side. The job page shows HR's priorities (5 = critical). "HR decides what matters; we never decide for them." |
| 0:30-0:55 | Answer by voice in Azerbaijani on the phone on the left of the stage screen (or scan the big QR with a real phone): two questions, about 8 seconds each. Name and phone, send. |
| 0:55-1:15 | Look right: within about 2 seconds the new candidate (blue dot, flashes once) takes its place in the list. Click it: score, each criterion with its priority, and the candidate's own words as proof. |
| 1:15-1:30 | "AI only turns speech into facts. Plain code scores them. A human clicks invite or reject." Click "Müsahibəyə dəvət et". |

## If something goes wrong
- **Microphone refused or no sound:** tap "Yazılı cavab verin" and type the answers. Same pipeline, nothing else changes.
- **"Cavablarınızı emal edə bilmədik":** Gemini is busy (the free tier throttles). Tap "Yenidən cəhd et"; it retries on other models.
- **Venue network down:** play the screen recording.
- **HR link does not log you in:** the secret in Vercel differs from the one the link was made with. Log in with the normal
  form at `/hr/giris` instead.

## Two ways to show it
- **One screen (default):** the stage screen. Left = candidate on a phone frame, right = HR list. Nobody switches anything.
- **Real phone:** scan the big QR with a phone while the stage screen stays up; the new candidate still appears on the right.
  Use this if you want the jury to see a real device. Needs the venue's mobile data.
