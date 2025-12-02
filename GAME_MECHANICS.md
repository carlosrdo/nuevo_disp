# Game Mechanics Documentation

## Core Gameplay

### Player Character
- **Appearance**: Green square with eyes and mouth
- **Size**: 40x40 pixels
- **Starting Position**: Bottom-center of screen
- **Movement Speed**: 5 pixels per frame
- **Initial Lives**: 3
- **Shoot Cooldown**: 300ms (150ms with Rapid Fire power-up)

### Controls
- **Movement**: D-pad (up, down, left, right)
- **Shooting**: Shoot button (🔫)
- **Pause**: Pause button (⏸/▶)

## Enemies

### Regular Opponents (Triangles)
- **Appearance**: Red triangles with eyes
- **Size**: 35x35 pixels
- **Movement**: Horizontal bouncing
- **Speed**: 2 pixels per frame
- **Shoot Interval**: 2-3 seconds
- **Points**: 1 point when destroyed
- **Behavior**: 
  - Move left and right
  - Bounce off screen edges
  - Aim bullets at player position
  - Spawn chance on opponent death: 50%

### Boss (Pentagon)
- **Appearance**: Purple rounded square with eyes and mouth
- **Size**: 50x50 pixels
- **Movement**: Horizontal bouncing (faster)
- **Speed**: 4 pixels per frame (2x opponent speed)
- **Shoot Interval**: 1.5 seconds
- **Points**: 1 point when destroyed
- **Spawning**: Appears after first opponent is killed
- **Behavior**:
  - Faster movement than regular opponents
  - More frequent shooting
  - Aims bullets at player
  - Higher chance to drop power-ups (70%)

## Bullets

### Player Bullets
- **Appearance**: Green circles
- **Size**: 8x8 pixels
- **Speed**: 7 pixels per frame (upward)
- **Damage**: Instant kill on hit
- **Color**: #4ecca3 (green)

### Enemy Bullets
- **Appearance**: Red circles
- **Size**: 8x8 pixels
- **Speed**: 4.9 pixels per frame (aimed at player)
- **Damage**: 1 life
- **Color**: #ff6b6b (red)
- **Behavior**: Track player position when fired

## Power-Ups

### Types and Effects

#### 🟡 Shield (Yellow)
- **Color**: #FFD700 (gold)
- **Duration**: 5 seconds
- **Effect**: Complete invincibility
- **Visual**: Golden border around player
- **Drop Chance**: ~30% from opponents, ~70% from boss

#### 🔴 Rapid Fire (Red)
- **Color**: #FF6B6B (red)
- **Duration**: 5 seconds
- **Effect**: 50% faster shooting (150ms cooldown)
- **Visual**: No visual indicator (could be added)
- **Drop Chance**: ~30% from opponents, ~70% from boss

#### 🟢 Health (Green)
- **Color**: #4ECCA3 (green)
- **Effect**: Instant +1 life
- **Duration**: Permanent
- **Visual**: Lives counter updates immediately
- **Drop Chance**: ~30% from opponents, ~70% from boss

### Power-Up Behavior
- **Size**: 20x20 pixels (circle)
- **Fall Speed**: 2 pixels per frame
- **Collection**: Automatic on touch with player
- **Appearance**: Colored circles with white border
- **Selection**: Random when spawned

## Game States

### Start Screen
- **Displays**: Game title and instructions
- **Button**: "START GAME"
- **Info Shown**:
  - Controls explanation
  - Objective
  - Power-up descriptions

### Playing
- **Active Elements**:
  - Player movement and shooting
  - Enemy spawning and AI
  - Collision detection
  - Score tracking
  - Lives tracking
- **UI Elements**:
  - Score display (red)
  - High score display (gold)
  - Lives display (green)
  - Pause button

### Paused
- **Effects**:
  - Game loop continues rendering
  - No game logic updates
  - Shows pause button as "▶"
- **Actions**: Click pause to resume

### Game Over (Loss)
- **Trigger**: Lives reach 0
- **Display**: "💀 GAME OVER 💀"
- **Shows**: Final score and high score
- **Action**: "PLAY AGAIN" button to restart

### Victory
- **Trigger**: Boss defeated
- **Display**: "🎉 YOU WIN! 🎉"
- **Shows**: Final score and high score
- **Action**: "PLAY AGAIN" button to restart

## Scoring System

