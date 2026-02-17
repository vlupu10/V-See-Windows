# V-See Windows - Development Guide

**Author**: Viorel LUPU  
**Date**: 2025-02-17  
**Purpose**: Development setup and workflow guide for the Windows Tauri-based V-See project.

## Prerequisites

### Required Software

1. **Rust Toolchain**
   - Install Rust via [rustup](https://rustup.rs/)
   - Verify: `rustc --version` and `cargo --version`

2. **Node.js and npm**
   - Install Node.js (LTS version recommended)
   - Verify: `node --version` and `npm --version`

3. **Miniconda** (if Python tooling is needed)
   - Miniconda is already installed on this machine
   - Use conda environments for any Python scripts/tooling
   - Verify: `conda --version`

4. **System Dependencies**
   - Windows SDK (usually included with Visual Studio Build Tools)
   - WebView2 runtime (usually pre-installed on Windows 10/11)

## Project Setup

### Initial Tauri Project Creation

```bash
# Navigate to project directory
cd C:\projects\Project-V-See-windows

# Initialize Tauri project (when ready)
npm create tauri-app@latest
# Or use Tauri CLI directly
cargo install tauri-cli
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run tauri dev
   # or
   cargo tauri dev
   ```

2. **Build for Production**
   ```bash
   npm run tauri build
   # or
   cargo tauri build
   ```

### Python Tooling (if needed)

If Python scripts or tooling are added to the project:

1. **Create Conda Environment**
   ```bash
   conda create -n v-see-windows python=3.11
   conda activate v-see-windows
   ```

2. **Install Dependencies**
   ```bash
   # If requirements.txt exists
   pip install -r requirements.txt
   ```

3. **Always use the conda environment**
   - Activate before running Python scripts
   - Keep Python dependencies isolated from system Python
   - Document Python dependencies in `requirements.txt` or `environment.yml`

## Project Structure

```
Project-V-See-windows/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/
│   │   └── services/
│   └── Cargo.toml
├── src/                # Web frontend
│   ├── components/
│   ├── services/
│   └── styles/
├── docs/               # Documentation
├── scripts/            # Build scripts (if any)
└── .cursorrules        # Cursor IDE rules
```

## Code Standards

### Documentation
- Every file: Author, Date, Purpose header
- Every class: Purpose, Usage, Reason for choice
- Every function: Clear explanation of functionality

### Git Workflow
- Work on `develop` branch
- Create feature branches from `develop`
- Never commit directly to `main` (protected by pre-commit hook)

## Building and Distribution

### Development Build
```bash
cargo tauri dev
```

### Production Build
```bash
cargo tauri build
# Output: src-tauri/target/release/v-see-windows.exe
```

### Windows Installer
Tauri can generate Windows installers (.msi) automatically during build.

## Troubleshooting

### Rust Issues
- Update Rust: `rustup update`
- Clean build: `cargo clean && cargo tauri build`

### Node.js Issues
- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Python/Conda Issues
- List environments: `conda env list`
- Activate environment: `conda activate v-see-windows`
- Recreate environment if corrupted: `conda env remove -n v-see-windows` then recreate

## Notes

- Main application is **Rust + Web frontend**, not Python
- Python is only for auxiliary tooling/scripts if needed
- Always use conda environments for Python to keep projects isolated
- Reference Mac version (`Project-V-See`) for feature specifications
