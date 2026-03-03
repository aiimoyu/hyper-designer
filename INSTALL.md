# hyper-designer Installation Guide

An OpenCode plugin that implements specialized agents and workflow management for requirements engineering and system design.

## Installation

### Prerequisites

- Git installed
- Write access to the OpenCode config directory (default: `~/.config/opencode`)
- For macOS / Linux / WSL: symbolic links are recommended
- For Windows: administrator privileges are typically required to create symbolic links; directory junctions can be used as an alternative

### macOS / Linux / WSL

1. Clone or update the repository:

   ```bash
   if [ -d ~/.config/opencode/hyper-designer ]; then
     cd ~/.config/opencode/hyper-designer && git pull
   else
    git clone https://gitcode.com/u011501137/hyper-designer.git ~/.config/opencode/hyper-designer
   fi
   ```

2. Create the plugins directory and create symbolic links:

   ```bash
   mkdir -p ~/.config/opencode/plugins
   mkdir -p ~/.config/opencode/skills

   # Create plugin symbolic link
   ln -s ~/.config/opencode/hyper-designer/opencode/.plugins/hyper-designer.ts ~/.config/opencode/plugins/hyper-designer.ts

   # Create skill symbolic links
   ln -s ~/.config/opencode/hyper-designer/src/skills/hyper-designer ~/.config/opencode/skills/hyper-designer
   ```

   - To force overwrite existing links: use `ln -sf ...` for files and `ln -sfn ...` for directories

3. Restart OpenCode (or reload plugins in OpenCode).

### Windows (CMD / PowerShell)

**Note:** Creating symbolic links on Windows typically requires administrator privileges or Developer Mode enabled. Alternatively, use directory junctions (`mklink /J`) or copy the files into the plugins/skills directories.

**CMD (Administrator):**

```cmd
git clone https://gitcode.com/u011501137/hyper-designer.git "%USERPROFILE%\.config\opencode\hyper-designer"
mkdir "%USERPROFILE%\.config\opencode\plugins"
mkdir "%USERPROFILE%\.config\opencode\skills"

mklink "%USERPROFILE%\.config\opencode\plugins\hyper-designer.ts" "%USERPROFILE%\.config\opencode\hyper-designer\opencode\.plugins\hyper-designer.ts"

mklink /J "%USERPROFILE%\.config\opencode\skills\hyper-designer" "%USERPROFILE%\.config\opencode\hyper-designer\src\skills\hyper-designer"
```

**PowerShell (Administrator):**

```powershell
git clone https://gitcode.com/u011501137/hyper-designer.git "$env:USERPROFILE\.config\opencode\hyper-designer"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\plugins"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\skills"

New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.config\opencode\plugins\hyper-designer.ts" -Target "$env:USERPROFILE\.config\opencode\hyper-designer\opencode\.plugins\hyper-designer.ts"

New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.config\opencode\skills\hyper-designer" -Target "$env:USERPROFILE\.config\opencode\hyper-designer\src\skills\hyper-designer"
```

---

## Usage / Verification

1. Verify the symbolic links (macOS / Linux):

   ```bash
   ls -l ~/.config/opencode/plugins/hyper-designer.ts
   ls -ld ~/.config/opencode/skills/*
   ```

   Should show pointers to the corresponding files and directories in the hyper-designer repository.

2. Windows verification (PowerShell):

   ```powershell
   Get-Item "$env:USERPROFILE\.config\opencode\plugins\hyper-designer.ts"
   Get-ChildItem "$env:USERPROFILE\.config\opencode\skills"
   ```

3. Restart OpenCode; check the plugins/skills panel to confirm `hyper-designer` is loaded, or check the OpenCode console/logs for any plugin loading errors.

4. Refer to the README, QUICK_START.md, or IMPLEMENTATION_SUMMARY.md in the repository for the plugin's exported agents, workflow stages, and configuration options.

---

## Updating

When the repository already exists, pull the latest code and restart OpenCode:

```bash
cd ~/.config/opencode/hyper-designer && git pull
# Restart OpenCode
```

If you used copies instead of symbolic links, you will need to re-copy the files into the plugins/skills directories after updating.

---

## Uninstall

1. Remove the symbolic links / plugin files:
   - macOS / Linux:

     ```bash
     rm ~/.config/opencode/plugins/hyper-designer.ts
     rm -rf ~/.config/opencode/skills/hyper-designer
     ```

   - Windows (Administrator CMD):

     ```cmd
     del "%USERPROFILE%\.config\opencode\plugins\hyper-designer.ts"
     rmdir "%USERPROFILE%\.config\opencode\skills\hyper-designer"
     ```

2. (Optional) Remove the repository:

   ```bash
   rm -rf ~/.config/opencode/hyper-designer
   ```

3. Restart OpenCode.

---

## Troubleshooting

- **Symbolic link creation fails / Permission denied (EACCES)**
  - Check directory permissions: `ls -ld ~/.config/opencode ~/.config/opencode/plugins ~/.config/opencode/skills`
  - Avoid having the config directory owned by root; if files were created with `sudo`, they may not be readable by your user.

- **Cannot create symbolic links on Windows**
  - Run terminal as Administrator, or enable Developer Mode in Settings, or use `mklink /J` to create directory junctions, or copy the files to the plugins/skills directories (not recommended for updates).

- **OpenCode does not load the plugin**
  - Confirm the plugin file extension (`.ts`) is supported by OpenCode.
  - Check for syntax/compilation errors in the plugin and review the OpenCode console logs for error details.

- **Skill directories not recognized**
  - Ensure all skill directories are properly linked and contain the required SKILL.md files.
  - Check that the skills directory structure matches the expected format.

- **Link points to wrong target path**
  - Use absolute paths when creating symbolic links to avoid issues caused by relative paths and differing working directories.

---

## Testing

- After installation, use OpenCode's plugin/skill list to check if `hyper-designer` appears.
- Add a simple `console.log` or logging statement in the plugin code, restart OpenCode, and observe the console output to verify the plugin is being executed.
- Try invoking one of the hyper-designer agents (HArchitect, HCritic, etc.) to verify they are available.

---

## Getting Help

- Repository & Issues: <https://gitcode.com/u011501137/hyper-designer>
- If you encounter issues you cannot resolve, please open an Issue including your platform, OpenCode version, error logs, and the commands you executed.

---

License and contribution guidelines can be found in the LICENSE and CONTRIBUTING files in the repository root.</content>
<parameter name="filePath">INSTALL.md