### Points
- **Opponent Kill**: +1 point
- **Boss Kill**: +1 point
- **No point deductions**: Lives lost don't affect score

### High Score
- **Storage**: AsyncStorage (persistent across sessions)
- **Update**: Automatically when current score exceeds previous high
- **Display**: Always visible in top bar (gold color)

## Collision Detection

### Collision Boxes
All entities use rectangular bounding boxes for collision:
- **Size**: Based on entity size
- **Center Point**: (x, y) coordinates
- **Calculation**: AABB (Axis-Aligned Bounding Box)

### Collision Checks (per frame)
1. **Player Bullets vs Opponents**: Destroy opponent, remove bullet, +1 score
2. **Player Bullets vs Boss**: Destroy boss, remove bullet, +1 score
3. **Enemy Bullets vs Player**: If no shield, lose 1 life, remove bullet
4. **Power-ups vs Player**: Collect power-up, apply effect, remove power-up

### Collision Response
- **Bullet Removed**: Immediately on any hit
- **Enemy Destroyed**: Becomes star for 2 seconds, then removed
- **Player Hit**: 
  - If lives > 0: Temporary death for 2 seconds, respawn at bottom-center
  - If lives = 0: Game over
- **Power-up Collected**: Immediate effect application

## Death and Respawn

### Player Death
- **Visual**: Opacity reduced to 30%
- **Duration**: 2 seconds (DEATH_DURATION constant)
- **Invulnerability**: Cannot be hit while dead
- **Respawn Location**: Center-bottom of screen (GAME_WIDTH/2, GAME_HEIGHT - 50)
- **Permanent Death**: When lives = 0, no respawn

### Enemy Death
- **Visual**: Converts to gold star emoji (⭐)
- **Duration**: 2 seconds before complete removal
- **Effect**: Cannot shoot or move while dead
- **Score**: Points awarded immediately on hit

## Victory Condition

**Primary Goal**: Defeat the boss
- Boss must be spawned (requires killing first opponent)
- Boss must be destroyed
- Player must still be alive (lives > 0)
- Victory screen displays automatically

## Performance Notes

### Update Cycle
- **Frame Rate**: ~60 FPS (requestAnimationFrame)
- **Update Order**:
  1. Player movement
  2. Opponent updates
  3. Boss updates
  4. Bullet updates
  5. Power-up updates
  6. Collision detection
  7. Dead entity cleanup

### Optimization Techniques
- Off-screen entities removed immediately
- Dead entities cleaned up after 2 seconds
- Minimal state updates (refs used for non-visual state)
- Efficient array filtering for collision detection

## Constants Reference

```javascript
GAME_WIDTH: 800px (or 95% of screen width)
GAME_HEIGHT: 600px (or 70% of screen height)
PLAYER_SIZE: 40px
OPPONENT_SIZE: 35px
BOSS_SIZE: 50px
BULLET_SIZE: 8px
POWERUP_SIZE: 20px
PLAYER_SPEED: 5px/frame
OPPONENT_SPEED: 2px/frame
BOSS_SPEED: 4px/frame
BULLET_SPEED: 7px/frame
SHOOT_COOLDOWN: 300ms (150ms with rapid fire)
DEATH_DURATION: 2000ms
STAR_DISPLAY_DURATION: 2000ms
POWERUP_DURATION: 5000ms (shield, rapid fire)
```

## Tips for Players

1. **Movement**: Stay mobile to avoid enemy bullets
2. **Positioning**: Center-bottom provides best reaction time
3. **Power-ups**: Prioritize collecting health and shield
4. **Boss Strategy**: Circle the boss while shooting
5. **Timing**: Wait for cooldown before rapid button mashing
6. **Defense**: Shield power-up is best for boss fights

## Known Behaviors

### Intentional Design Choices
- Enemies can overlap (allows for strategic positioning)
- Bullets pass through each other (cleaner gameplay)
- Power-ups fall slowly (gives time to collect)
- Boss spawns after ANY opponent death (not just first in sequence)
- Multiple opponents can spawn (creates dynamic difficulty)
- Star effect duration matches death invulnerability (visual consistency)

### Edge Cases
- If player is dead when power-up is collected, effect still applies
- Rapid opponent spawning can create clusters
- Boss can be at edge of screen when spawned
- Power-ups can spawn off-screen if enemy dies at edge (fixed by boundaries)
