# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based "Whack-a-Mole" (もぐらたたき) game with retro pixel art aesthetics inspired by Game Boy style graphics. The game is implemented as a single-page application using vanilla HTML, CSS, and JavaScript with no build tools or dependencies.

## Running the Game

Open `index.html` directly in a browser - no server required.

## Architecture

**Game State Management** (`script.js`)
- `gameState` object holds all mutable state (score, level, timeLeft, timers)
- `levels` array defines difficulty progression with spawn intervals and display times

**Sound System** (`script.js`)
- `SoundManager` class uses Web Audio API to generate sound effects programmatically
- No external audio files needed

**Visual Design** (`style.css`)
- Pixel art mole rendered entirely with CSS `box-shadow` (no image assets)
- Uses "Press Start 2P" font for retro appearance
- Game Boy color palette (#9bbc0f, #8bac0f, #306230, #0f380f)

## Key Implementation Details

- 3x3 grid of holes, each containing a mole element
- Mole appearance controlled by `.up` class, hit state by `.hit` class
- Level progression: score thresholds trigger faster mole spawn/display times
- All animations use CSS `steps()` for pixelated movement effect
## 条件
- HTMLCSS Javascriptのみの制作です
- 答えは日本語で
- コードは最低限でお願いします

