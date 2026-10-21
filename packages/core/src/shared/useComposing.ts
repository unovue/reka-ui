import { computed, nextTick, ref } from 'vue'

// Scripts typed through an IME with a candidate/conversion step (Chinese,
// Japanese, Korean, Bopomofo). When the composing text contains any of these,
// the value is incomplete until `compositionend` and must not be processed early.
const imeScriptRE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}]/u
const androidRE = /android/i

function isAndroid() {
  return typeof navigator !== 'undefined' && androidRE.test(navigator.userAgent)
}

export function useComposing(onEnd?: (event: CompositionEvent) => void) {
  const isComposing = ref(false)
  const isImeComposition = ref(true)
  // Sticky for the whole composition session: once IME script has been seen, a
  // later plain-text update cannot downgrade the session back to live.
  const sawImeScript = ref(false)

  // Whether `input` events should wait for `compositionend` before being
  // processed. Android soft keyboards (Gboard, Samsung Keyboard, …) keep the
  // current Latin word in composition for autocorrect and only commit it on
  // space/Enter/suggestion tap, so deferring there would freeze live filtering
  // until the word is committed (nuxt/ui#6717). IME composition still defers so
  // incomplete values never leak (#2540).
  //
  // Known limitation: on Android, the *leading* plain-text updates of a
  // transliterating IME are indistinguishable from soft-keyboard autocorrect —
  // romaji-mode Japanese ("ka" → "か"), Vietnamese Telex, Thai and Indic
  // transliteration all emit Latin before any IME script appears — so those
  // first keystrokes do filter live. Once IME script shows up the session
  // becomes deferred and stays deferred, and the committed value is always
  // correct; only the transient popup state is wrong.
  const shouldDeferInput = computed(() => isComposing.value && isImeComposition.value)

  function handleCompositionStart() {
    isComposing.value = true
    isImeComposition.value = true
    sawImeScript.value = false
  }

  function handleCompositionUpdate(event: CompositionEvent) {
    // Empty data (e.g. backspacing the whole composed word) keeps the previous
    // classification.
    if (!event.data)
      return
    if (imeScriptRE.test(event.data)) {
      isImeComposition.value = true
      sawImeScript.value = true
    }
    else if (isAndroid() && !sawImeScript.value) {
      // Plain-text composition on Android is the soft keyboard buffering a
      // word for autocorrect — process input live. Desktop IMEs also compose
      // plain Latin before conversion (e.g. Pinyin preedit "xiang" for 香,
      // the exact repro of #2540), so everywhere else deferring stays the
      // safe default.
      isImeComposition.value = false
    }
  }

  function handleCompositionEnd(event: CompositionEvent) {
    nextTick(() => {
      isComposing.value = false
      onEnd?.(event)
    })
  }

  return { isComposing, shouldDeferInput, handleCompositionStart, handleCompositionUpdate, handleCompositionEnd }
}
