import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_WIDTH = Math.min(800, SCREEN_WIDTH * 0.95);
const GAME_HEIGHT = Math.min(600, SCREEN_HEIGHT * 0.7);

const PLAYER_SIZE = 40;
const OPPONENT_SIZE = 35;
const BOSS_SIZE = 50;
const BULLET_SIZE = 8;
const POWERUP_SIZE = 20;

const PLAYER_SPEED = 5;
const OPPONENT_SPEED = 2;
const BOSS_SPEED = 4;
const BULLET_SPEED = 7;

const COLORS = {
  background: '#16213e',
  player: '#4ecca3',
  opponent: '#e94560',
  boss: '#9b59b6',
  playerBullet: '#4ecca3',
  enemyBullet: '#ff6b6b',
  star: '#ffd700',
  dark: '#16213e',
  ui: '#0f3460',
  shield: '#FFD700',
  rapidFire: '#FF6B6B',
  health: '#4ECCA3',
};

export default function App() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const [player, setPlayer] = useState({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 50,
    isDead: false,
    hasShield: false,
    hasRapidFire: false,
    lastShot: 0,
  });

  const [opponents, setOpponents] = useState([]);
  const [bosses, setBosses] = useState([]);
  const [playerBullets, setPlayerBullets] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [deadEntities, setDeadEntities] = useState([]);

  const firstOpponentKilledRef = useRef(false);
  const keysRef = useRef({ up: false, down: false, left: false, right: false });
  const gameLoopRef = useRef(null);

  useEffect(() => {
    loadHighScore();
    spawnOpponent();
    startGameLoop();

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('highScore');
      if (saved) setHighScore(parseInt(saved, 10));
    } catch (e) {
      console.error(e);
    }
  };

  const saveHighScore = async (newScore) => {
    try {
      if (newScore > highScore) {
        await AsyncStorage.setItem('highScore', newScore.toString());
        setHighScore(newScore);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const spawnOpponent = () => {
    setOpponents((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: Math.random() * (GAME_WIDTH - OPPONENT_SIZE) + OPPONENT_SIZE / 2,
        y: 50 + Math.random() * 100,
        direction: Math.random() > 0.5 ? 1 : -1,
        lastShot: Date.now() + Math.random() * 2000,
      },
    ]);
  };

  const spawnBoss = () => {
    setBosses((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: GAME_WIDTH / 2,
        y: 80,
        direction: 1,
        lastShot: Date.now(),
      },
    ]);
  };

  const spawnPowerUp = (x, y) => {
    const types = ['shield', 'rapidFire', 'health'];
    const type = types[Math.floor(Math.random() * types.length)];
    setPowerUps((prev) => [
      ...prev,
      { id: Date.now(), x, y, type },
    ]);
  };

  const startGameLoop = () => {
    const loop = () => {
      if (!isPaused && !gameOver) {
        updateGame();
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const updateGame = () => {
    // Update player position
    setPlayer((prev) => {
      if (prev.isDead) return prev;

      let newX = prev.x;
      let newY = prev.y;

      if (keysRef.current.up) newY = Math.max(PLAYER_SIZE / 2, prev.y - PLAYER_SPEED);
      if (keysRef.current.down)
        newY = Math.min(GAME_HEIGHT - PLAYER_SIZE / 2, prev.y + PLAYER_SPEED);
      if (keysRef.current.left) newX = Math.max(PLAYER_SIZE / 2, prev.x - PLAYER_SPEED);
      if (keysRef.current.right)
        newX = Math.min(GAME_WIDTH - PLAYER_SIZE / 2, prev.x + PLAYER_SPEED);

      return { ...prev, x: newX, y: newY };
    });

    // Update opponents
    setOpponents((prev) =>
      prev.map((opp) => {
        let newX = opp.x + OPPONENT_SPEED * opp.direction;
        let newDir = opp.direction;

        if (newX <= OPPONENT_SIZE / 2 || newX >= GAME_WIDTH - OPPONENT_SIZE / 2) {
          newDir *= -1;
        }

        newX = Math.max(OPPONENT_SIZE / 2, Math.min(GAME_WIDTH - OPPONENT_SIZE / 2, newX));

        // Shoot at player
        if (Date.now() - opp.lastShot > 2000 + Math.random() * 1000) {
          shootEnemyBullet(opp.x, opp.y);
          return { ...opp, x: newX, direction: newDir, lastShot: Date.now() };
        }

        return { ...opp, x: newX, direction: newDir };
      })
    );

    // Update bosses
    setBosses((prev) =>
      prev.map((boss) => {
        let newX = boss.x + BOSS_SPEED * boss.direction;
        let newDir = boss.direction;

        if (newX <= BOSS_SIZE / 2 || newX >= GAME_WIDTH - BOSS_SIZE / 2) {
          newDir *= -1;
        }

        newX = Math.max(BOSS_SIZE / 2, Math.min(GAME_WIDTH - BOSS_SIZE / 2, newX));

        // Shoot at player
        if (Date.now() - boss.lastShot > 1500) {
          shootEnemyBullet(boss.x, boss.y);
          return { ...boss, x: newX, direction: newDir, lastShot: Date.now() };
        }

        return { ...boss, x: newX, direction: newDir };
      })
    );

    // Update bullets
    setPlayerBullets((prev) =>
      prev
        .map((b) => ({ ...b, y: b.y - BULLET_SPEED }))
        .filter((b) => b.y > 0)
    );

    setEnemyBullets((prev) =>
      prev
        .map((b) => ({
          ...b,
          x: b.x + b.vx,
          y: b.y + b.vy,
        }))
        .filter((b) => b.y < GAME_HEIGHT && b.x > 0 && b.x < GAME_WIDTH && b.y > 0)
    );

    // Update power-ups
    setPowerUps((prev) =>
      prev
        .map((p) => ({ ...p, y: p.y + 2 }))
        .filter((p) => p.y < GAME_HEIGHT)
    );

    // Check collisions
    checkCollisions();

    // Remove dead entities after timeout
    setDeadEntities((prev) =>
      prev.filter((e) => Date.now() - e.deathTime < 2000)
    );
  };

  const shootEnemyBullet = (x, y) => {
    const dx = player.x - x;
    const dy = player.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0 && !player.isDead) {
      setEnemyBullets((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x,
          y: y + OPPONENT_SIZE / 2,
          vx: (dx / dist) * BULLET_SPEED * 0.7,
          vy: (dy / dist) * BULLET_SPEED * 0.7,
        },
      ]);
    }
  };

  const checkCollisions = () => {
    // Player bullets vs enemies
    setPlayerBullets((prevBullets) => {
      let remainingBullets = [...prevBullets];

      setOpponents((prevOpponents) => {
        let remainingOpponents = [...prevOpponents];

        prevBullets.forEach((bullet) => {
          prevOpponents.forEach((opp, oppIndex) => {
            if (
              Math.abs(bullet.x - opp.x) < (BULLET_SIZE + OPPONENT_SIZE) / 2 &&
              Math.abs(bullet.y - opp.y) < (BULLET_SIZE + OPPONENT_SIZE) / 2
            ) {
              // Hit!
              remainingBullets = remainingBullets.filter((b) => b.id !== bullet.id);
              remainingOpponents.splice(oppIndex, 1);
              
              setScore((prev) => {
                const newScore = prev + 1;
                saveHighScore(newScore);
                return newScore;
              });

              setDeadEntities((prev) => [
                ...prev,
                { id: Date.now() + Math.random(), x: opp.x, y: opp.y, deathTime: Date.now() },
              ]);

              if (!firstOpponentKilledRef.current) {
                firstOpponentKilledRef.current = true;
                spawnBoss();
              }

              if (Math.random() < 0.3) {
                spawnPowerUp(opp.x, opp.y);
              }

              if (Math.random() < 0.5) {
                spawnOpponent();
              }
            }
          });
        });

        return remainingOpponents;
      });

      setBosses((prevBosses) => {
        let remainingBosses = [...prevBosses];

        prevBullets.forEach((bullet) => {
          prevBosses.forEach((boss, bossIndex) => {
            if (
              Math.abs(bullet.x - boss.x) < (BULLET_SIZE + BOSS_SIZE) / 2 &&
              Math.abs(bullet.y - boss.y) < (BULLET_SIZE + BOSS_SIZE) / 2
            ) {
              remainingBullets = remainingBullets.filter((b) => b.id !== bullet.id);
              remainingBosses.splice(bossIndex, 1);
              
              setScore((prev) => {
                const newScore = prev + 1;
                saveHighScore(newScore);
                return newScore;
              });

              setDeadEntities((prev) => [
                ...prev,
                { id: Date.now() + Math.random(), x: boss.x, y: boss.y, deathTime: Date.now() },
              ]);

              if (Math.random() < 0.7) {
                spawnPowerUp(boss.x, boss.y);
              }

              // Check victory
              if (firstOpponentKilledRef.current) {
                setVictory(true);
                setGameOver(true);
              }
            }
          });
        });

        return remainingBosses;
      });

      return remainingBullets;
    });

    // Enemy bullets vs player
    if (!player.isDead && !player.hasShield) {
      setEnemyBullets((prevBullets) => {
        let hit = false;
        const remaining = prevBullets.filter((bullet) => {
          if (
            Math.abs(bullet.x - player.x) < (BULLET_SIZE + PLAYER_SIZE) / 2 &&
            Math.abs(bullet.y - player.y) < (BULLET_SIZE + PLAYER_SIZE) / 2
          ) {
            hit = true;
            return false;
          }
          return true;
        });

        if (hit) {
          setLives((prev) => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
              setVictory(false);
            } else {
              setPlayer((p) => ({ ...p, isDead: true }));
              setTimeout(() => {
                setPlayer((p) => ({
                  ...p,
                  isDead: false,
                  x: GAME_WIDTH / 2,
                  y: GAME_HEIGHT - 50,
                }));
              }, 2000);
            }
            return newLives;
          });
        }

        return remaining;
      });
    }

    // Power-ups vs player
    setPowerUps((prevPowerUps) =>
      prevPowerUps.filter((powerUp) => {
        if (
          Math.abs(powerUp.x - player.x) < (POWERUP_SIZE + PLAYER_SIZE) / 2 &&
          Math.abs(powerUp.y - player.y) < (POWERUP_SIZE + PLAYER_SIZE) / 2
        ) {
          activatePowerUp(powerUp.type);
          return false;
        }
        return true;
      })
    );
  };

  const activatePowerUp = (type) => {
    if (type === 'shield') {
      setPlayer((prev) => ({ ...prev, hasShield: true }));
      setTimeout(() => setPlayer((prev) => ({ ...prev, hasShield: false })), 5000);
    } else if (type === 'rapidFire') {
      setPlayer((prev) => ({ ...prev, hasRapidFire: true }));
      setTimeout(() => setPlayer((prev) => ({ ...prev, hasRapidFire: false })), 5000);
    } else if (type === 'health') {
      setLives((prev) => prev + 1);
    }
  };

  const handleShoot = () => {
    const now = Date.now();
    const cooldown = player.hasRapidFire ? 150 : 300;

    if (!player.isDead && now - player.lastShot > cooldown) {
      setPlayerBullets((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: player.x,
          y: player.y - PLAYER_SIZE / 2,
        },
      ]);
      setPlayer((prev) => ({ ...prev, lastShot: now }));
    }
  };

  const handleRestart = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setVictory(false);
    setShowInstructions(false);
    setPlayer({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 50,
      isDead: false,
      hasShield: false,
      hasRapidFire: false,
      lastShot: 0,
    });
    setOpponents([]);
    setBosses([]);
    setPlayerBullets([]);
    setEnemyBullets([]);
    setPowerUps([]);
    setDeadEntities([]);
    firstOpponentKilledRef.current = false;
    spawnOpponent();
  };

  const handleStartGame = () => {
    setShowInstructions(false);
  };

  const handleTouchStart = (direction) => {
    keysRef.current[direction] = true;
  };

  const handleTouchEnd = (direction) => {
    keysRef.current[direction] = false;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <View style={styles.infoItem}>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.highScoreText}>High: {highScore}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.livesText}>Lives: {lives}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsPaused(!isPaused)}
          style={styles.pauseButton}
        >
          <Text style={styles.pauseText}>{isPaused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
      </View>

      {/* Game Canvas */}
      <View style={styles.gameCanvas}>
        {/* Player */}
        <View
          style={[
            styles.player,
            {
              left: player.x - PLAYER_SIZE / 2,
              top: player.y - PLAYER_SIZE / 2,
              opacity: player.isDead ? 0.3 : 1,
              borderColor: player.hasShield ? COLORS.shield : 'transparent',
              borderWidth: player.hasShield ? 3 : 0,
            },
          ]}
        >
          <View style={[styles.eye, { left: 8, top: 12 }]} />
          <View style={[styles.eye, { right: 8, top: 12 }]} />
          <View style={[styles.mouth, { left: 10, bottom: 10 }]} />
        </View>

        {/* Opponents */}
        {opponents.map((opp) => (
          <View
            key={opp.id}
            style={[
              styles.opponent,
              {
                left: opp.x - OPPONENT_SIZE / 2,
                top: opp.y - OPPONENT_SIZE / 2,
              },
            ]}
          />
        ))}

        {/* Bosses */}
        {bosses.map((boss) => (
          <View
            key={boss.id}
            style={[
              styles.boss,
              {
                left: boss.x - BOSS_SIZE / 2,
                top: boss.y - BOSS_SIZE / 2,
              },
            ]}
          >
            <View style={[styles.eye, { left: 12, top: 15 }]} />
            <View style={[styles.eye, { right: 12, top: 15 }]} />
            <View style={[styles.mouth, { left: 12, bottom: 10 }]} />
          </View>
        ))}

        {/* Dead entities (stars) */}
        {deadEntities.map((entity) => (
          <View
            key={entity.id}
            style={[
              styles.star,
              {
                left: entity.x - 17.5,
                top: entity.y - 17.5,
              },
            ]}
          >
            <Text style={styles.starText}>⭐</Text>
          </View>
        ))}

        {/* Player Bullets */}
        {playerBullets.map((bullet) => (
          <View
            key={bullet.id}
            style={[
              styles.bullet,
              styles.playerBullet,
              {
                left: bullet.x - BULLET_SIZE / 2,
                top: bullet.y - BULLET_SIZE / 2,
              },
            ]}
          />
        ))}

        {/* Enemy Bullets */}
        {enemyBullets.map((bullet) => (
          <View
            key={bullet.id}
            style={[
              styles.bullet,
              styles.enemyBullet,
              {
                left: bullet.x - BULLET_SIZE / 2,
                top: bullet.y - BULLET_SIZE / 2,
              },
            ]}
          />
        ))}

        {/* Power-ups */}
        {powerUps.map((powerUp) => (
          <View
            key={powerUp.id}
            style={[
              styles.powerUp,
              {
                left: powerUp.x - POWERUP_SIZE / 2,
                top: powerUp.y - POWERUP_SIZE / 2,
                backgroundColor: COLORS[powerUp.type],
              },
            ]}
          />
        ))}
      </View>

      {/* Game Over Screen */}
      {gameOver && (
        <View style={styles.gameOverScreen}>
          <View style={styles.gameOverContent}>
            <Text style={styles.gameOverTitle}>
              {victory ? '🎉 YOU WIN! 🎉' : '💀 GAME OVER 💀'}
            </Text>
            <Text style={styles.gameOverScore}>Final Score: {score}</Text>
            <Text style={styles.gameOverHighScore}>High Score: {highScore}</Text>
            <TouchableOpacity onPress={handleRestart} style={styles.restartButton}>
              <Text style={styles.restartText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Instructions Screen */}
      {showInstructions && (
        <View style={styles.gameOverScreen}>
          <View style={styles.gameOverContent}>
            <Text style={styles.gameOverTitle}>🎮 SHOOTING GAME 🎮</Text>
            <Text style={styles.instructionsText}>
              ▪ Use D-pad to move{'\n'}
              ▪ Press 🔫 to shoot{'\n'}
              ▪ Destroy all enemies{'\n'}
              ▪ Defeat the boss to win!{'\n\n'}
              Power-ups:{'\n'}
              🟡 Shield - Invincibility{'\n'}
              🔴 Rapid Fire - Faster shots{'\n'}
              🟢 Health - Extra life
            </Text>
            <TouchableOpacity onPress={handleStartGame} style={styles.restartButton}>
              <Text style={styles.restartText}>START GAME</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Touch Controls */}
      <View style={styles.touchControls}>
        <View style={styles.dPad}>
          <TouchableOpacity
            style={[styles.touchBtn, styles.btnUp]}
            onPressIn={() => handleTouchStart('up')}
            onPressOut={() => handleTouchEnd('up')}
          >
            <Text style={styles.btnText}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.touchBtn, styles.btnLeft]}
            onPressIn={() => handleTouchStart('left')}
            onPressOut={() => handleTouchEnd('left')}
          >
            <Text style={styles.btnText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.touchBtn, styles.btnRight]}
            onPressIn={() => handleTouchStart('right')}
            onPressOut={() => handleTouchEnd('right')}
          >
            <Text style={styles.btnText}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.touchBtn, styles.btnDown]}
            onPressIn={() => handleTouchStart('down')}
            onPressOut={() => handleTouchEnd('down')}
          >
            <Text style={styles.btnText}>↓</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.touchBtn, styles.btnShoot]} onPress={handleShoot}>
          <Text style={styles.btnText}>🔫</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  infoItem: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.ui,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.opponent,
  },
  highScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  livesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.player,
  },
  pauseButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.ui,
  },
  pauseText: {
    fontSize: 18,
    color: '#FFF',
  },
  gameCanvas: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.background,
    borderWidth: 3,
    borderColor: COLORS.ui,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: COLORS.player,
  },
  opponent: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: OPPONENT_SIZE / 2,
    borderRightWidth: OPPONENT_SIZE / 2,
    borderBottomWidth: OPPONENT_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.opponent,
  },
  boss: {
    position: 'absolute',
    width: BOSS_SIZE,
    height: BOSS_SIZE,
    backgroundColor: COLORS.boss,
    borderRadius: BOSS_SIZE * 0.2,
  },
  star: {
    position: 'absolute',
    width: 35,
    height: 35,
  },
  starText: {
    fontSize: 35,
  },
  bullet: {
    position: 'absolute',
    width: BULLET_SIZE,
    height: BULLET_SIZE,
    borderRadius: BULLET_SIZE / 2,
  },
  playerBullet: {
    backgroundColor: COLORS.playerBullet,
  },
  enemyBullet: {
    backgroundColor: COLORS.enemyBullet,
  },
  powerUp: {
    position: 'absolute',
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    borderRadius: POWERUP_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  eye: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: COLORS.dark,
  },
  mouth: {
    position: 'absolute',
    width: 16,
    height: 4,
    backgroundColor: COLORS.dark,
  },
  gameOverScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gameOverContent: {
    backgroundColor: COLORS.background,
    padding: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.ui,
    alignItems: 'center',
    minWidth: 300,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  gameOverScore: {
    fontSize: 24,
    color: COLORS.opponent,
    marginBottom: 10,
  },
  gameOverHighScore: {
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 30,
  },
  instructionsText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
    marginBottom: 30,
    textAlign: 'left',
  },
  restartButton: {
    backgroundColor: COLORS.player,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  restartText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  touchControls: {
    flexDirection: 'row',
    marginTop: 20,
    width: SCREEN_WIDTH * 0.8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dPad: {
    position: 'relative',
    width: 150,
    height: 150,
  },
  touchBtn: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.ui,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.player,
  },
  btnText: {
    fontSize: 24,
    color: '#FFF',
  },
  btnUp: {
    top: 0,
    left: 50,
  },
  btnDown: {
    bottom: 0,
    left: 50,
  },
  btnLeft: {
    top: 50,
    left: 0,
  },
  btnRight: {
    top: 50,
    right: 0,
  },
  btnShoot: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.opponent,
    borderWidth: 3,
    borderColor: '#FFF',
  },
});
