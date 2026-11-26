# Dr Tenshi, and the ancient words of AI 愛

A Limbo-style ninja game in the browser, with a hidden admin panel at `/admin`.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The whole game |
| `admin.html`, `admin.js` | Your admin panel (at `/admin`) |
| `api/` | The small server bits that save your letters, music and photos |
| `blob-client.js`, `defaults.js` | Helpers for the admin panel |
| `package.json`, `vercel.json` | Settings for Vercel. Don't change these. |

## Put it online (about 10 minutes, easiest on a computer)

### 1. Put the files on GitHub
1. Go to github.com and sign in (or create a free account).
2. Click **+** (top right), then **New repository**. Name it `drtenshi`, choose **Private**, and click **Create repository**.
3. On the new page, click **uploading an existing file**.
4. Unzip `drtenshi.zip` and drag **everything inside the `drtenshi` folder** into the page. That includes the `api` folder. Don't drag the folder itself.
5. Click **Commit changes**.

### 2. Deploy on Vercel
1. Go to vercel.com and sign in with GitHub.
2. Click **Add New…**, then **Project**, and **Import** the `drtenshi` repository.
3. Leave every setting as it is (Framework preset: **Other**) and click **Deploy**.
4. When it finishes, your game is at something like `https://drtenshi.vercel.app`.

### 3. Turn on storage (so the admin panel can save)
1. In your Vercel project, open the **Storage** tab.
2. Click **Create Storage** (sometimes labelled **Create Database**), choose **Blob**, then **Continue**.
3. Set access to **Public**.
4. Give it any name.
5. **Tick "Add a read-write token env var to this connection".** This step is essential: the admin panel can't save without it.
6. Click **Create**.
7. Open the **Deployments** tab. On the newest deployment, tap **⋯** and then **Redeploy**.

Missed the tick box? Open the Blob store, go to its **Projects** tab, tap **⋯** next to your project, choose **Update Project Connection**, tick the box, save, then Redeploy.

### 4. Fill in your content
1. Open `https://YOUR-SITE.vercel.app/admin`.
2. Enter the passcode **kayz1234**.
3. Write your letters, add the verses, paste the Spotify link, and upload music for each chapter, the video and your photos.
4. Press **Save changes**. The top of the page should say *storage connected*, and the bar should say *Saved ✓*.

### 5. Test it, then send it
- The **Test it** buttons in the admin panel jump straight to any chapter, letter, the boss, the cake scene or the ending. They only work on your device.
- When you're done testing, open the game and press **Start over** on the title screen to reset it.
- Send her only the main link (`https://YOUR-SITE.vercel.app`). The admin page isn't linked anywhere in the game.

## Good to know
- **Changing the passcode:** in Vercel, open Settings → Environment Variables, add `ADMIN_PASSCODE` with your new code, then Redeploy.
- **Phones:** the game asks her to turn the phone sideways. Her progress saves automatically on her device.
- **Controls on a keyboard:** arrows or A/D to move, Space or W to jump, J or Z to slash, K or X to throw a shuriken, Shift or L to dash, I/V/Q for KI (tap to cast your element, hold to choose one), O to summon the ogre when the button appears, and Esc to pause.
- **Combos:** slash up to 5 times in a row (the last three are Rising Moon, Whirlwind and Heaven Splitter). In the air, slash twice, then a third time (or ↓ + slash) for Falling Star. Slash right after a dash for Iai Flash.
- **Sounds:** in the admin panel's Sounds section you can switch any sound off or upload your own clip for it. Short clips (under 2 seconds) work best. Try them with the Sound board button.
- **Changing content later:** save in the admin panel any time. She sees the changes the next time she opens or refreshes the game.
- **Google Drive video:** set its sharing to *Anyone with the link*, or it won't play for her.
