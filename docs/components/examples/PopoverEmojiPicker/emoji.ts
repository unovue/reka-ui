export interface Emoji {
  char: string
  name: string
  /**
   * Matching a single display name is not enough: nobody searching for 😀 types
   * "grinning face". Keywords carry the words people actually reach for.
   */
  keywords: string[]
}

export const emojis: Emoji[] = [
  { char: '😀', name: 'grinning face', keywords: ['smile', 'happy', 'grin', 'joy'] },
  { char: '😃', name: 'grinning face with big eyes', keywords: ['smile', 'happy', 'excited'] },
  { char: '😄', name: 'grinning face with smiling eyes', keywords: ['smile', 'happy', 'laugh'] },
  { char: '😁', name: 'beaming face', keywords: ['smile', 'happy', 'grin', 'teeth'] },
  { char: '😆', name: 'grinning squinting face', keywords: ['laugh', 'lol', 'happy'] },
  { char: '😅', name: 'grinning face with sweat', keywords: ['laugh', 'nervous', 'relief', 'phew'] },
  { char: '🤣', name: 'rolling on the floor laughing', keywords: ['laugh', 'lol', 'rofl', 'funny'] },
  { char: '😂', name: 'face with tears of joy', keywords: ['laugh', 'lol', 'cry', 'funny'] },
  { char: '🙂', name: 'slightly smiling face', keywords: ['smile', 'happy'] },
  { char: '🙃', name: 'upside down face', keywords: ['smile', 'sarcasm', 'irony', 'flip'] },
  { char: '😉', name: 'winking face', keywords: ['wink', 'flirt', 'joke'] },
  { char: '😊', name: 'smiling face with smiling eyes', keywords: ['smile', 'happy', 'blush', 'shy'] },
  { char: '😇', name: 'smiling face with halo', keywords: ['smile', 'angel', 'innocent'] },
  { char: '🥰', name: 'smiling face with hearts', keywords: ['smile', 'love', 'heart', 'adore'] },
  { char: '😍', name: 'smiling face with heart eyes', keywords: ['smile', 'love', 'heart', 'crush'] },
  { char: '🤩', name: 'star struck', keywords: ['star', 'wow', 'amazed', 'excited'] },
  { char: '😘', name: 'face blowing a kiss', keywords: ['kiss', 'love', 'heart'] },
  { char: '😋', name: 'face savoring food', keywords: ['yum', 'tasty', 'tongue', 'delicious'] },
  { char: '😜', name: 'winking face with tongue', keywords: ['tongue', 'wink', 'silly', 'joke'] },
  { char: '🤪', name: 'zany face', keywords: ['crazy', 'silly', 'goofy', 'wild'] },
  { char: '🤨', name: 'face with raised eyebrow', keywords: ['suspicious', 'doubt', 'skeptical', 'hmm'] },
  { char: '🧐', name: 'face with monocle', keywords: ['inspect', 'curious', 'think', 'examine'] },
  { char: '🤓', name: 'nerd face', keywords: ['nerd', 'geek', 'glasses', 'smart'] },
  { char: '😎', name: 'smiling face with sunglasses', keywords: ['cool', 'sunglasses', 'smile'] },
  { char: '🥳', name: 'partying face', keywords: ['party', 'celebrate', 'birthday', 'hooray'] },
  { char: '😏', name: 'smirking face', keywords: ['smirk', 'smug', 'sly'] },
  { char: '😢', name: 'crying face', keywords: ['cry', 'sad', 'tear', 'upset'] },
  { char: '😭', name: 'loudly crying face', keywords: ['cry', 'sad', 'sob', 'tears'] },
  { char: '😤', name: 'face with steam from nose', keywords: ['angry', 'mad', 'frustrated', 'triumph'] },
  { char: '😡', name: 'enraged face', keywords: ['angry', 'mad', 'rage', 'furious'] },
  { char: '🤯', name: 'exploding head', keywords: ['mind blown', 'shock', 'wow', 'amazed'] },
  { char: '😱', name: 'face screaming in fear', keywords: ['scream', 'scared', 'shock', 'fear'] },
  { char: '🥵', name: 'hot face', keywords: ['hot', 'heat', 'sweat', 'warm'] },
  { char: '🥶', name: 'cold face', keywords: ['cold', 'freeze', 'ice', 'chilly'] },
  { char: '😴', name: 'sleeping face', keywords: ['sleep', 'tired', 'zzz', 'bored'] },
  { char: '🤒', name: 'face with thermometer', keywords: ['sick', 'ill', 'fever', 'unwell'] },
  { char: '🤠', name: 'cowboy hat face', keywords: ['cowboy', 'hat', 'yeehaw'] },
  { char: '🤖', name: 'robot', keywords: ['robot', 'bot', 'ai', 'machine'] },
  { char: '👻', name: 'ghost', keywords: ['ghost', 'boo', 'halloween', 'spooky'] },
  { char: '💀', name: 'skull', keywords: ['skull', 'dead', 'death', 'halloween'] },
  { char: '👽', name: 'alien', keywords: ['alien', 'ufo', 'space', 'extraterrestrial'] },
  { char: '🎃', name: 'jack o lantern', keywords: ['pumpkin', 'halloween', 'spooky'] },
  { char: '👍', name: 'thumbs up', keywords: ['thumbs up', 'like', 'yes', 'approve', 'ok', 'good'] },
  { char: '👎', name: 'thumbs down', keywords: ['thumbs down', 'dislike', 'no', 'bad'] },
  { char: '👏', name: 'clapping hands', keywords: ['clap', 'applause', 'bravo', 'well done'] },
  { char: '🙌', name: 'raising hands', keywords: ['hooray', 'celebrate', 'praise', 'yay'] },
  { char: '🙏', name: 'folded hands', keywords: ['please', 'thanks', 'pray', 'hope'] },
  { char: '💪', name: 'flexed biceps', keywords: ['muscle', 'strong', 'flex', 'power'] },
  { char: '🤝', name: 'handshake', keywords: ['handshake', 'deal', 'agree', 'shake'] },
  { char: '✌️', name: 'victory hand', keywords: ['peace', 'victory', 'two'] },
  { char: '🤞', name: 'crossed fingers', keywords: ['luck', 'hope', 'fingers crossed'] },
  { char: '👋', name: 'waving hand', keywords: ['wave', 'hello', 'hi', 'bye', 'goodbye'] },
  { char: '❤️', name: 'red heart', keywords: ['heart', 'love', 'red'] },
  { char: '🧡', name: 'orange heart', keywords: ['heart', 'love', 'orange'] },
  { char: '💛', name: 'yellow heart', keywords: ['heart', 'love', 'yellow'] },
  { char: '💚', name: 'green heart', keywords: ['heart', 'love', 'green'] },
  { char: '💙', name: 'blue heart', keywords: ['heart', 'love', 'blue'] },
  { char: '💜', name: 'purple heart', keywords: ['heart', 'love', 'purple'] },
  { char: '🔥', name: 'fire', keywords: ['fire', 'hot', 'lit', 'flame'] },
  { char: '✨', name: 'sparkles', keywords: ['sparkle', 'shiny', 'stars', 'magic', 'clean'] },
  { char: '🎉', name: 'party popper', keywords: ['party', 'celebrate', 'congrats', 'tada'] },
  { char: '🚀', name: 'rocket', keywords: ['rocket', 'launch', 'ship', 'space', 'fast'] },
  { char: '⚡', name: 'high voltage', keywords: ['lightning', 'fast', 'power', 'zap', 'electric'] },
  { char: '🌈', name: 'rainbow', keywords: ['rainbow', 'pride', 'colors'] },
  { char: '☕', name: 'hot beverage', keywords: ['coffee', 'tea', 'drink', 'cafe'] },
  { char: '🍕', name: 'pizza', keywords: ['pizza', 'food', 'slice', 'italian'] },
  { char: '🍩', name: 'doughnut', keywords: ['donut', 'sweet', 'dessert', 'food'] },
  { char: '🍎', name: 'red apple', keywords: ['apple', 'fruit', 'food', 'red'] },
  { char: '🐶', name: 'dog face', keywords: ['dog', 'puppy', 'pet', 'animal'] },
  { char: '🐱', name: 'cat face', keywords: ['cat', 'kitten', 'pet', 'animal'] },
  { char: '🦊', name: 'fox', keywords: ['fox', 'animal', 'orange'] },
  { char: '🐢', name: 'turtle', keywords: ['turtle', 'slow', 'animal', 'tortoise'] },
]

export const COLUMNS = 8

const WHITESPACE_RE = /\s+/

/**
 * Every query token has to match somewhere, so "red heart" and "heart red" both
 * land, and a partial word narrows the grid as you type.
 */
export function searchEmojis(
  query: string,
  contains: (haystack: string, needle: string) => boolean,
) {
  const tokens = query.trim().toLowerCase().split(WHITESPACE_RE).filter(Boolean)
  if (!tokens.length)
    return emojis

  return emojis.filter((emoji) => {
    const haystack = [emoji.name, ...emoji.keywords]
    return tokens.every(token => haystack.some(entry => contains(entry, token)))
  })
}
