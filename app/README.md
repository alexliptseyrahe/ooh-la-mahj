# Ooh La Mahj — iOS app

Everything here is ready to build. On a Mac with Xcode installed, this becomes a
real App Store app in about half an hour of mostly-waiting.

The game itself is `www/index.html` — the same single file that runs on the web,
bundled inside the app so solo play works with no internet at all.

---

## Build it

```bash
cd ooh-la-mahj-ios
npm install                 # pulls Capacitor + plugins
npm run fonts               # downloads the two fonts so the app works offline
npx cap add ios             # creates the native iOS project
npx @capacitor/assets generate --iconBackgroundColor '#0C3B2E' --splashBackgroundColor '#0C3B2E' --ios
npx cap sync
npx cap open ios            # opens Xcode
```

Then in Xcode:

1. Select the **App** target → **Signing & Capabilities** → check *Automatically
   manage signing* and pick your Apple Developer team.
2. **General** → confirm Display Name is `Ooh La Mahj`, Bundle Identifier is
   `com.oohlamahj.app`.
3. Plug in an iPhone, pick it as the run destination, press ▶.

## One required edit: camera permission text

Apple rejects apps that ask for the camera without explaining why. In Xcode open
`ios/App/App/Info.plist`, right-click → *Add Row*, and add these two entries
(or paste the XML below into the file before `</dict>`):

```xml
<key>NSCameraUsageDescription</key>
<string>Ooh La Mahj uses the camera so you can photograph your mah jongg card and play with your own hands.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Ooh La Mahj can read photos of your mah jongg card from your library so you can play with your own hands.</string>
```

## Test before you ship

- **Airplane mode → play a solo game.** Must work start to finish. This is what
  clears Apple's "it's just a website" rejection (guideline 4.2).
- **Photograph your card** — camera prompt appears, reading happens in the
  background, card arrives.
- **Friend table**, then switch to Messages mid-game and come back — a bot
  covers your seat and you reclaim it on return.
- **Sound and haptics** — tiles click, the phone taps back.

## TestFlight

Xcode → **Product → Archive** → **Distribute App** → **App Store Connect** →
Upload. Then at appstoreconnect.apple.com → your app → **TestFlight** → add the
foursome as internal testers. They get an email, install Apple's TestFlight app,
and play. New builds need no review for internal testers.

## App Store submission

In App Store Connect fill in:

- **Screenshots** — 6.7" and 6.5" iPhone. Take them in the iOS Simulator:
  title screen, mid-game, the card sheet, a friend-table lobby.
- **Privacy policy URL** — `https://oohlamahj.com/privacy.html`
- **Support URL** — `https://oohlamahj.com/support.html`
- **App Privacy** — "Data not collected" everywhere except *User Content →
  Gameplay Content, not linked to identity* (the multiplayer relay).
- **Age rating** — 4+.
- **Review notes** — "A complete game of American mah jongg that works fully
  offline against computer opponents. Multiplayer is private friend tables
  joined by invite code. The card-photo feature transcribes the player's own
  purchased scoring card for their personal use; no card content ships with the
  app."
- **Price** — Free, no in-app purchases at launch.

## What updates how

- **Game changes** (rules, design, features) — edit `www/index.html`, then
  `npx cap sync`, re-archive, ship a new build. The web version updates
  independently by uploading the same file to GitHub.
- **Server changes** — deploy to Render as usual; the app picks them up with no
  App Store review, because the server lives at `api.oohlamahj.com`.

## Notes

- `capacitor.config.json` sets the app's background to the deep green so there's
  never a white flash on launch.
- Haptics are wired already: the game calls `Capacitor.Plugins.Haptics` when it
  exists and falls back to web vibration otherwise. Nothing to configure.
- Invite links always point at `https://oohlamahj.com/` so a shared link opens
  properly for people who don't have the app.
- Android is nearly free later: `npx cap add android` and the same www folder.
