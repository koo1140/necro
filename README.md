# Necromancer CLI (necro)

Multi-provider AI agent with parallel consensus ("necro talk") and live streaming CLI.

```
              ╔═══════════════════════════╗
              ║     NECROMANCER CLI       ║
              ║         necro             ║
              ╚═══════════════════════════╝
```

## Install

```bash
npm install github:koo1140/necro --legacy-peer-deps
```

Or from local build:

```bash
git clone https://github.com/koo1140/necro.git
cd necro
npm install
npm run build
npm link
```

## Usage

```bash
necro                 # Launch interactive CLI
necro --help          # Show help
necro --version       # Show version
necro --upgrade       # Upgrade (coming soon)
```

### Interactive Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/model <model>` | Switch AI model |
| `/mode <chat\|agent\|necro>` | Switch operation mode |
| `/thinking <show\|hide>` | Toggle thinking visibility |
| `/title <title>` | Set session title |
| `/settings` | Open settings page |
| `/sessions` | Browse saved sessions |
| `/clear` | Clear conversation |
| `/exit` | Exit necro |

### Modes

- **Chat** — Simple conversation, no tools (web search only)
- **Agent** — Full agent with tool access
- **Necro** — Dual-model parallel consensus with "necro talk" debate

### Features

- Streams responses live (supports thinking show/hide)
- Multiline input with paste detection (`[+ pasted N lines]`)
- Image paste support (sent when compatible model selected)
- Command autocomplete with arrow key navigation
- Session auto-save with searchable history
- ESC twice to stop
- Settings page for API keys (OpenRouter, Groq, Mistral, opencode)
- All providers are BYOK (bring your own key)

### Configuration

Settings are stored in `~/.necro/settings.json`. Sessions are stored in `~/.necro/sessions/`.

## License

MIT
