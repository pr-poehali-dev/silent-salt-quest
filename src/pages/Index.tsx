import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 50;
const PLAYER_SPEED = 3;

interface Position {
  x: number;
  y: number;
}

interface Character {
  id: string;
  name: string;
  position: Position;
  dialogue: string[];
  emoji?: string;
  met: boolean;
}

const Index = () => {
  const [playerPos, setPlayerPos] = useState<Position>({ x: 100, y: 300 });
  const [currentDialogue, setCurrentDialogue] = useState<string | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [gameStage, setGameStage] = useState(0);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<Position>({ x: 0, y: 0 });
  const initialDistanceRef = useRef<number>(0);

  const characters: Character[] = [
    {
      id: 'taph',
      name: 'Taph',
      position: { x: 300, y: 250 },
      dialogue: [
        'Привет! Я Taph из Forsaken!',
        '👋 Привет!',
        '🫵 Ты...',
        '🗿 Говори?',
        '🤷 Нет?',
        '*Silent Salt качает головой*',
        'Хм, похоже это не работает...'
      ],
      emoji: '👤',
      met: false
    },
    {
      id: 'jason',
      name: 'Jason Voorhees',
      position: { x: 500, y: 300 },
      dialogue: [
        '*Появляется из тени*',
        'Ki ki ki... ma ma ma...',
        'Ki ki... ma?',
        '*Silent Salt смотрит в недоумении*',
        '*Jason пожимает плечами*'
      ],
      emoji: '🔪',
      met: false
    },
    {
      id: 'gaster',
      name: 'W.D. Gaster',
      position: { x: 400, y: 450 },
      dialogue: [
        '*Вы провалились в черную бездну*',
        '✋︎ ⧫︎♒︎♓︎■︎🙵 ⍓︎□︎◆︎🕯︎❒︎♏︎ ♋︎ ●︎♓︎⧫︎⧫︎●︎♏︎...',
        '□︎◆︎⧫︎ □︎♐︎ ⧫︎□︎◆︎♍︎♒︎ ⬥︎♓︎⧫︎♒︎ ❒︎♏︎♋︎●︎♓︎⧫︎⍓︎📪︎',
        '♌︎◆︎♎︎♎︎⍓︎📬︎',
        '*Гастер отправляет вас обратно*'
      ],
      emoji: '👁️',
      met: false
    },
    {
      id: 'nox',
      name: 'Нокс',
      position: { x: 650, y: 200 },
      dialogue: [
        '*Вы вернулись в Cookie Run Kingdom*',
        'Silent Salt! Наконец-то я тебя нашел!',
        'Я знаю, что ты не можешь говорить...',
        'Но я научу тебя! Повторяй за мной:',
        'При-вет!',
        '*Silent Salt пытается*',
        '...П...Пр...Привет!',
        '🎉 Отлично! Ты заговорил!'
      ],
      emoji: '🐴',
      met: false
    }
  ];

  const [charStates, setCharStates] = useState<Character[]>(characters);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        handleInteraction();
      }
      setKeys((prev) => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentDialogue, dialogueIndex, currentCharacter, playerPos, charStates]);

  useEffect(() => {
    if (currentDialogue) return;

    const interval = setInterval(() => {
      setPlayerPos((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        if (keys['ArrowLeft'] || keys['a'] || keys['A']) newX -= PLAYER_SPEED;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) newX += PLAYER_SPEED;
        if (keys['ArrowUp'] || keys['w'] || keys['W']) newY -= PLAYER_SPEED;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) newY += PLAYER_SPEED;

        if (joystickActive) {
          newX += joystickPos.x * PLAYER_SPEED * 0.1;
          newY += joystickPos.y * PLAYER_SPEED * 0.1;
        }

        newX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX));
        newY = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY));

        return { x: newX, y: newY };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [keys, joystickActive, joystickPos, currentDialogue]);

  const handleInteraction = useCallback(() => {
    if (currentDialogue) {
      if (dialogueIndex < (currentCharacter?.dialogue.length || 0) - 1) {
        setDialogueIndex((prev) => prev + 1);
      } else {
        setCurrentDialogue(null);
        setCurrentCharacter(null);
        setDialogueIndex(0);
        
        if (currentCharacter) {
          setCharStates((prev) =>
            prev.map((char) =>
              char.id === currentCharacter.id ? { ...char, met: true } : char
            )
          );
          setGameStage((prev) => prev + 1);
        }
      }
      return;
    }

    charStates.forEach((char) => {
      if (char.met) return;

      const distance = Math.sqrt(
        Math.pow(playerPos.x - char.position.x, 2) +
        Math.pow(playerPos.y - char.position.y, 2)
      );

      if (distance < 80) {
        setCurrentCharacter(char);
        setCurrentDialogue(char.dialogue[0]);
        setDialogueIndex(0);
      }
    });
  }, [playerPos, charStates, currentDialogue, dialogueIndex, currentCharacter]);

  useEffect(() => {
    if (currentCharacter && currentDialogue) {
      setCurrentDialogue(currentCharacter.dialogue[dialogueIndex]);
    }
  }, [dialogueIndex, currentCharacter]);

  const handleJoystickStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setJoystickActive(true);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    const maxDistance = 50;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      setJoystickPos({
        x: Math.cos(angle) * maxDistance,
        y: Math.sin(angle) * maxDistance
      });
    } else {
      setJoystickPos({ x: deltaX, y: deltaY });
    }
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
  };

  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.sqrt(
        Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
        Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
      );
      initialDistanceRef.current = dist;
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current > 0) {
      const dist = Math.sqrt(
        Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
        Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
      );
      const newScale = (dist / initialDistanceRef.current) * scale;
      setScale(Math.max(0.5, Math.min(2, newScale)));
    }
  };

  const getBackgroundGradient = () => {
    if (currentCharacter?.id === 'gaster') {
      return 'linear-gradient(to bottom, #000000, #1a1a1a)';
    }
    
    switch (gameStage) {
      case 0:
      case 1:
        return 'linear-gradient(to bottom, #87CEEB, #98D8C8)';
      case 2:
        return 'linear-gradient(to bottom, #2C3E50, #4A5F7F)';
      case 3:
        return 'linear-gradient(to bottom, #000000, #1a1a1a)';
      case 4:
        return 'linear-gradient(to bottom, #FFB6D9, #D8BFD8)';
      default:
        return 'linear-gradient(to bottom, #87CEEB, #98D8C8)';
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-purple-100 to-pink-100">
      <div className="relative w-full h-full max-w-4xl max-h-[600px]">
        <div
          ref={gameRef}
          className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: getBackgroundGradient(),
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            transition: 'background 0.5s ease'
          }}
          onTouchStart={(e) => {
            handlePinchStart(e);
          }}
          onTouchMove={(e) => {
            handlePinchMove(e);
          }}
        >
          <div className="absolute top-4 left-4 bg-white/90 px-6 py-3 rounded-full shadow-lg">
            <p className="font-bold text-lg text-gray-800">
              Встреч: {charStates.filter(c => c.met).length}/4
            </p>
          </div>

          <div
            className="absolute transition-all duration-100 flex items-center justify-center"
            style={{
              left: `${playerPos.x}px`,
              top: `${playerPos.y}px`,
              width: `${PLAYER_SIZE}px`,
              height: `${PLAYER_SIZE}px`
            }}
          >
            <img
              src="https://cdn.poehali.dev/files/89209495-e385-4b5f-ba5f-3ed0a5463874.png"
              alt="Silent Salt"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>

          {charStates.map((char) => !char.met && (
            <div
              key={char.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${char.position.x}px`,
                top: `${char.position.y}px`,
                width: '60px',
                height: '60px'
              }}
            >
              <div className="relative w-full h-full">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-4xl shadow-xl border-4 border-purple-400 animate-bounce">
                  {char.emoji}
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                  {char.name}
                </div>
              </div>
            </div>
          ))}

          {currentDialogue && currentCharacter && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 to-gray-900/90 p-6 animate-in slide-in-from-bottom duration-300">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                    {currentCharacter.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white mb-2">{currentCharacter.name}</h3>
                    <p className="text-white/90 text-lg leading-relaxed">{currentDialogue}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleInteraction}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-bold shadow-lg"
                  >
                    {dialogueIndex < (currentCharacter.dialogue.length || 0) - 1 ? 'Далее' : 'Закрыть'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isMobile && (
          <>
            <div
              className="fixed bottom-8 left-8 w-32 h-32 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center"
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
            >
              <div
                className="w-16 h-16 bg-purple-500/60 rounded-full transition-transform shadow-lg"
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
                }}
              />
            </div>

            <Button
              onClick={handleInteraction}
              className="fixed bottom-8 right-8 w-20 h-20 bg-purple-600/80 hover:bg-purple-700/80 rounded-full shadow-2xl flex items-center justify-center"
            >
              <Icon name="Hand" size={32} className="text-white" />
            </Button>
          </>
        )}

        {!isMobile && (
          <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-full shadow-lg">
            <p className="text-sm text-gray-700 font-medium">
              Управление: ← → ↑ ↓ / WASD | Пробел - взаимодействие
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
