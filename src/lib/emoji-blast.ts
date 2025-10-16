import { emojiBlast } from 'emoji-blast';

export const blastEmoji = (emoji: string, element?: HTMLElement) => {
  emojiBlast({
    emojiCount: 25,
    emojis: [emoji],
    position: element
      ? () => {
          const rect = element.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }
      : undefined,
    physics: {
      fontSize: { max: 54, min: 32 },
      gravity: 0.35,
      initialVelocities: {
        rotation: { max: 14, min: -14 },
        x: { max: 17, min: -17 },
        y: { max: -17, min: -20 },
      },
      rotationDeceleration: 0.98,
    },
  });
};

// Varied celebration emojis for task completion
const celebrationEmojis = ['✨', '🎉', '🌟', '💫', '⭐', '🎊', '🔥', '💪', '🎯', '🏆'];

export const blastEmojis = (emojis: string[], element?: HTMLElement) => {
  emojiBlast({
    emojiCount: 30,
    emojis: emojis,
    position: element
      ? () => {
          const rect = element.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }
      : undefined,
    physics: {
      fontSize: { max: 48, min: 28 },
      gravity: 0.4,
      initialVelocities: {
        rotation: { max: 16, min: -16 },
        x: { max: 20, min: -20 },
        y: { max: -20, min: -25 },
      },
      rotationDeceleration: 0.97,
    },
  });
};

// Preset blasts for common actions
export const blastSuccess = (element?: HTMLElement) =>
  blastEmoji('✨', element);

export const blastComplete = (element?: HTMLElement) => {
  // Randomly select 2-3 celebration emojis
  const selectedEmojis = celebrationEmojis
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 2) + 2);
  
  blastEmojis(selectedEmojis, element);
};

export const blastKudos = (element?: HTMLElement) =>
  blastEmoji('❤️', element);

export const blastCelebration = (element?: HTMLElement) =>
  blastEmoji('🎉', element);

export const blastFire = (element?: HTMLElement) =>
  blastEmoji('🔥', element);

