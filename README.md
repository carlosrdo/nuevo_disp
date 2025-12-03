# Shooting Game - React Native + Expo

A fun, action-packed shooting game built with React Native and Expo. Defeat enemies, battle bosses, collect power-ups, and achieve high scores!

## Features

✨ **Core Gameplay**
- Control a player character and shoot enemies
- Battle against regular opponents and powerful bosses
- Progressive difficulty with enemy spawning
- Lives system with temporary invincibility on hit
- Victory condition: defeat all bosses

🎮 **Enhanced Features**
- **Power-ups System**:
  - 🛡️ Shield: Temporary invincibility
  - ⚡ Rapid Fire: Faster shooting
  - ❤️ Health: Extra life
- **High Score Tracking**: Persistent high score using AsyncStorage
- **Pause/Resume**: Take a break anytime
- **Touch Controls**: Mobile-friendly D-pad and shoot button
- **Responsive Design**: Adapts to different screen sizes
- **Visual Feedback**: Stars appear when enemies are defeated

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo Go app on your mobile device (optional, for testing)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/carlosrdo/nuevo_disp.git
   cd nuevo_disp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go app (Android/iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator (macOS only)
   - Or press `w` to run in web browser

## How to Play

### Controls
- **Touch Controls**: Use the on-screen D-pad to move and the shoot button to fire
- **Keyboard** (web): Arrow keys or WASD to move, tap screen or press button to shoot

### Objective
1. Destroy enemy triangles (red)
2. After killing your first enemy, a boss pentagon (purple) will spawn
3. Defeat the boss to win!
4. Collect power-ups for advantages
5. Survive with your 3 lives

### Power-ups
- **Yellow circle** 🟡 - Shield (5 seconds of invincibility)
- **Red circle** 🔴 - Rapid Fire (5 seconds of faster shooting)
- **Green circle** 🟢 - Health (gain an extra life)

## Project Structure

```
nuevo_disp/
├── App.js                 # Main game component
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── assets/               # Game assets (images, icons)
└── backup/               # Backup of original HTML/JS version
```

## Technologies Used

- **React Native**: Cross-platform mobile development
- **Expo**: Development framework and tools
- **AsyncStorage**: Persistent data storage for high scores
- **React Hooks**: Modern state management

## Game Mechanics

### Enemy Behavior
- **Opponents (Triangles)**: Move horizontally, bounce off walls, shoot at player
- **Bosses (Pentagons)**: Faster movement, more frequent shooting

### Collision Detection
- Bullet-enemy collisions
- Enemy bullet-player collisions
- Power-up-player collisions
- Precise hitbox calculations

### Improvements from Original
1. Converted from vanilla HTML/CSS/JS to React Native + Expo
2. Added power-up system for enhanced gameplay
3. Implemented persistent high score tracking
4. Added pause/resume functionality
5. Improved touch controls for mobile
6. Better visual feedback with star animations
7. Responsive design for various screen sizes
8. Cleaner code structure with React best practices

## Development

### Running in Development Mode
```bash
npm start
```

### Building for Production
```bash
# Android
npm run android

# iOS (macOS only)
npm run ios

# Web
npm run web
```

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Original game concept implemented in HTML/CSS/JavaScript
- Converted and enhanced for React Native + Expo
- Built as part of a learning project

---

**Enjoy the game! 🎮✨**