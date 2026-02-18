# Testing the installation procedure

Use this guide to test the full install flow step by step (build → locate MSI → run installer → launch app).

---

## Step 1: Build the installer

From the **project root** (folder that contains `src-tauri` and `package.json`):

**Option A — Terminal where Rust is on PATH (e.g. you ran Rust setup in this session):**
```powershell
cd c:\projects\project-v-see-windows
npm run build
```

**Option B — Terminal where `cargo` is not found (e.g. Cursor terminal):**
```powershell
cd c:\projects\project-v-see-windows
npm run build:release
```
This sets `PATH` to include `%USERPROFILE%\.cargo\bin` then runs the build, so no need to restart the terminal.

The first build can take **several minutes** (Rust compiles many crates). When it finishes you should see something like:
```text
    Finished release [optimized] target(s)
    Bundling V-See_0.1.0_x64_en-US.msi
```

---

## Step 2: Locate the MSI and exe

After a successful build:

| What        | Location |
|------------|----------|
| **MSI installer** | `src-tauri\target\release\bundle\msi\` — e.g. `V-See_0.1.0_x64_en-US.msi` |
| **Standalone exe** | `src-tauri\target\release\` — e.g. `v-see-windows.exe` (binary name from the Tauri app name) |

To open the MSI folder in Explorer:
```powershell
explorer "c:\projects\project-v-see-windows\src-tauri\target\release\bundle\msi"
```

Confirm the `.msi` file is there and note its full path for the next step.

---

## Step 3: Run the MSI installer

1. Double-click the MSI file (e.g. `V-See_0.1.0_x64_en-US.msi`), or run from PowerShell:
   ```powershell
   Start-Process "c:\projects\project-v-see-windows\src-tauri\target\release\bundle\msi\V-See_0.1.0_x64_en-US.msi"
   ```
2. If Windows shows **“Windows protected your PC”** or SmartScreen:
   - Click **“More info”** → **“Run anyway”** (the app is unsigned; this is expected for local builds).
3. Follow the installer:
   - Accept or change the install location (default is under `Program Files`).
   - Complete the steps and click **Finish**.
4. Optional: leave **“Launch V-See”** checked if the installer offers it, to go straight to Step 4.

---

## Step 4: Launch V-See and verify

1. **Start Menu:** Open the Start Menu and type **V-See** — you should see the app. Click to launch.
2. Or run from PowerShell:
   ```powershell
   & "C:\Program Files\V-See\v-see-windows.exe"
   ```
   (Path may differ if you chose another install location; check **Settings → Apps → V-See → Open file location** to see the actual path.)
3. **Verify:**
   - Main window opens with folder trees (Photos, Music), thumbnails area, and preview.
   - Select a photos folder in the left tree — thumbnails load.
   - Click a thumbnail — preview updates.
   - Double-click a thumbnail — viewer window opens.
   - Optionally select a music folder and play a track.

---

## Step 5: Uninstall (optional)

To remove the installed app and test a clean reinstall later:

1. **Settings → Apps → Installed apps**
2. Find **V-See** → **Uninstall**

Or from PowerShell (admin not required for current user installs):
```powershell
Get-Package -Name "V-See" | Uninstall-Package
```

---

## Troubleshooting

- **Build fails with “cargo not found”**  
  Use `npm run build:release` so Cargo is on PATH, or install Rust from [rustup.rs](https://rustup.rs/) and open a new terminal.

- **MSI not created**  
  Ensure `tauri.conf.json` has `"bundle": { "active": true, "targets": "msi" }`. Run the build again and check for errors at the end of the output.

- **Installer blocked by SmartScreen**  
  Normal for unsigned builds. Use “More info” → “Run anyway” when testing locally.

- **App does not start after install**  
  Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) if missing (usually present on Windows 10/11).
